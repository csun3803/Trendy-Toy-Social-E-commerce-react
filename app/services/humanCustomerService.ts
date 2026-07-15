import api from '../utils/api';
import type { ApiResponse } from '../types';

export interface HumanServiceSession {
  sessionId: string;
  userId: string;
  userNickname: string;
  lastMessageContent: string;
  lastMessageTime: string;
  unreadCount: number;
  status: string;
  source: string;
  adminId: string;
  createTime: string;
}

export interface HumanServiceMessage {
  messageId: string;
  sessionId: string;
  senderType: string;
  senderId: string;
  content: string;
  messageType: string;
  isRead: number;
  createTime: string;
}

// 创建/获取人工客服会话
export const createHumanServiceSession = async (userId: string, userNickname?: string, source?: string) => {
  try {
    const response = await api.post<HumanServiceSession>('/customer-service/user/session', {
      userId,
      userNickname: userNickname || '',
      source: source || '商品咨询',
    });
    return response;
  } catch (error) {
    console.error('创建人工客服会话失败:', error);
    throw error;
  }
};

// 用户发送消息
export const sendHumanServiceMessage = async (sessionId: string, userId: string, content: string) => {
  try {
    const response = await api.post<HumanServiceMessage>('/customer-service/user/message', {
      sessionId,
      userId,
      content,
    });
    return response;
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
};

// 获取用户的进行中会话
export const getActiveHumanServiceSession = async (userId: string) => {
  try {
    const response = await api.get<HumanServiceSession>('/customer-service/user/active-session', {
      userId,
    });
    return response;
  } catch (error) {
    console.error('获取进行中会话失败:', error);
    throw error;
  }
};

// 获取会话消息列表
export const getHumanServiceMessages = async (sessionId: string) => {
  try {
    const response = await api.get<HumanServiceMessage[]>('/customer-service/user/messages', {
      sessionId,
    });
    return response;
  } catch (error) {
    console.error('获取消息列表失败:', error);
    throw error;
  }
};
