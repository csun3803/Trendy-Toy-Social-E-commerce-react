import api from '../utils/api';
import type { ApiResponse } from '../types';

export interface FavoriteItem {
  favoriteId: string;
  userId: string;
  productId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const checkFavorite = async (productId: string): Promise<boolean> => {
  try {
    const response = await api.get<ApiResponse<{ isFavorite: boolean }>>(`/favorite/check/${productId}`);
    return response.code === 200 && response.data?.isFavorite === true;
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return false;
  }
};

export const toggleFavorite = async (productId: string): Promise<{ isFavorite: boolean }> => {
  try {
    const response = await api.post<ApiResponse<{ isFavorite: boolean }>>('/favorite/toggle', { productId });
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || '操作失败');
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    throw error;
  }
};

export const addFavorite = async (productId: string): Promise<void> => {
  try {
    const response = await api.post<ApiResponse<void>>('/favorite', { productId });
    if (response.code !== 200) {
      throw new Error(response.message || '收藏失败');
    }
  } catch (error) {
    console.error('添加收藏失败:', error);
    throw error;
  }
};

export const removeFavorite = async (productId: string): Promise<void> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/favorite/${productId}`);
    if (response.code !== 200) {
      throw new Error(response.message || '取消收藏失败');
    }
  } catch (error) {
    console.error('取消收藏失败:', error);
    throw error;
  }
};

export const getFavoriteList = async (params: {
  page: number;
  size: number;
}): Promise<ApiResponse<{ items: FavoriteItem[]; total: number }>> => {
  try {
    return await api.get<ApiResponse<{ items: FavoriteItem[]; total: number }>>('/favorite', params);
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    throw error;
  }
};
