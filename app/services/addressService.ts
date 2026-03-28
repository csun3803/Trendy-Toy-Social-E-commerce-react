import api from '../utils/api';
import type { ApiResponse, UserAddress, CreateAddressRequest, UpdateAddressRequest } from '../types';

// 获取用户地址列表
export const getUserAddresses = async (userId: string) => {
  try {
    const response = await api.get<ApiResponse<UserAddress[]>>(`/addresses/user/${userId}`);
    return response;
  } catch (error) {
    console.error('Failed to get user addresses:', error);
    throw error;
  }
};

// 获取地址详情
export const getAddressDetail = async (addressId: string) => {
  try {
    const response = await api.get<ApiResponse<UserAddress>>(`/addresses/${addressId}`);
    return response;
  } catch (error) {
    console.error('Failed to get address detail:', error);
    throw error;
  }
};

// 创建地址
export const createAddress = async (addressData: CreateAddressRequest) => {
  try {
    const response = await api.post<ApiResponse<UserAddress>>('/addresses', addressData);
    return response;
  } catch (error) {
    console.error('Failed to create address:', error);
    throw error;
  }
};

// 更新地址
export const updateAddress = async (addressData: UpdateAddressRequest) => {
  try {
    const response = await api.put<ApiResponse<UserAddress>>('/addresses', addressData);
    return response;
  } catch (error) {
    console.error('Failed to update address:', error);
    throw error;
  }
};

// 删除地址
export const deleteAddress = async (addressId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/addresses/${addressId}`);
    return response;
  } catch (error) {
    console.error('Failed to delete address:', error);
    throw error;
  }
};

// 设置默认地址
export const setDefaultAddress = async (addressId: string) => {
  try {
    const response = await api.put<ApiResponse<void>>(`/addresses/${addressId}/default`);
    return response;
  } catch (error) {
    console.error('Failed to set default address:', error);
    throw error;
  }
};
