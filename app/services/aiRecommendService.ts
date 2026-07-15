import api from '../utils/api';
import type { ApiResponse } from '../types';

export interface RecommendSeries {
  seriesId: string;
  seriesName: string;
  description: string;
  coverImage: string;
  minPrice: number;
  fullsetPrice: number;
  status: string;
  theme: string;
  seriesHotness: number;
  salesCount: number;
}

// 个性化推荐（基于用户行为）
export const getPersonalizedRecommend = async (userId: string, limit: number = 10) => {
  try {
    const response = await api.post<ApiResponse<RecommendSeries[]>>('/ai/recommend/personalized', {
      userId,
      limit,
    });
    return response;
  } catch (error) {
    console.error('获取个性化推荐失败:', error);
    throw error;
  }
};

// 相似系列推荐
export const getSimilarRecommend = async (seriesId: string, limit: number = 6) => {
  try {
    const response = await api.get<ApiResponse<RecommendSeries[]>>(`/ai/recommend/similar/${seriesId}`, { limit });
    return response;
  } catch (error) {
    console.error('获取相似推荐失败:', error);
    throw error;
  }
};

// 热门推荐（无需登录）
export const getHotRecommend = async (limit: number = 10) => {
  try {
    const response = await api.get<ApiResponse<RecommendSeries[]>>('/ai/recommend/hot', { limit });
    return response;
  } catch (error) {
    console.error('获取热门推荐失败:', error);
    throw error;
  }
};

// 上报用户行为（供AI推荐算法使用）
// behaviorType: BROWSE / FAVORITE / UNFAVORITE / PURCHASE / SEARCH / SHARE
// targetType:   SERIES / PRODUCT / SHOP
export const reportUserBehavior = async (
  userId: string,
  behaviorType: string,
  targetType: string,
  targetId: string,
  weight: number = 1
) => {
  try {
    await api.post<ApiResponse<null>>('/ai/recommend/behavior', {
      userId,
      behaviorType,
      targetType,
      targetId,
      weight,
    });
  } catch (error) {
    // 行为上报失败不影响主流程，静默处理
    console.debug('行为上报失败(可忽略):', error);
  }
};
