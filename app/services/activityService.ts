import api from '../utils/api';
import type { ApiResponse, ActivityListResponse, SocialActivity, CreateActivityRequest, UpdateActivityRequest } from '../types';

export const getActivityList = async (params: {
  page: number;
  size: number;
  activityType?: string;
  userId?: string;
}) => {
  try {
    const response = await api.get<ApiResponse<ActivityListResponse>>('/activity', params);
    return response;
  } catch (error) {
    console.error('Failed to fetch activity list:', error);
    throw error;
  }
};

export const getActivityDetail = async (activityId: string) => {
  try {
    const response = await api.get<ApiResponse<SocialActivity>>(`/activity/${activityId}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch activity detail:', error);
    throw error;
  }
};

export const getMyActivities = async (params: {
  page: number;
  size: number;
  publishStatus?: string;
  activityType?: string;
}) => {
  try {
    const response = await api.get<ApiResponse<ActivityListResponse>>('/activity/my', params);
    return response;
  } catch (error) {
    console.error('Failed to fetch my activities:', error);
    throw error;
  }
};

export const createActivity = async (data: CreateActivityRequest) => {
  try {
    const response = await api.post<ApiResponse<SocialActivity>>('/activity', data);
    return response;
  } catch (error) {
    console.error('Failed to create activity:', error);
    throw error;
  }
};

export const updateActivity = async (data: UpdateActivityRequest) => {
  try {
    const response = await api.put<ApiResponse<SocialActivity>>('/activity', data);
    return response;
  } catch (error) {
    console.error('Failed to update activity:', error);
    throw error;
  }
};

export const deleteActivity = async (activityId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/activity/${activityId}`);
    return response;
  } catch (error) {
    console.error('Failed to delete activity:', error);
    throw error;
  }
};

export const likeActivity = async (activityId: string) => {
  try {
    const response = await api.post<ApiResponse<void>>(`/activity/${activityId}/like`);
    return response;
  } catch (error) {
    console.error('Failed to like activity:', error);
    throw error;
  }
};

export const unlikeActivity = async (activityId: string) => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/activity/${activityId}/like`);
    return response;
  } catch (error) {
    console.error('Failed to unlike activity:', error);
    throw error;
  }
};
