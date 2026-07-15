import api from '../utils/api';
import type { ApiResponse, CommentListResponse, Comment, CreateCommentRequest, UpdateCommentRequest } from '../types';

export const getCommentList = async (activityId: string, params: {
  page: number;
  size: number;
}) => {
  try {
    const response = await api.get<ApiResponse<CommentListResponse>>(`/activity/${activityId}/comments`, params);
    return response;
  } catch (error) {
    console.error('Failed to fetch comment list:', error);
    throw error;
  }
};

export const getCommentDetail = async (commentId: string) => {
  try {
    const response = await api.get<ApiResponse<Comment>>(`/comment/${commentId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch comment detail:', error);
    throw error;
  }
};

export const createComment = async (data: CreateCommentRequest) => {
  try {
    const response = await api.post<ApiResponse<Comment>>('/comment', data);
    return response;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
};

export const updateComment = async (data: UpdateCommentRequest) => {
  try {
    const response = await api.put<ApiResponse<Comment>>('/comment', data);
    return response;
  } catch (error) {
    console.error('Failed to update comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/comment/${commentId}`);
    return response;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
};

export const likeComment = async (commentId: string) => {
  try {
    const response = await api.post<ApiResponse<void>>(`/comment/${commentId}/like`);
    return response;
  } catch (error) {
    console.error('Failed to like comment:', error);
    throw error;
  }
};

export const unlikeComment = async (commentId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/comment/${commentId}/like`);
    return response;
  } catch (error) {
    console.error('Failed to unlike comment:', error);
    throw error;
  }
};
