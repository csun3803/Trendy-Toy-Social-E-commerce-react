import api from '../utils/api';
import type { AlbumItem, ApiResponse } from '../types';

export const getAlbumList = async () => {
  try {
    const response = await api.get<ApiResponse<AlbumItem[]>>('/album/list');
    return response;
  } catch (error) {
    console.error('Failed to fetch album list:', error);
    throw error;
  }
};

export const getAlbumDetail = async (id: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/album/detail/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch album detail:', error);
    throw error;
  }
};