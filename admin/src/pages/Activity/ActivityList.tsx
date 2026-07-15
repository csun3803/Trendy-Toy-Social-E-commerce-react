import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, App, Modal, Input, Select } from 'antd';
import { DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from '@umijs/max';
import { getActivityList, deleteActivity, type Activity } from '../../services/activity';

const { Option } = Select;

const ActivityList: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchParams, setSearchParams] = useState({
    auditStatus: '',
    publishStatus: '',
    activityType: '',
  });
  const { message } = App.useApp();
  const navigate = useNavigate();

  const fetchActivities = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (searchParams.auditStatus) params.auditStatus = searchParams.auditStatus;
      if (searchParams.publishStatus) params.publishStatus = searchParams.publishStatus;
      if (searchParams.activityType) params.activityType = searchParams.activityType;

      const response = await getActivityList(params);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setActivities(data.records || data.list || []);
        setPagination({ current: page, pageSize, total: data.total || 0 });
      } else {
        message.error('获取列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleViewDetail = (activityId: string) => {
    navigate(`/community/detail/${activityId}`);
  };

  const handleDeleteActivity = (activityId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该帖子吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteActivity(activityId);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchActivities(pagination.current, pagination.pageSize);
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSearch = () => fetchActivities(1, pagination.pageSize);
  const handleReset = () => {
    setSearchParams({ auditStatus: '', publishStatus: '', activityType: '' });
    fetchActivities(1, pagination.pageSize);
  };

  const getAuditStatusColor = (status: string) => {
    switch (status) {
      case '待审核': return 'orange';
      case '审核通过': return 'green';
      case '审核拒绝': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 60,
      render: (coverImage: string) => (
        coverImage ? (
          <img
            src={coverImage.startsWith('http') ? coverImage : `http://localhost:8080${coverImage}`}
            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text: string, record: Activity) => (
        <a onClick={() => handleViewDetail(record.activityId)} style={{ color: '#1a56db' }}>{text}</a>
      ),
    },
    { title: '类型', dataIndex: 'activityType', key: 'activityType', width: 80 },
    {
      title: '发布者',
      dataIndex: 'userInfo',
      key: 'userInfo',
      width: 120,
      render: (userInfo: any) => userInfo?.username || '-',
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (status: string) => <Tag color={getAuditStatusColor(status)}>{status || '待审核'}</Tag>,
    },
    {
      title: '浏览/点赞',
      key: 'stats',
      width: 100,
      render: (_: any, record: Activity) => <span>{record.viewCount || 0} / {record.likeCount || 0}</span>,
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 160,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Activity) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.activityId)}>
            查看详情
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteActivity(record.activityId)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="社区内容列表">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="审核状态"
            style={{ width: 120 }}
            value={searchParams.auditStatus || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, auditStatus: value || '' })}
            allowClear
          >
            <Option value="待审核">待审核</Option>
            <Option value="审核通过">审核通过</Option>
            <Option value="审核拒绝">审核拒绝</Option>
          </Select>
          <Select
            placeholder="发布状态"
            style={{ width: 120 }}
            value={searchParams.publishStatus || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, publishStatus: value || '' })}
            allowClear
          >
            <Option value="published">已发布</Option>
            <Option value="draft">编辑中</Option>
          </Select>
          <Select
            placeholder="动态类型"
            style={{ width: 120 }}
            value={searchParams.activityType || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, activityType: value || '' })}
            allowClear
          >
            <Option value="开箱">开箱</Option>
            <Option value="展示">展示</Option>
            <Option value="评测">评测</Option>
            <Option value="分享">分享</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </div>

        <Table
          columns={columns}
          dataSource={activities}
          loading={loading}
          rowKey="activityId"
          scroll={{ x: 'max-content' }}
          size="middle"
          onRow={(record) => ({ onDoubleClick: () => handleViewDetail(record.activityId) })}
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }}
          onChange={(p) => fetchActivities(p.current || 1, p.pageSize || 10)}
        />
      </Card>
    </div>
  );
};

export default ActivityList;
