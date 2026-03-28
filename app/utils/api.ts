import type { ApiResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';
import { router } from 'expo-router';

const BASE_URL = config.API_BASE_URL;

class Api {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // 获取Token
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('获取Token失败:', error);
      return null;
    }
  }

  // 获取RefreshToken
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refreshToken');
    } catch (error) {
      console.error('获取RefreshToken失败:', error);
      return null;
    }
  }

  // 刷新Token
  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('没有 refreshToken');
      }

      const response = await fetch(`${this.baseUrl}/user/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (data.code === 200) {
        // 保存新的 token
        await AsyncStorage.setItem('token', data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        
        // 保存新的过期时间
        const tokenExpireTime = Date.now() + data.data.expiresIn * 1000;
        await AsyncStorage.setItem('tokenExpireTime', tokenExpireTime.toString());
        
        return data.data.accessToken;
      } else {
        throw new Error('刷新 Token 失败');
      }
    } catch (error) {
      console.error('刷新Token失败:', error);
      return null;
    }
  }

  // 将等待刷新的请求加入队列
  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  // 通知所有等待的请求 token 已刷新
  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  // 清除Token（用于登录过期）
  private async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('tokenExpireTime');
      await AsyncStorage.removeItem('userInfo');
    } catch (error) {
      console.error('清除Token失败:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('[API] 请求 URL:', url);
    console.log('[API] 请求方法:', options.method);
    console.log('[API] 请求头:', options.headers);
    console.log('[API] 请求体:', options.body);
    
    let token = await this.getToken();
    console.log('[API] Token:', token ? '已获取' : '未获取');
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      console.log('[API] 响应状态:', response.status);
      
      // 处理401未授权错误
      if (response.status === 401) {
        if (this.isRefreshing) {
          // 如果正在刷新，将请求加入队列
          return new Promise((resolve) => {
            this.subscribeTokenRefresh((newToken: string) => {
              // 使用新 token 重新请求
              const newOptions = {
                ...defaultOptions,
                headers: {
                  ...defaultOptions.headers,
                  'Authorization': `Bearer ${newToken}`,
                },
              };
              fetch(url, { ...newOptions, ...options })
                .then(res => res.json())
                .then(data => resolve(data));
            });
          }) as Promise<ApiResponse<T>>;
        } else {
          // 开始刷新 token
          this.isRefreshing = true;
          const newToken = await this.refreshToken();
          this.isRefreshing = false;

          if (newToken) {
            // 刷新成功，通知所有等待的请求
            this.onRefreshed(newToken);
            // 使用新 token 重新请求
            const newOptions = {
              ...defaultOptions,
              headers: {
                ...defaultOptions.headers,
                'Authorization': `Bearer ${newToken}`,
              },
            };
            const retryResponse = await fetch(url, { ...newOptions, ...options });
            const data = await retryResponse.json();
            return data;
          } else {
            // 刷新失败，清除 token 并跳转登录
            await this.clearToken();
            // 触发跳转到登录页面
            router.replace('/login');
            throw new Error('登录已过期，请重新登录');
          }
        }
      }
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API] 响应数据:', data);
      return data;
    } catch (error) {
      console.error('[API] 请求失败:', error);
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    // 确保params存在且不为空，过滤掉空字符串
    const validParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    ) : {};
    
    const queryString = Object.keys(validParams).length > 0
      ? `?${new URLSearchParams(validParams).toString()}`
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

const api = new Api();
export default api;
