import api from '../utils/api';
import type { ApiResponse, CreateOrderRequest, Order } from '../types';

// 创建订单
export const createOrder = async (orderData: CreateOrderRequest) => {
  try {
    const response = await api.post<ApiResponse<Order>>('/orders', orderData);
    return response;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
};

// 获取订单详情
export const getOrderDetail = async (orderId: string) => {
  try {
    const response = await api.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response;
  } catch (error) {
    console.error('Failed to get order detail:', error);
    throw error;
  }
};

// 获取用户订单列表
export const getUserOrders = async (userId: string, params?: {
  page?: number;
  size?: number;
  status?: string;
}) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/orders/user/${userId}`, params);
    return response;
  } catch (error) {
    console.error('Failed to get user orders:', error);
    throw error;
  }
};

// 支付订单
export const payOrder = async (orderId: string, paymentMethod: string) => {
  try {
    const response = await api.post<ApiResponse<Order>>(`/orders/${orderId}/pay`, {
      paymentMethod: paymentMethod
    });
    return response;
  } catch (error) {
    console.error('Failed to pay order:', error);
    throw error;
  }
};
