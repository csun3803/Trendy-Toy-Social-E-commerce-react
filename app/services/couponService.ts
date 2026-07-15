import api from '../utils/api';
import type {
  ApiResponse,
  UserCouponDTO,
  AvailableCouponDTO,
} from '../types';

// 获取我的券列表（支持按状态筛选）
export const getMyCoupons = async (status?: string) => {
  try {
    const params: any = {};
    if (status) params.status = status;
    const response = await api.get<ApiResponse<UserCouponDTO[]>>(
      '/coupons/mine',
      params,
    );
    return response;
  } catch (error) {
    console.error('Failed to get my coupons:', error);
    throw error;
  }
};

// 获取下单页可用券
export const getAvailableCoupons = async (orderAmount: number) => {
  try {
    const params: any = { orderAmount };
    const response = await api.get<ApiResponse<AvailableCouponDTO[]>>(
      '/coupons/available',
      params,
    );
    return response;
  } catch (error) {
    console.error('Failed to get available coupons:', error);
    throw error;
  }
};
