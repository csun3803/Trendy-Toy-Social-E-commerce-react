import { request } from '@umijs/max';

export interface AfterSale {
  afterSaleId: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  sellerId: string;
  afterSaleType: string;
  // PENDING, APPROVED, REJECTED, COMPLETED,
  // PLATFORM_REVIEWING, PLATFORM_RESOLVED
  afterSaleStatus: string;
  reason: string;
  description?: string;
  evidenceImages?: string;
  refundAmount: number;
  returnLogisticsCompany?: string;
  returnTrackingNumber?: string;
  returnAddress?: string;
  timeoutAutoApproveTime?: string;
  platformInterventionReason?: string;
  platformInterventionTime?: string;
  platformAdminId?: string;
  platformArbitrationResult?: string; // USER | SELLER
  platformArbitrationReason?: string;
  platformArbitrationTime?: string;
  rejectReason?: string;
  auditTime?: string;
  completeTime?: string;
  createTime: string;
  updateTime: string;
  productName?: string;
  productImage?: string;
  productSpec?: string;
  shopName?: string;
  orderNo?: string;
  shopId?: string;
  username?: string;
  userAvatar?: string;
}

export interface CreateAfterSaleRequest {
  orderId: string;
  orderItemId: string;
  afterSaleType: string;
  reason: string;
  description?: string;
  evidenceImages?: string[];
  refundAmount: number;
}

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
  paymentTime: string;
  addressId: string;
  logisticsCompany: string;
  trackingNumber: string;
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

export interface ShipRequest {
  logisticsCompany: string;
  trackingNumber: string;
}

export async function shipOrder(orderId: string, data: ShipRequest) {
  return request<{
    data: Order;
    code: number;
    message: string;
  }>(`/api/orders/${orderId}/ship`, {
    method: 'POST',
    data,
  });
}

export interface LogisticsTrack {
  time: string;
  status: string;
  description: string;
}

export interface LogisticsInfo {
  orderId: string;
  logisticsCompany: string;
  trackingNumber: string;
  tracks: LogisticsTrack[];
}

export async function getLogisticsInfo(orderId: string) {
  return request<{
    data: LogisticsInfo;
    code: number;
    message: string;
  }>(`/api/orders/${orderId}/logistics`, {
    method: 'GET',
  });
}

export async function completeOrder(orderId: string) {
  return request<{
    data: Order;
    code: number;
    message: string;
  }>(`/api/orders/${orderId}/complete`, {
    method: 'POST',
  });
}

// 获取订单的售后申请
export async function getAfterSalesByOrder(orderId: string) {
  return request<{
    data: AfterSale[];
    code: number;
    message: string;
  }>(`/api/after-sale/order/${orderId}`, {
    method: 'GET',
  });
}

// 获取售后详情
export async function getAfterSaleDetail(afterSaleId: string) {
  return request<{
    data: AfterSale;
    code: number;
    message: string;
  }>(`/api/after-sale/${afterSaleId}`, {
    method: 'GET',
  });
}

// 同意售后申请
export async function approveAfterSale(afterSaleId: string) {
  return request<{
    data: AfterSale;
    code: number;
    message: string;
  }>(`/api/after-sale/${afterSaleId}/approve`, {
    method: 'POST',
  });
}

// 拒绝售后申请
export async function rejectAfterSale(afterSaleId: string, rejectReason: string) {
  return request<{
    data: AfterSale;
    code: number;
    message: string;
  }>(`/api/after-sale/${afterSaleId}/reject`, {
    method: 'POST',
    data: { rejectReason },
  });
}

// 确认退货收货
export async function confirmReturnReceived(afterSaleId: string) {
  return request<{
    data: AfterSale;
    code: number;
    message: string;
  }>(`/api/after-sale/${afterSaleId}/confirm-return-received`, {
    method: 'POST',
  });
}

// 商家填写退货地址
export async function fillReturnAddress(afterSaleId: string, returnAddress: string, sellerId?: string) {
  return request<{
    data: AfterSale;
    code: number;
    message: string;
  }>(`/api/after-sale/${afterSaleId}/fill-return-address`, {
    method: 'POST',
    data: { returnAddress, sellerId },
  });
}
