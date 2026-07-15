import api from '../utils/api';
import type { ApiResponse, CreateOrderRequest, Order } from '../types';

interface BatchCreateOrderRequest {
  userId: string;
  addressId?: string;
  userRemark?: string;
  paymentMethod?: string;
  userCouponId?: string;
  shopOrders: Array<{
    shopId: string;
    items: any[];
    amount: number;
    shippingFee: number;
    totalDiscount: number;
    actualAmount: number;
  }>;
}

// 创建单个订单
export const createOrder = async (orderData: CreateOrderRequest) => {
  try {
    const response = await api.post<ApiResponse<Order>>('/orders', orderData);
    return response;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
};

// 批量创建订单（按店铺分组）
export const batchCreateOrders = async (batchData: BatchCreateOrderRequest) => {
  try {
    const response = await api.post<ApiResponse<Order[]>>('/orders/batch', batchData);
    return response;
  } catch (error) {
    console.error('Failed to batch create orders:', error);
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

// 取消订单
export const cancelOrder = async (orderId: string) => {
  try {
    const response = await api.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`);
    return response;
  } catch (error) {
    console.error('Failed to cancel order:', error);
    throw error;
  }
};

// 确认收货
export const confirmReceive = async (orderId: string) => {
  try {
    const response = await api.post<ApiResponse<Order>>(`/orders/${orderId}/complete`);
    return response;
  } catch (error) {
    console.error('Failed to confirm receive:', error);
    throw error;
  }
};

// 获取各状态订单数量统计
export const getOrderStatusCount = async () => {
  try {
    const response = await api.get<ApiResponse<{
      unpaid: number;
      unshipped: number;
      shipping: number;
      completed: number;
    }>>('/orders/status-count');
    return response;
  } catch (error) {
    console.error('Failed to get order status count:', error);
    throw error;
  }
};
