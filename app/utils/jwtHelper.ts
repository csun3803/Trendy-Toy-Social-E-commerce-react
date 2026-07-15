import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 从JWT token中解析用户ID
 * @returns 用户ID，如果解析失败返回null
 */
export const getUserIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return null;
    }

    // JWT token格式: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('无效的token格式');
      return null;
    }

    // 解析payload部分（Base64编码）
    const payload = parts[1];
    const decoded = atob(payload);
    const payloadObj = JSON.parse(decoded);

    // 从payload中获取用户ID
    // 根据后端JWT实现，用户ID可能在userId、sub或id字段中
    const userId = payloadObj.userId || payloadObj.sub || payloadObj.id || payloadObj.adminId;
    
    return userId || null;
  } catch (error) {
    console.error('解析token失败');
    return null;
  }
};

/**
 * 获取用户信息
 * @returns 用户信息对象，如果获取失败返回null
 */
export const getUserInfo = async (): Promise<any | null> => {
  try {
    const userInfoStr = await AsyncStorage.getItem('userInfo');
    if (!userInfoStr) {
      return null;
    }
    return JSON.parse(userInfoStr);
  } catch (error) {
    console.error('获取用户信息失败');
    return null;
  }
};

/**
 * 检查用户是否已登录
 * @returns 是否已登录
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  } catch (error) {
    console.error('检查登录状态失败');
    return false;
  }
};

/**
 * 检查 token 是否已过期，如果过期则清除登录状态
 * 使用7天长期token，不再刷新
 */
export const checkAndRefreshToken = async (): Promise<void> => {
  try {
    const tokenExpireTime = await AsyncStorage.getItem('tokenExpireTime');
    if (!tokenExpireTime) {
      return;
    }

    const expireTime = parseInt(tokenExpireTime);
    const now = Date.now();

    // 如果 token 已过期，清除登录状态
    if (now >= expireTime) {
      console.log('[Token] 已过期，清除登录状态');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('tokenExpireTime');
      await AsyncStorage.removeItem('userInfo');
    }
  } catch (error) {
    console.error('[Token] 检查 token 过期失败:', error);
  }
};
