import api from '../utils/api';
import type {
  BlindBoxMachine,
  BlindBoxDrawRecord,
  DrawResult,
  DrawRequest,
  SaleVariantItem,
  ApiResponse,
  BlindBoxMachineDetail,
  BlindBoxPickRequest,
  BlindBoxPickResult,
  BlindBoxSlot,
} from '../types';

// 获取所有活跃的抽盒机列表
export const getBlindBoxMachines = async () => {
  try {
    const response = await api.get<ApiResponse<BlindBoxMachine[]>>('/blind-box/machines');
    return response;
  } catch (error) {
    console.error('获取抽盒机列表失败:', error);
    throw error;
  }
};

// 获取抽盒机详情（含九宫格盒子）
export const getBlindBoxMachineDetail = async (machineId: string) => {
  try {
    const response = await api.get<ApiResponse<BlindBoxMachineDetail>>(`/blind-box/machines/${machineId}`);
    return response;
  } catch (error) {
    console.error('获取抽盒机详情失败:', error);
    throw error;
  }
};

// 获取抽盒机下的款式列表
export const getBlindBoxVariants = async (machineId: string) => {
  try {
    const response = await api.get<ApiResponse<SaleVariantItem[]>>(`/blind-box/machines/${machineId}/variants`);
    return response;
  } catch (error) {
    console.error('获取抽盒机款式失败:', error);
    throw error;
  }
};

// 获取选盒状态（九宫格slots）
export const getBlindBoxSlots = async (machineId: string) => {
  try {
    const response = await api.get<ApiResponse<BlindBoxSlot[]>>(`/blind-box/machines/${machineId}/slots`);
    return response;
  } catch (error) {
    console.error('获取选盒状态失败:', error);
    throw error;
  }
};

// 获取抽盒机的所有套盒（含格位信息，用于左右切换）
export const getBlindBoxSets = async (machineId: string) => {
  try {
    const response = await api.get<ApiResponse<any[]>>(`/blind-box/machines/${machineId}/sets`);
    return response;
  } catch (error) {
    console.error('获取套盒列表失败:', error);
    throw error;
  }
};

// 获取套盒详情
export const getBlindBoxSetDetail = async (setId: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/blind-box/sets/${setId}`);
    return response;
  } catch (error) {
    console.error('获取套盒详情失败:', error);
    throw error;
  }
};

// 加入排队
export const joinBlindBoxQueue = async (machineId: string, userId: string) => {
  try {
    const response = await api.post<ApiResponse<{ queuePosition: number; queueCount: number; status: string; canPick: boolean }>>(
      `/blind-box/machines/${machineId}/queue`,
      { userId }
    );
    return response;
  } catch (error) {
    console.error('加入排队失败:', error);
    throw error;
  }
};

// 查询排队状态
export const getQueueStatus = async (machineId: string, userId: string) => {
  try {
    const response = await api.get<ApiResponse<{ inQueue: boolean; status: string; queuePosition: number; queueCount: number; canPick: boolean; activeUserId?: string; activeUsername?: string }>>(
      `/blind-box/machines/${machineId}/queue/status`,
      { params: { userId } }
    );
    return response;
  } catch (error) {
    console.error('查询排队状态失败:', error);
    throw error;
  }
};

// 离开排队
export const leaveBlindBoxQueue = async (machineId: string, userId: string) => {
  try {
    const response = await api.delete<ApiResponse<any>>(`/blind-box/machines/${machineId}/queue`, { data: { userId } });
    return response;
  } catch (error) {
    console.error('离开排队失败:', error);
    throw error;
  }
};

// 选盒购买（选中某个盒子立即购买并揭晓）
export const pickBlindBox = async (request: BlindBoxPickRequest) => {
  try {
    const response = await api.post<ApiResponse<BlindBoxPickResult>>('/blind-box/pick', request);
    return response;
  } catch (error) {
    console.error('选盒购买失败:', error);
    throw error;
  }
};

// 抽盒
export const drawBlindBox = async (request: DrawRequest) => {
  try {
    const response = await api.post<ApiResponse<DrawResult>>('/blind-box/draw', request);
    return response;
  } catch (error) {
    console.error('抽盒失败:', error);
    throw error;
  }
};

// 获取用户抽盒历史
export const getDrawHistory = async (machineId: string, userId: string) => {
  try {
    const response = await api.get<ApiResponse<BlindBoxDrawRecord[]>>(`/blind-box/machines/${machineId}/history`, { userId });
    return response;
  } catch (error) {
    console.error('获取抽盒历史失败:', error);
    throw error;
  }
};

// 获取用户所有抽盒记录
export const getUserDrawRecords = async (userId: string) => {
  const response = await api.get<ApiResponse<BlindBoxDrawRecord[]>>('/blind-box/draw-records', { userId });
  return response;
};

// 开盒
export const openDrawRecord = async (recordId: string, userId: string) => {
  const response = await api.post<ApiResponse<BlindBoxDrawRecord>>(`/blind-box/draw-records/${recordId}/open`, { userId });
  return response;
};

// 欧气排行榜
export const getLuckRanking = async (limit = 50) => {
  const response = await api.get<ApiResponse<any[]>>('/blind-box/luck-ranking', { limit });
  return response;
};

// ========== 暂存柜 ==========
export interface BlindBoxStorageItem {
  storageId: string;
  userId: string;
  machineId: string;
  machineName: string;
  setId?: string;
  slotNo?: number;
  saleVariantId: string;
  variantId?: string;
  variantName: string;
  variantImage: string;
  isHidden: boolean;
  drawPrice: number;
  payOrderId?: string;
  status: 'STORED' | 'SHIPPED';
  shipOrderId?: string;
  storedAt: string;
  shippedAt?: string;
}

export const getStorageList = async (userId: string, onlyStored = true) => {
  const response = await api.get<ApiResponse<BlindBoxStorageItem[]>>('/blind-box/storage', {
    userId,
    onlyStored,
  });
  return response;
};

export const getStorageCount = async (userId: string) => {
  const response = await api.get<ApiResponse<{ count: number }>>('/blind-box/storage/count', {
    userId,
  });
  return response;
};

export const shipFromStorage = async (storageId: string, userId: string, addressId: string) => {
  const response = await api.post<ApiResponse<any>>(`/blind-box/storage/${storageId}/ship`, {
    userId,
    addressId,
  });
  return response;
};

export const batchShipFromStorage = async (storageIds: string[], userId: string, addressId: string) => {
  const response = await api.post<ApiResponse<any>>('/blind-box/storage/batch-ship', {
    storageIds,
    userId,
    addressId,
  });
  return response;
};
