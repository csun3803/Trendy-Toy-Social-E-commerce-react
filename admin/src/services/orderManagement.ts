import { request } from '@umijs/max';
import type { AfterSale } from './order';

// 平台订单视图：包含订单 + 订单项 + 店铺名 + 用户信息
export interface AdminOrderView {
  order: AdminOrder;
  orderItems: AdminOrderItem[];
  shopName?: string;
  shopId?: string;
  userInfo?: {
    username: string;
    avatarUrl?: string;
  };
}

export interface AdminOrder {
  orderId: string;
  orderNo: string;
  userId: string;
  amount: number;
  shippingFee: number;
  totalDiscount: number;
  actualAmount: number;
  settlementAmount: number;
  platformCommission: number;
  refundAmount: number;
  paymentMethod: string;
  paymentTime?: string;
  addressId?: string;
  logisticsCompany?: string;
  trackingNumber?: string;
  shippedTime?: string;
  receivedTime?: string;
  estimatedDelivery?: string;
  orderStatus: string;
  cancelReason?: string;
  cancelTime?: string;
  completeTime?: string;
  totalQuantity: number;
  productVarietyCount: number;
  afterSalesStatus: string;
  afterSalesTime?: string;
  lastAfterSalesTime?: string;
  userRemark?: string;
  createTime: string;
  updateTime: string;
}

export interface AdminOrderItem {
  orderItemId: string;
  orderId: string;
  productId: string;
  originalPrice: number;
  unitPrice: number;
  quantity: number;
  subtotalAmount: number;
  allocatedDiscount: number;
  actualSubtotal: number;
  itemAfterSalesStatus: string;
  itemRefundAmount: number;
  refundQuantity: number;
  itemSellerId: string;
  productName?: string;
  productImage?: string;
  productSpec?: string;
}

// 平台订单列表
export async function getAdminOrders(params?: {
  sellerId?: string;
  userId?: string;
  status?: string;
  orderNo?: string;
  startTime?: string;
  endTime?: string;
}) {
  return request<{
    data: AdminOrderView[];
    code: number;
    message: string;
  }>('/api/admin/orders/list', {
    method: 'GET',
    params,
  });
}

// 平台售后列表
export async function getAdminAfterSales(params?: {
  status?: string;
  sellerId?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
}) {
  return request<{
    data: AfterSale[];
    code: number;
    message: string;
  }>('/api/admin/orders/after-sales/list', {
    method: 'GET',
    params,
  });
}

// 待平台介入售后列表
export async function getPlatformInterventionList() {
  return request<{
    data: AfterSale[];
    code: number;
    message: string;
  }>('/api/admin/orders/after-sales/intervention', {
    method: 'GET',
  });
}

// 平台仲裁
export async function arbitrateAfterSale(
  afterSaleId: string,
  result: 'USER' | 'SELLER',
  reason: string,
) {
  return request<{
    data: AfterSale;
    code: number;
    message: string;
  }>(`/api/admin/orders/after-sales/${afterSaleId}/arbitrate`, {
    method: 'POST',
    data: { result, reason },
  });
}
