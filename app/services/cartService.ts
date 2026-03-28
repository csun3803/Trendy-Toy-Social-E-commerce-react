import api from '../utils/api';
import type { ApiResponse, CartItem, AddToCartRequest, UpdateCartRequest, CartListResponse, CartSummary } from '../types';

export const getCartList = async (userId: string) => {
  console.log('[cartService] getCartList 调用, userId:', userId);
  try {
    const response = await api.get<ApiResponse<CartListResponse>>(`/cart/user/${userId}`);
    console.log('[cartService] getCartList 响应:', response);
    return response;
  } catch (error) {
    console.error('[cartService] Failed to get cart list:', error);
    throw error;
  }
};

export const addToCart = async (data: AddToCartRequest) => {
  try {
    const response = await api.post<ApiResponse<CartItem>>('/cart', data);
    return response;
  } catch (error) {
    console.error('Failed to add to cart:', error);
    throw error;
  }
};

export const updateCartItem = async (data: UpdateCartRequest) => {
  try {
    const response = await api.put<ApiResponse<CartItem>>(`/cart/${data.cartItemId}`, data);
    return response;
  } catch (error) {
    console.error('Failed to update cart item:', error);
    throw error;
  }
};

export const removeCartItem = async (cartItemId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/cart/${cartItemId}`);
    return response;
  } catch (error) {
    console.error('Failed to remove cart item:', error);
    throw error;
  }
};

export const removeSelectedItems = async (userId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/cart/selected/${userId}`);
    return response;
  } catch (error) {
    console.error('Failed to remove selected items:', error);
    throw error;
  }
};

export const selectAllItems = async (userId: string, isSelected: boolean) => {
  try {
    const response = await api.put<ApiResponse<void>>(`/cart/select-all/${userId}`, { isSelected });
    return response;
  } catch (error) {
    console.error('Failed to select all items:', error);
    throw error;
  }
};

export const getCartSummary = async (userId: string) => {
  try {
    const response = await api.get<ApiResponse<CartSummary>>(`/cart/summary/${userId}`);
    return response;
  } catch (error) {
    console.error('Failed to get cart summary:', error);
    throw error;
  }
};

export const clearCart = async (userId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/cart/clear/${userId}`);
    return response;
  } catch (error) {
    console.error('Failed to clear cart:', error);
    throw error;
  }
};
