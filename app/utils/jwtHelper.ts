import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

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
 * 检查 token 是否即将过期并主动刷新
 * @param提前刷新时间（分钟），默认5分钟
 */
export const checkAndRefreshToken = async (advanceMinutes: number = 5): Promise<void> => {
  try {
    const tokenExpireTime = await AsyncStorage.getItem('tokenExpireTime');
    if (!tokenExpireTime) {
      return;
    }

    const expireTime = parseInt(tokenExpireTime);
    const now = Date.now();
    const advanceTime = advanceMinutes * 60 * 1000;

    // 如果 token 在 advanceMinutes 分钟内过期，主动刷新
    if (expireTime - now < advanceTime) {
      console.log('[Token] 即将过期，开始主动刷新');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('[Token] 没有 refreshToken，无法刷新');
        return;
      }

      try {
        const response = await fetch(`${api['baseUrl']}/user/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();
        if (data.code === 200) {
          // 保存新的 token
          await AsyncStorage.setItem('token', data.data.accessToken);
          await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
          
          // 保存新的过期时间
          const newExpireTime = Date.now() + data.data.expiresIn * 1000;
          await AsyncStorage.setItem('tokenExpireTime', newExpireTime.toString());
          
          console.log('[Token] 主动刷新成功，新的过期时间:', new Date(newExpireTime).toLocaleString());
        } else {
          console.log('[Token] 主动刷新失败:', data.message);
        }
      } catch (error) {
        console.error('[Token] 主动刷新请求失败:', error);
      }
    } else {
      console.log('[Token] 未过期，无需刷新');
    }
  } catch (error) {
    console.error('[Token] 检查 token 过期失败:', error);
  }
};
