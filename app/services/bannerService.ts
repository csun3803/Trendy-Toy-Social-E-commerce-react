import api from '../utils/api';
import type { ApiResponse } from '../types';

export interface BannerItem {
  bannerId: string;
  title: string;
  imageUrl: string;
  sortOrder: number;
  jumpType: string; // NONE / PRODUCT / ACTIVITY / BLIND_BOX / EXTERNAL_LINK
  jumpValue: string;
  status: string;
}

// 获取启用的轮播图列表
export const getBannerList = async () => {
  const response = await api.get<ApiResponse<BannerItem[]>>('/banner/list');
  return response.data;
};
