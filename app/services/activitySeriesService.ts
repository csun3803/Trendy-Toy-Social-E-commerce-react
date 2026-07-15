import api from '../utils/api';
import type { ApiResponse } from '../types';

export interface ActivityProductReference {
  referenceId: string;
  activityId: string;
  seriesId: string;
}

export const getSeriesByActivity = async (activityId: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/activity/${activityId}/series`);
    return response;
  } catch (error) {
    console.error('Failed to get series by activity:', error);
    throw error;
  }
};

export const getActivitiesBySeries = async (seriesId: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/series/${seriesId}/activities`);
    return response;
  } catch (error) {
    console.error('Failed to get activities by series:', error);
    throw error;
  }
};

export const addActivitySeriesReference = async (activityId: string, seriesId: string) => {
  try {
    const response = await api.post<ApiResponse<any>>('/activity/series/reference', {
      activityId,
      seriesId,
    });
    return response;
  } catch (error) {
    console.error('Failed to add activity series reference:', error);
    throw error;
  }
};

export const removeActivitySeriesReference = async (referenceId: string) => {
  try {
    const response = await api.delete<ApiResponse<any>>(`/activity/series/reference/${referenceId}`);
    return response;
  } catch (error) {
    console.error('Failed to remove activity series reference:', error);
    throw error;
  }
};
