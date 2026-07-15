import api from '../utils/api';
import type { ApiResponse } from '../types';

// AI 回复中附带的卡片（如系列卡片，前端可点击跳转）
export interface SeriesCard {
  type: 'series';
  seriesId: string;
  seriesName: string;
  variantCount: number;
  coverImage: string;
  theme: string;
}

export type MessageCard = SeriesCard;

export interface ChatMessageItem {
  messageId: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createTime: string;
  // AI assistant 回复可能附带卡片，前端渲染为可点击组件
  cards?: MessageCard[];
}

// 发送消息
export const sendChatMessage = async (userId: string, message: string, sessionId?: string) => {
  try {
    const response = await api.post<ApiResponse<ChatMessageItem>>('/ai/customer-service/chat', {
      userId,
      message,
      sessionId,
    });
    return response;
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
};

// 获取聊天历史
export const getChatHistory = async (userId: string, sessionId: string) => {
  try {
    const response = await api.get<ApiResponse<ChatMessageItem[]>>('/ai/customer-service/history', {
      userId,
      sessionId,
    });
    return response;
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    throw error;
  }
};

// 获取会话列表
export const getChatSessions = async (userId: string) => {
  try {
    const response = await api.get<ApiResponse<string[]>>('/ai/customer-service/sessions', {
      userId,
    });
    return response;
  } catch (error) {
    console.error('获取会话列表失败:', error);
    throw error;
  }
};
