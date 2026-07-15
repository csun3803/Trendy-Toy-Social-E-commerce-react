import api from '../utils/api';
import type { ApiResponse, AfterSale, CreateAfterSaleRequest } from '../types';

// 创建售后申请
export const createAfterSale = async (request: CreateAfterSaleRequest) => {
  try {
    const response = await api.post<ApiResponse<AfterSale>>('/after-sale', request);
    return response;
  } catch (error) {
    console.error('Failed to create after sale:', error);
    throw error;
  }
};

// 获取用户售后列表
export const getUserAfterSales = async (userId: string) => {
  try {
    const response = await api.get<ApiResponse<AfterSale[]>>(`/after-sale/user/${userId}`);
    return response;
  } catch (error) {
    console.error('Failed to get user after sales:', error);
    throw error;
  }
};

// 获取售后详情
export const getAfterSaleDetail = async (afterSaleId: string) => {
  try {
    const response = await api.get<ApiResponse<AfterSale>>(`/after-sale/${afterSaleId}`);
    return response;
  } catch (error) {
    console.error('Failed to get after sale detail:', error);
    throw error;
  }
};

// 审核通过售后申请
export const approveAfterSale = async (afterSaleId: string) => {
  try {
    const response = await api.post<ApiResponse<AfterSale>>(`/after-sale/${afterSaleId}/approve`);
    return response;
  } catch (error) {
    console.error('Failed to approve after sale:', error);
    throw error;
  }
};

// 审核拒绝售后申请
export const rejectAfterSale = async (afterSaleId: string, rejectReason: string) => {
  try {
    const response = await api.post<ApiResponse<AfterSale>>(`/after-sale/${afterSaleId}/reject`, { rejectReason });
    return response;
  } catch (error) {
    console.error('Failed to reject after sale:', error);
    throw error;
  }
};

// 提交退货物流
export const submitReturnLogistics = async (afterSaleId: string, logisticsCompany: string, trackingNumber: string) => {
  try {
    const response = await api.post<ApiResponse<AfterSale>>(`/after-sale/${afterSaleId}/submit-logistics`, {
      logisticsCompany,
      trackingNumber
    });
    return response;
  } catch (error) {
    console.error('Failed to submit return logistics:', error);
    throw error;
  }
};

// 确认退货收货
export const confirmReturnReceived = async (afterSaleId: string) => {
  try {
    const response = await api.post<ApiResponse<AfterSale>>(`/after-sale/${afterSaleId}/confirm-return-received`);
    return response;
  } catch (error) {
    console.error('Failed to confirm return received:', error);
    throw error;
  }
};

// 获取订单售后列表
export const getOrderAfterSales = async (orderId: string) => {
  try {
    const response = await api.get<ApiResponse<AfterSale[]>>(`/after-sale/order/${orderId}`);
    return response;
  } catch (error) {
    console.error('Failed to get order after sales:', error);
    throw error;
  }
};

// 申请平台介入（仅当商家拒绝售后申请后才能调用）
export const applyPlatformIntervention = async (afterSaleId: string, reason: string, userId?: string) => {
  try {
    const response = await api.post<ApiResponse<AfterSale>>(`/after-sale/${afterSaleId}/apply-intervention`, {
      reason,
      userId,
    });
    return response;
  } catch (error) {
    console.error('Failed to apply platform intervention:', error);
    throw error;
  }
};
