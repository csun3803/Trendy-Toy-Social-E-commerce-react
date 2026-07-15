import { request } from '@umijs/max';

// ==================== 抽盒机数据类型 ====================

// 抽盒机主实体（与后端 blind_box_machine 表对应，复用 sale_series 数据）
export interface BlindBoxMachine {
  machineId: string;
  shopId: string;
  shopName?: string;
  saleSeriesId: string;
  saleSeriesName?: string;
  seriesId?: string;
  machineName: string;
  machineDescription?: string;
  machineCoverImage?: string;
  // 单抽/十连价格
  drawPrice: number; // 单抽价格
  tenDrawPrice: number | null; // 十连价格
  // 状态
  machineStatus: string; // ACTIVE / INACTIVE
  auditStatus: string; // PENDING / APPROVED / REJECTED
  auditRemark?: string;
  auditedAt?: string;
  // 统计字段
  totalStock: number;
  totalDraws: number;
  totalRevenue: number;
  guaranteeDraws?: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// 抽盒机款式配置（覆盖 sale_variant 数据，不新增商品数据）
export interface BlindBoxMachineVariant {
  id?: string;
  machineId: string;
  saleVariantId: string;
  variantId?: string;
  skuCode?: string;
  variantName?: string;
  variantImage?: string;
  variantType?: string; // regular / hidden
  rarity?: string;
  // 覆盖字段（null/undefined 表示复用商城 sale_variant 数据）
  overrideStock: boolean; // 是否覆盖库存
  stockQuantity?: number; // 自定义库存
  overrideProbability: boolean; // 是否覆盖概率
  drawProbability?: number; // 自定义抽盒概率（0-1）
  // 统计字段
  drawnCount?: number;
  remainingStock?: number;
}

// 抽盒记录
export interface BlindBoxDrawRecord {
  recordId: string;
  machineId: string;
  machineName?: string;
  userId: string;
  userNickname?: string;
  saleVariantId: string;
  variantName?: string;
  variantImage?: string;
  drawType: string; // SINGLE / TEN
  orderId: string;
  orderNo?: string;
  isHidden: boolean;
  isGuaranteed: boolean;
  drawPrice: number;
  createdAt: string;
}

// 抽盒机统计数据
export interface BlindBoxMachineStatistics {
  machineId: string;
  totalDraws: number;
  totalRevenue: number;
  singleDraws: number;
  tenDraws: number;
  uniqueUsers: number;
  variantStats: BlindBoxVariantStat[];
}

export interface BlindBoxVariantStat {
  saleVariantId: string;
  variantName: string;
  variantImage?: string;
  variantType: string;
  drawnCount: number;
  drawRate: number; // 抽出占比
  revenue: number;
}

// ==================== 商家端接口 ====================

// 获取商家当前抽盒机列表
export async function getMerchantBlindBoxMachines(params?: {
  keyword?: string;
  status?: string;
  auditStatus?: string;
}) {
  return request<{
    data: BlindBoxMachine[];
    code: number;
    message: string;
  }>('/api/blind-box-machine/merchant/list', {
    method: 'GET',
    params,
  });
}

// 获取抽盒机详情
export async function getBlindBoxMachineDetail(machineId: string) {
  return request<{
    data: BlindBoxMachine;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}`, {
    method: 'GET',
  });
}

// 创建抽盒机
export async function createBlindBoxMachine(data: {
  shopId: string;
  saleSeriesId: string;
  machineName: string;
  machineDescription?: string;
  machineCoverImage?: string;
  drawPrice: number;
  tenDrawPrice?: number | null;
  machineStatus?: string;
  sortOrder?: number;
}) {
  return request<{
    data: BlindBoxMachine;
    code: number;
    message: string;
  }>('/api/blind-box-machine/merchant', {
    method: 'POST',
    data,
  });
}

// 更新抽盒机基础信息
export async function updateBlindBoxMachine(
  machineId: string,
  data: Partial<{
    saleSeriesId: string;
    machineName: string;
    machineDescription: string;
    machineCoverImage: string;
    drawPrice: number;
    tenDrawPrice: number | null;
    sortOrder: number;
  }>,
) {
  return request<{
    data: BlindBoxMachine;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}`, {
    method: 'PUT',
    data,
  });
}

// 更新抽盒机状态（启用/停用）
export async function updateBlindBoxMachineStatus(
  machineId: string,
  machineStatus: string,
) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}/status`, {
    method: 'PUT',
    data: { machineStatus },
  });
}

// 删除抽盒机
export async function deleteBlindBoxMachine(machineId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}`, {
    method: 'DELETE',
  });
}

// 获取抽盒机款式配置（关联 sale_variants 并合并覆盖配置）
export async function getBlindBoxMachineVariants(machineId: string) {
  return request<{
    data: BlindBoxMachineVariant[];
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}/variants`, {
    method: 'GET',
  });
}

// 批量保存抽盒机款式覆盖配置
export async function saveBlindBoxMachineVariants(
  machineId: string,
  data: BlindBoxMachineVariant[],
) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}/variants`, {
    method: 'PUT',
    data,
  });
}

// 获取抽盒机统计数据
export async function getBlindBoxMachineStatistics(machineId: string) {
  return request<{
    data: BlindBoxMachineStatistics;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}/statistics`, {
    method: 'GET',
  });
}

// 获取抽盒机抽盒记录
export async function getBlindBoxMachineRecords(
  machineId: string,
  params?: { page?: number; size?: number },
) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}/records`, {
    method: 'GET',
    params,
  });
}

// 提交抽盒机审核
export async function submitBlindBoxMachineForAudit(machineId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/blind-box-machine/merchant/${machineId}/submit-audit`, {
    method: 'PUT',
  });
}

// ==================== 管理员端接口 ====================

// 全平台抽盒机列表
export async function getAdminBlindBoxMachines(params: {
  page: number;
  size: number;
  shopId?: string;
  machineStatus?: string;
  auditStatus?: string;
  keyword?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/admin/blind-box-machine/list', {
    method: 'GET',
    params,
  });
}

// 管理员查看抽盒机详情（含完整配置）
export async function getAdminBlindBoxMachineDetail(machineId: string) {
  return request<{
    data: BlindBoxMachine;
    code: number;
    message: string;
  }>(`/api/admin/blind-box-machine/${machineId}`, {
    method: 'GET',
  });
}

// 管理员查看抽盒机款式配置
export async function getAdminBlindBoxMachineVariants(machineId: string) {
  return request<{
    data: BlindBoxMachineVariant[];
    code: number;
    message: string;
  }>(`/api/admin/blind-box-machine/${machineId}/variants`, {
    method: 'GET',
  });
}

// 管理员查看抽盒机抽盒记录
export async function getAdminBlindBoxMachineRecords(
  machineId: string,
  params?: { page?: number; size?: number },
) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>(`/api/admin/blind-box-machine/${machineId}/records`, {
    method: 'GET',
    params,
  });
}

// 审核通过抽盒机
export async function approveBlindBoxMachine(machineId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/blind-box-machine/${machineId}/approve`, {
    method: 'PUT',
  });
}

// 审核驳回抽盒机
export async function rejectBlindBoxMachine(
  machineId: string,
  data: { auditRemark: string },
) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/blind-box-machine/${machineId}/reject`, {
    method: 'PUT',
    data,
  });
}

// 强制下架违规抽盒机
export async function takedownBlindBoxMachine(
  machineId: string,
  data: { auditRemark: string },
) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/blind-box-machine/${machineId}/takedown`, {
    method: 'PUT',
    data,
  });
}
