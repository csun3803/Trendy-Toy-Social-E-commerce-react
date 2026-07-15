import api from '../utils/api';
import type { ApiResponse } from '../types';

export interface UserInfo {
  userId: string;
  username: string;
  avatarUrl: string;
  nickname?: string;
}

const userCache: Map<string, UserInfo> = new Map();

export const getUserInfo = async (userId: string): Promise<UserInfo | null> => {
  if (userCache.has(userId)) {
    return userCache.get(userId) || null;
  }
  
  try {
    const response = await api.get<ApiResponse<UserInfo>>(`/user/${userId}`);
    if (response.code === 200 && response.data) {
      userCache.set(userId, response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

export const getUserInfoBatch = async (userIds: string[]): Promise<Map<string, UserInfo>> => {
  const result = new Map<string, UserInfo>();
  const uncachedIds = userIds.filter(id => !userCache.has(id));
  
  if (uncachedIds.length === 0) {
    userIds.forEach(id => {
      const info = userCache.get(id);
      if (info) result.set(id, info);
    });
    return result;
  }
  
  try {
    const response = await api.post<ApiResponse<UserInfo[]>>('/user/batch', { userIds: uncachedIds });
    if (response.code === 200 && response.data) {
      response.data.forEach(user => {
        userCache.set(user.userId, user);
        result.set(user.userId, user);
      });
    }
  } catch (error) {
    console.error('批量获取用户信息失败:', error);
  }
  
  userIds.filter(id => userCache.has(id)).forEach(id => {
    const info = userCache.get(id);
    if (info) result.set(id, info);
  });
  
  return result;
};

export const clearUserCache = () => {
  userCache.clear();
};
