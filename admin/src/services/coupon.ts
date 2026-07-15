import { request } from '@umijs/max';

// 优惠券模板
export interface CouponTemplate {
  templateId: string;
  name: string;
  type: string;
  discountValue: number;
  minSpend: number;
  validFrom: string;
  validTo: string;
  validDays: number;
  totalQuantity: number;
  userLimit: number;
  status: string;
  createTime?: string;
  updateTime?: string;
}

export interface CouponTemplateRequest {
  templateId?: string;
  name: string;
  type?: string;
  discountValue: number;
  minSpend?: number;
  validFrom: string;
  validTo: string;
  validDays?: number;
  totalQuantity?: number;
  userLimit?: number;
  status?: string;
}

// 用户券视图
export interface UserCouponDTO {
  userCouponId: string;
  userId: string;
  templateId: string;
  couponCode: string;
  status: string; // unused/used/expired/revoked
  claimedAt: string;
  usedAt?: string;
  expiresAt: string;
  orderId?: string;
  templateName?: string;
  type?: string;
  discountValue?: number;
  minSpend?: number;
  username?: string;
  phoneNumber?: string;
}

// ==================== 模板管理 ====================

export async function listTemplates(params?: { name?: string; status?: string }) {
  return request<{
    data: CouponTemplate[];
    code: number;
    message: string;
  }>('/api/coupons/templates', {
    method: 'GET',
    params,
  });
}

export async function getTemplate(templateId: string) {
  return request<{
    data: CouponTemplate;
    code: number;
    message: string;
  }>(`/api/coupons/templates/${templateId}`, {
    method: 'GET',
  });
}

export async function createTemplate(data: CouponTemplateRequest) {
  return request<{
    data: CouponTemplate;
    code: number;
    message: string;
  }>('/api/coupons/templates', {
    method: 'POST',
    data,
  });
}

export async function updateTemplate(data: CouponTemplateRequest) {
  return request<{
    data: CouponTemplate;
    code: number;
    message: string;
  }>('/api/coupons/templates', {
    method: 'PUT',
    data,
  });
}

export async function toggleTemplateStatus(templateId: string, status: string) {
  return request<{
    data: CouponTemplate;
    code: number;
    message: string;
  }>(`/api/coupons/templates/${templateId}/status`, {
    method: 'PUT',
    data: { status },
  });
}

export async function deleteTemplate(templateId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/coupons/templates/${templateId}`, {
    method: 'DELETE',
  });
}

// ==================== 发券 ====================

export async function issueCoupons(templateId: string, userIds: string[]) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/coupons/issue', {
    method: 'POST',
    data: { templateId, userIds },
  });
}

// ==================== 用户券列表（管理端） ====================

export async function listAllUserCoupons(params?: {
  templateId?: string;
  userId?: string;
  status?: string;
}) {
  return request<{
    data: UserCouponDTO[];
    code: number;
    message: string;
  }>('/api/coupons/list', {
    method: 'GET',
    params,
  });
}

export async function revokeUserCoupon(userCouponId: string) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>(`/api/coupons/${userCouponId}/revoke`, {
    method: 'POST',
  });
}
