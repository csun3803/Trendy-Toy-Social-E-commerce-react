import api from '../utils/api';
import type { SaleSeriesItem, SaleVariantItem, ApiResponse, SaleSeriesListResponse } from '../types';

// 获取销售系列列表
export const getSaleSeriesList = async (params: {
  page: number;
  size: number;
  keyword?: string;
}) => {
  try {
    // API可能返回直接的数组或包含data的对象
    const response = await api.get<any>('/sale-series', params);
    return response;
  } catch (error) {
    console.error('Failed to fetch sale series list:', error);
    throw error;
  }
};

// 获取销售系列详情
export const getSaleSeriesDetail = async (saleSeriesId: string) => {
  try {
    const response = await api.get<ApiResponse<SaleSeriesItem>>(`/sale-series/${saleSeriesId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch sale series detail:', error);
    throw error;
  }
};

// 获取销售系列下的款式列表
export const getSaleVariantsBySeriesId = async (saleSeriesId: string) => {
  try {
    const response = await api.get<ApiResponse<SaleVariantItem[]>>(`/sale-variants/sale-series/${saleSeriesId}/with-names`);
    return response;
  } catch (error) {
    console.error('Failed to fetch sale variants:', error);
    throw error;
  }
};

// 获取销售款式详情
export const getSaleVariantDetail = async (saleVariantId: string) => {
  try {
    const response = await api.get<ApiResponse<SaleVariantItem>>(`/sale-variants/${saleVariantId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch sale variant detail:', error);
    throw error;
  }
};
