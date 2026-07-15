import { config } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = config.API_BASE_URL;

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

interface Cabinet {
  cabinetId: string;
  userId: string;
  cabinetName: string;
  description: string;
  isPublic: number;
  totalItems: number;
  totalValuation: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  coverImage?: string;
}

interface CabinetItem {
  itemId: string;
  cabinetId: string;
  productId: string;
  customName: string;
  displayNote: string;
  acquisitionMethod: string;
  acquisitionDate: string;
  acquisitionPrice: number;
  displayImage: string;
  addedAt: string;
  customTags: string;
  itemType: string;
  quantity: number;
  attributes: string;
  dimensions: string;
  productName?: string;
  productImage?: string;
}

interface CreateCabinetParams {
  cabinetName: string;
  description?: string;
  isPublic?: number;
  coverImage?: string;
  userId: string;
}

interface AddItemParams {
  productId?: string;
  customName: string;
  displayNote?: string;
  displayImage?: string;
  itemType: string;
  acquisitionMethod?: string;
  acquisitionDate?: string;
  acquisitionPrice?: number;
  quantity?: number;
  customTags?: string;
  attributes?: string;
  dimensions?: string;
}

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const getCabinetList = async (userId: string): Promise<ApiResponse<Cabinet[]>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/user/${userId}`, {
      method: 'GET',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('获取盒柜列表失败', error);
    return { code: 500, message: '网络错误', data: [] };
  }
};

export const getCabinetDetail = async (cabinetId: string): Promise<ApiResponse<Cabinet>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}`, {
      method: 'GET',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('获取盒柜详情失败', error);
    return { code: 500, message: '网络错误', data: null as any };
  }
};

export const getCabinetItems = async (cabinetId: string): Promise<ApiResponse<CabinetItem[]>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}/items`, {
      method: 'GET',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('获取盒柜藏品失败', error);
    return { code: 500, message: '网络错误', data: [] };
  }
};

export const createCabinet = async (params: CreateCabinetParams): Promise<ApiResponse<Cabinet>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error('创建盒柜失败', error);
    return { code: 500, message: '网络错误', data: null as any };
  }
};

export const updateCabinet = async (cabinetId: string, params: Partial<CreateCabinetParams>): Promise<ApiResponse<Cabinet>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error('更新盒柜失败', error);
    return { code: 500, message: '网络错误', data: null as any };
  }
};

export const deleteCabinet = async (cabinetId: string): Promise<ApiResponse<null>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}`, {
      method: 'DELETE',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('删除盒柜失败', error);
    return { code: 500, message: '网络错误', data: null };
  }
};

export const addItemToCabinet = async (cabinetId: string, params: AddItemParams): Promise<ApiResponse<CabinetItem>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error('添加藏品失败', error);
    return { code: 500, message: '网络错误', data: null as any };
  }
};

export const updateCabinetItem = async (cabinetId: string, itemId: string, params: Partial<AddItemParams>): Promise<ApiResponse<CabinetItem>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}/items/${itemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error('更新藏品失败', error);
    return { code: 500, message: '网络错误', data: null as any };
  }
};

export const removeItemFromCabinet = async (cabinetId: string, itemId: string): Promise<ApiResponse<null>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}/items/${itemId}`, {
      method: 'DELETE',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('移除藏品失败', error);
    return { code: 500, message: '网络错误', data: null };
  }
};

export const likeCabinet = async (cabinetId: string): Promise<ApiResponse<null>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}/like`, {
      method: 'POST',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('点赞失败', error);
    return { code: 500, message: '网络错误', data: null };
  }
};

export const unlikeCabinet = async (cabinetId: string): Promise<ApiResponse<null>> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/cabinet/${cabinetId}/like`, {
      method: 'DELETE',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('取消点赞失败', error);
    return { code: 500, message: '网络错误', data: null };
  }
};

export type { Cabinet, CabinetItem, CreateCabinetParams, AddItemParams };
