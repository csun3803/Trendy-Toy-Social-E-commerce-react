import api from '../utils/api';
import type { ApiResponse } from '../types';

// 点赞/取消点赞
export const toggleLike = async (targetType: string, targetId: string) => {
  const response = await api.post<ApiResponse<{ liked: boolean; likeCount: number }>>('/interaction/like', {
    targetType,
    targetId,
  });
  return response.data;
};

// 检查是否已点赞
export const checkLiked = async (targetType: string, targetId: string) => {
  const response = await api.get<ApiResponse<{ liked: boolean; likeCount: number }>>('/interaction/like/check', {
    targetType,
    targetId,
  });
  return response.data;
};

// 收藏/取消收藏
export const toggleFavorite = async (targetType: string, targetId: string) => {
  const response = await api.post<ApiResponse<{ favorited: boolean; favoriteCount: number }>>('/interaction/favorite', {
    targetType,
    targetId,
  });
  return response.data;
};

// 检查是否已收藏
export const checkFavorited = async (targetType: string, targetId: string) => {
  const response = await api.get<ApiResponse<{ favorited: boolean; favoriteCount: number }>>('/interaction/favorite/check', {
    targetType,
    targetId,
  });
  return response.data;
};

// 关注/取消关注
export const toggleFollow = async (targetUserId: string) => {
  const response = await api.post<ApiResponse<{ following: boolean; followerCount: number }>>('/interaction/follow', {
    targetId: targetUserId,
  });
  return response.data;
};

// 检查是否已关注
export const checkFollowing = async (targetUserId: string) => {
  const response = await api.get<ApiResponse<{ following: boolean }>>('/interaction/follow/check', {
    targetId: targetUserId,
  });
  return response.data;
};

// 获取关注列表
export const getFollowingList = async () => {
  const response = await api.get<ApiResponse<Array<{
    userId: string;
    username: string;
    avatarUrl: string;
    followerCount: number;
  }>>>('/interaction/following');
  return response.data;
};

// 获取粉丝列表
export const getFollowerList = async () => {
  const response = await api.get<ApiResponse<Array<{
    userId: string;
    username: string;
    avatarUrl: string;
    followerCount: number;
  }>>>('/interaction/followers');
  return response.data;
};

// 获取用户关注/粉丝数
export const getInteractionStats = async (userId?: string) => {
  const params: any = {};
  if (userId) params.userId = userId;
  const response = await api.get<ApiResponse<{
    followingCount: number;
    followerCount: number;
  }>>('/interaction/stats', params);
  return response.data;
};
