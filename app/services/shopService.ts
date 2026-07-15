import api from '../utils/api';
import type { ShopInfo, SaleSeriesItem, ApiResponse } from '../types';

// 获取店铺详情 - 对应后端 GET /api/admin/shop/{shopId}
export const getShopDetail = async (shopId: string) => {
  try {
    const response = await api.get<ApiResponse<ShopInfo>>(`/admin/shop/${shopId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch shop detail:', error);
    throw error;
  }
};

// 获取店铺下的销售系列列表 - 对应后端 GET /api/sale-series/shop/{shopId}
export const getShopSaleSeries = async (shopId: string) => {
  try {
    const response = await api.get<ApiResponse<SaleSeriesItem[]>>(`/sale-series/shop/${shopId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch shop sale series:', error);
    throw error;
  }
};
