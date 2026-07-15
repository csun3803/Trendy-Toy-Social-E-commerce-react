import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Input, Select, Button, App } from 'antd';
import { useNavigate } from '@umijs/max';
import { request } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface SessionRecord {
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

const statusColorMap: Record<string, string> = {
  '待处理': 'red',
  '处理中': 'blue',
  '已关闭': 'default',
};

const sourceMap: Record<string, string> = {
  '商品咨询': 'green',
  '订单售后': 'orange',
};

const SessionList: React.FC = () => {
  const [data, setData] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { message: messageApi } = App.useApp();

  const fetchSessions = async (page = 1, size = 10, status?: string, source?: string) => {
    setLoading(true);
    try {
      const params: any = { page, size };
      if (status) params.status = status;
      if (source) params.source = source;
      const res = await request('/api/customer-service/sessions', { method: 'GET', params });
      if (res?.code === 200 && res.data) {
        setData(res.data.records || []);
        setPagination({ current: res.data.current || page, pageSize: res.data.size || size, total: res.data.total || 0 });
      }
    } catch (error) {
      console.error('获取会话列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTableChange = (pag: any) => {
    fetchSessions(pag.current, pag.pageSize, statusFilter, sourceFilter);
  };

  const handleFilterChange = () => {
    fetchSessions(1, pagination.pageSize, statusFilter, sourceFilter);
  };

  const handleViewChat = (sessionId: string) => {
    navigate(`/customer-service/chat/${sessionId}`);
  };

  const handleCloseSession = async (sessionId: string) => {
    try {
      const res = await request(`/api/customer-service/sessions/${sessionId}/status`, {
        method: 'PUT',
        data: { status: '已关闭' },
      });
      if (res?.code === 200) {
        messageApi.success('会话已关闭');
        fetchSessions(pagination.current, pagination.pageSize, statusFilter, sourceFilter);
      }
    } catch (error) {
      messageApi.error('操作失败');
    }
  };

  const columns: ColumnsType<SessionRecord> = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (text: string, record: SessionRecord) => (
        <a onClick={() => handleViewChat(record.sessionId)} style={{ color: '#1890ff' }}>{text}</a>
      ),
    },
    {
      title: '用户昵称',
      dataIndex: 'userNickname',
      key: 'userNickname',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '最后消息',
      dataIndex: 'lastMessageContent',
      key: 'lastMessageContent',
      ellipsis: true,
    },
    {
      title: '最后消息时间',
      dataIndex: 'lastMessageTime',
      key: 'lastMessageTime',
      width: 170,
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '未读数',
      dataIndex: 'unreadCount',
      key: 'unreadCount',
      width: 80,
      render: (count: number) => count > 0 ? <Tag color="red">{count}</Tag> : <Tag>0</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => source ? <Tag color={sourceMap[source] || 'default'}>{source}</Tag> : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: SessionRecord) => (
        <Space>
          <a onClick={() => handleViewChat(record.sessionId)}>查看对话</a>
          {record.status !== '已关闭' && (
            <a style={{ color: '#ff4d4f' }} onClick={() => handleCloseSession(record.sessionId)}>关闭</a>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="客服对话列表">
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); }}
            options={[
              { label: '待处理', value: '待处理' },
              { label: '处理中', value: '处理中' },
              { label: '已关闭', value: '已关闭' },
            ]}
          />
          <Select
            placeholder="来源筛选"
            allowClear
            style={{ width: 140 }}
            value={sourceFilter}
            onChange={(val) => { setSourceFilter(val); }}
            options={[
              { label: '商品咨询', value: '商品咨询' },
              { label: '订单售后', value: '订单售后' },
            ]}
          />
          <Button type="primary" onClick={handleFilterChange}>查询</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="sessionId"
          loading={loading}
          size="middle"
          scroll={{ x: 'max-content' }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          onRow={(record) => ({
            onDoubleClick: () => handleViewChat(record.sessionId),
          })}
        />
      </Card>
    </div>
  );
};

export default SessionList;
