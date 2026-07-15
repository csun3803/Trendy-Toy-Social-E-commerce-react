import { request } from '@umijs/max';

export interface User {
  userId: string;
  username: string;
  phoneNumber: string;
  email: string;
  gender: string;
  birthDate: string;
  location: string;
  bio: string;
  avatarUrl: string;
  accountStatus: string;
  accountLevel: number;
  membershipType: string;
  totalOrders: number;
  totalSpent: number;
  totalLoginCount: number;
  consecutiveLoginDays: number;
  postCount: number;
  followingCount: number;
  followerCount: number;
  totalLikesReceived: number;
  favoriteProductCount: number;
  couponCount: number;
  cabinetCount: number;
  favoriteIps: string[];
  registerTime: string;
  lastLoginTime: string;
}

export async function getUserList(params: {
  page: number;
  size: number;
  accountStatus?: string;
  keyword?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/admin/user/list', {
    method: 'GET',
    params,
  });
}

export async function getUserById(userId: string) {
  return request<{
    data: User;
    code: number;
    message: string;
  }>(`/api/admin/user/${userId}`, {
    method: 'GET',
  });
}

export async function updateUser(userId: string, data: Partial<User>) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/user/${userId}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteUser(userId: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/user/${userId}`, {
    method: 'DELETE',
  });
}

export async function updateUserStatus(userId: string, accountStatus: string) {
  return request<{
    data: void;
    code: number;
    message: string;
  }>(`/api/admin/user/${userId}/status`, {
    method: 'PUT',
    data: { accountStatus },
  });
}
