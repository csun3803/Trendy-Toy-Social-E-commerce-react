import api from '../utils/api';
import type { SeriesItem, ApiResponse, SeriesListResponse } from '../types';

export const getSeriesList = async (params: {
  page: number;
  size: number;
  keyword?: string;
}) => {
  try {
    const response = await api.get<ApiResponse<SeriesListResponse>>('/series', params);
    return response;
  } catch (error) {
    console.error('Failed to fetch series list:', error);
    throw error;
  }
};

export const getSeriesDetail = async (seriesId: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/series/${seriesId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch series detail:', error);
    throw error;
  }
};