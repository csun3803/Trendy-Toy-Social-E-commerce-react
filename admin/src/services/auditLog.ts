import { request } from '@umijs/max';

export interface AuditLog {
  logId: string;
  operatorId: string;
  operatorName: string;
  operatorType: string;
  action: string;
  module: string;
  description: string;
  targetId: string;
  targetType: string;
  method: string;
  requestUrl: string;
  requestParams: string;
  responseCode: number;
  ipAddress: string;
  createdAt: string;
}

export async function getAuditLogList(params: {
  page: number;
  size: number;
  module?: string;
  action?: string;
  operatorName?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request<{
    data: any;
    code: number;
    message: string;
  }>('/api/audit-log/list', {
    method: 'GET',
    params,
  });
}

export async function getAuditLogById(logId: string) {
  return request<{
    data: AuditLog;
    code: number;
    message: string;
  }>(`/api/audit-log/${logId}`, {
    method: 'GET',
  });
}
