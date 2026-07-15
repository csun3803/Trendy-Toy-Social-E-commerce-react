import { request } from '@umijs/max';

export interface Banner {
  bannerId: string;
  title: string;
  imageUrl: string;
  sortOrder: number;
  jumpType: string; // NONE / PRODUCT / ACTIVITY / BLIND_BOX / EXTERNAL_LINK
  jumpValue: string;
  status: string; // ENABLED / DISABLED
  createdAt?: string;
  updatedAt?: string;
}

/** 获取所有轮播图（管理端） */
export async function getAllBanners() {
  return request<{
    data: Banner[];
    code: number;
    message: string;
  }>('/api/banner/admin/list', {
    method: 'GET',
  });
}

/** 获取单个轮播图 */
export async function getBannerDetail(bannerId: string) {
  return request<{
    data: Banner;
    code: number;
    message: string;
  }>(`/api/banner/admin/${bannerId}`, {
    method: 'GET',
  });
}

/** 新增轮播图 */
export async function createBanner(data: Partial<Banner>) {
  return request<{
    data: Banner;
    code: number;
    message: string;
  }>('/api/banner/admin', {
    method: 'POST',
    data,
  });
}

/** 编辑轮播图 */
export async function updateBanner(data: Partial<Banner>) {
  return request<{
    data: Banner;
    code: number;
    message: string;
  }>('/api/banner/admin', {
    method: 'PUT',
    data,
  });
}

/** 删除轮播图 */
export async function deleteBanner(bannerId: string) {
  return request<{
    code: number;
    message: string;
  }>(`/api/banner/admin/${bannerId}`, {
    method: 'DELETE',
  });
}

/** 更新排序 */
export async function updateSortOrder(bannerIds: string[]) {
  return request<{
    code: number;
    message: string;
  }>('/api/banner/admin/sort', {
    method: 'PUT',
    data: { bannerIds },
  });
}

/** 切换上下架状态 */
export async function toggleBannerStatus(bannerId: string) {
  return request<{
    code: number;
    message: string;
  }>(`/api/banner/admin/toggle/${bannerId}`, {
    method: 'PUT',
  });
}

/** 上传图片 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('http://localhost:8080/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });
  const result = await response.json();
  if (result.code === 200 && result.data) {
    // 后端返回 { url, fileName, originalFilename }
    return result.data.url || result.data;
  }
  throw new Error(result.message || '上传失败');
}
