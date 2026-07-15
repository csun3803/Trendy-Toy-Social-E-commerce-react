import { request } from '@umijs/max';

export interface MerchantAdmin {
  adminId: string;
  shopId: string;
  isActive: number;
  lastLoginTime: string;
  lastOperationTime: string;
  auditStatus: string;
  auditNotes: string;
  auditedAt: string;
  loginCount: number;
}

export interface PlatformAdmin {
  adminId: string;
  employeeId: string;
  adminLevel: string;
  department: string;
  position: string;
  managementScope: string;
  systemPermissions: string;
  dataPermissions: string;
  operationPermissions: string;
  approvalPermissions: string;
  accountStatus: string;
  activatedAt: string;
  deactivatedAt: string;
  lastLoginTime: string;
  lastOperationTime: string;
}

export async function getMerchantAdminList(params: {
  page: number;
  size: number;
  auditStatus?: string;
  isActive?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/admin/merchant/list', {
    method: 'GET',
    params,
  });
}

export async function getPlatformAdminList(params: {
  page: number;
  size: number;
  adminLevel?: string;
  accountStatus?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/admin/platform/list', {
    method: 'GET',
    params,
  });
}

export async function createMerchantAdmin(data: {
  adminId: string;
  shopId: string;
  password: string;
  isActive?: number;
  auditNotes?: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>('/api/admin/merchant', {
    method: 'POST',
    data,
  });
}

export async function updateMerchantAdmin(adminId: string, data: {
  shopId?: string;
  password?: string;
  isActive?: number;
  auditNotes?: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/merchant/${adminId}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteMerchantAdmin(adminId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/merchant/${adminId}`, {
    method: 'DELETE',
  });
}

export async function createPlatformAdmin(data: {
  adminId: string;
  employeeId?: string;
  password: string;
  adminLevel: string;
  department?: string;
  position?: string;
  accountStatus?: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>('/api/admin/platform', {
    method: 'POST',
    data,
  });
}

export async function updatePlatformAdmin(adminId: string, data: {
  employeeId?: string;
  password?: string;
  adminLevel?: string;
  department?: string;
  position?: string;
  accountStatus?: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/platform/${adminId}`, {
    method: 'PUT',
    data,
  });
}

export async function deletePlatformAdmin(adminId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/platform/${adminId}`, {
    method: 'DELETE',
  });
}

// ==================== 商家管理接口 ====================

export interface Shop {
  shopId: string;
  shopName: string;
  shopCover: string;
  shopType: string;
  shopStatus: string;
  auditStatus: string;
  auditNotes: string;
  auditedAt: string;
  shopRating: number;
  monthlySales: number;
  totalSales: number;
  totalSalesAmount: number;
  followerCount: number;
  productCount: number;
  customerServicePhone: string;
  customerServiceEmail: string;
  unifiedSocialCreditCode?: string;
  legalPersonName?: string;
  registeredAddress?: string;
  shopIntro?: string;
  auditRound?: number;
  files?: ShopCertificationFile[];
}

export interface ShopCertificationFile {
  fileId: string;
  shopId: string;
  fileType: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileFormat: string;
  uploadedAt: string;
  uploadedBy: string;
  auditStatus: string;
  auditNotes: string;
}

// ==================== 店铺文件管理接口 ====================

export async function getShopFiles(shopId: string) {
  return request<{
    data: ShopCertificationFile[];
    code: number;
    message: string;
  }>(`/api/shop/${shopId}/files`, {
    method: 'GET',
  });
}

export async function uploadShopFile(shopId: string, fileType: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  
  return request<{
    data: ShopCertificationFile;
    code: number;
    message: string;
  }>(`/api/shop/${shopId}/files`, {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

export async function deleteShopFile(shopId: string, fileId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/shop/${shopId}/files/${fileId}`, {
    method: 'DELETE',
  });
}

export async function getShopList(params: {
  page: number;
  size: number;
  shopStatus?: string;
  auditStatus?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/admin/shop/list', {
    method: 'GET',
    params,
  });
}

export async function getShopById(shopId: string) {
  return request<{
    data: Shop;
    code: number;
    message: string;
  }>(`/api/admin/shop/${shopId}`, {
    method: 'GET',
  });
}

export async function createShop(data: Partial<Shop>) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>('/api/admin/shop', {
    method: 'POST',
    data,
  });
}

export async function updateShop(shopId: string, data: Partial<Shop>) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/shop/${shopId}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteShop(shopId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/shop/${shopId}`, {
    method: 'DELETE',
  });
}

// ==================== 商家审核接口 ====================

export async function approveShop(shopId: string, data: {
  auditorId?: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/shop/${shopId}/approve`, {
    method: 'PUT',
    data,
  });
}

export async function rejectShop(shopId: string, data: {
  auditNotes: string;
  auditorId?: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/shop/${shopId}/reject`, {
    method: 'PUT',
    data,
  });
}

// ==================== 商家入驻申请审核接口 ====================

export interface MerchantApplication {
  id: number;
  applySn: string;
  mobile: string;
  password?: string;
  shopName: string;
  contactName: string;
  subjectType: number; // 0个人 1个体户 2企业
  licenseNo?: string;
  licenseImage?: string;
  idCardNo: string;
  idCardFront: string;
  idCardBack: string;
  bankAccountName: string;
  bankName: string;
  bankCardNo: string;
  status: number; // 0待审核 1通过 2驳回
  auditRemark?: string;
  applyTime: string;
  auditTime?: string;
}

export async function getMerchantApplicationList(params: {
  page: number;
  size: number;
  status?: number;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/merchant-application/admin/list', {
    method: 'GET',
    params,
  });
}

export async function getMerchantApplicationDetail(id: number) {
  return request<{
    data: MerchantApplication;
    code: number;
    message: string;
  }>(`/api/merchant-application/admin/${id}`, {
    method: 'GET',
  });
}

export async function approveMerchantApplication(id: number, data: {
  auditorId?: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/merchant-application/admin/${id}/approve`, {
    method: 'PUT',
    data,
  });
}

export async function rejectMerchantApplication(id: number, data: {
  auditRemark: string;
}) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/merchant-application/admin/${id}/reject`, {
    method: 'PUT',
    data,
  });
}

// 获取当前商家的入驻申请
export async function getCurrentMerchantApplication() {
  return request<{
    data: MerchantApplication;
    code: number;
    message: string;
  }>('/api/merchant-application/current', {
    method: 'GET',
  });
}
