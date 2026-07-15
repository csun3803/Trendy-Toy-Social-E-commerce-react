import { request } from '@umijs/max';

export interface Activity {
  activityId: string;
  userId: string;
  activityType: string;
  title: string;
  content: string;
  coverImage: string;
  imageList: string;
  location: string;
  publishStatus: string;
  auditStatus: string;
  auditNotes: string;
  auditorId: string;
  auditedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  shareCount: number;
  publishedAt: string;
  updatedAt: string;
  userInfo?: {
    userId: string;
    username: string;
    avatarUrl: string;
  };
}

export interface ActivityDetail extends Activity {
  imageList: string[];
}

export async function getActivityList(params: {
  page: number;
  size: number;
  auditStatus?: string;
  publishStatus?: string;
  activityType?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/activity/admin/list', {
    method: 'GET',
    params,
  });
}

export async function getActivityDetail(activityId: string) {
  return request<{
    data: ActivityDetail;
    code: number;
    message: string;
  }>(`/api/activity/${activityId}`, {
    method: 'GET',
  });
}

export async function auditActivity(activityId: string, auditStatus: string, auditNotes?: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/activity/admin/audit/${activityId}`, {
    method: 'PUT',
    data: { auditStatus, auditNotes },
  });
}

export async function deleteActivity(activityId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/activity/admin/${activityId}`, {
    method: 'DELETE',
  });
}

// ========== 评论管理 API ==========

export interface CommentRecord {
  commentId: string;
  activityId: string;
  userId: string;
  parentCommentId: string | null;
  rootCommentId: string | null;
  content: string;
  auditStatus: string;
  likeCount: number;
  replyCount: number;
  commentedAt: string;
  ipAddress: string;
  location: string;
  userInfo?: {
    userId: string;
    username: string;
    avatarUrl: string;
  };
}

export async function getCommentList(params: {
  activityId: string;
  page: number;
  size: number;
  keyword?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>(`/api/activity/${params.activityId}/comments`, {
    method: 'GET',
    params: { page: params.page, size: params.size, keyword: params.keyword },
  });
}

export async function deleteComment(commentId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/comment/${commentId}`, {
    method: 'DELETE',
  });
}
