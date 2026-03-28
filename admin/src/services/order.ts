import { request } from '@umijs/max';

export interface Order {
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
  paymentStatus: string;
  paymentTime: string;
  addressId: string;
  logisticsCompany: string;
  trackingNumber: string;
  shippingStatus: string;
  shippedTime: string;
  receivedTime: string;
  logisticsTracking: string;
  estimatedDelivery: string;
  orderStatus: string;
  cancelReason: string;
  cancelTime: string;
  completeTime: string;
  totalQuantity: number;
  productVarietyCount: number;
  afterSalesStatus: string;
  afterSalesTime: string;
  lastAfterSalesTime: string;
  userRemark: string;
  paymentDeadline: string;
  autoCancelTime: string;
  createTime: string;
  updateTime: string;
}

export interface OrderItem {
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
  createTime: string;
  updateTime: string;
}

export interface OrderDetail extends Order {
  orderItems: OrderItem[];
}

export async function getOrdersBySeller(sellerId: string) {
  return request<{
    data: Order[];
    code: number;
    message: string;
  }>(`/api/orders/seller/${sellerId}`, {
    method: 'GET',
  });
}

export async function getOrderDetail(orderId: string) {
  return request<{
    data: OrderDetail;
    code: number;
    message: string;
  }>(`/api/orders/${orderId}`, {
    method: 'GET',
  });
}

export async function deleteOrder(orderId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/orders/${orderId}`, {
    method: 'DELETE',
  });
}
