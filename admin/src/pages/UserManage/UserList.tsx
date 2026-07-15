import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, App, Modal, Form, Input, Select, Row, Col, Descriptions, Image, InputNumber, Dropdown, MenuProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, LockOutlined, UnlockOutlined, UserOutlined, MoreOutlined } from '@ant-design/icons';
import { getUserList, getUserById, updateUser, deleteUser, updateUserStatus, type User } from '../../services/userManage';

const { Option } = Select;
const { Text } = Input;

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchParams, setSearchParams] = useState({ accountStatus: '', keyword: '' });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (searchParams.accountStatus) params.accountStatus = searchParams.accountStatus;
      if (searchParams.keyword) params.keyword = searchParams.keyword;

      const response = await getUserList(params);
      
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setUsers(data.records || data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: data.total || 0,
        });
      } else {
        message.error('获取用户列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取用户列表失败', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record: User) => {
    try {
      const response = await getUserById(record.userId);
      if (response.code === 200 || response.message === 'success') {
        setSelectedUser(response.data);
        setViewModalVisible(true);
      }
    } catch (error) {
      console.error('获取用户详情失败', error);
    }
  };

  const handleEdit = (record: User) => {
    setSelectedUser(record);
    form.setFieldsValue({
      username: record.username,
      phoneNumber: record.phoneNumber,
      email: record.email,
      gender: record.gender,
      location: record.location,
      bio: record.bio,
      accountStatus: record.accountStatus,
      accountLevel: record.accountLevel,
      membershipType: record.membershipType,
    });
    setEditModalVisible(true);
  };

  const handleDelete = (userId: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除该用户吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteUser(userId);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchUsers(pagination.current, pagination.pageSize);
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          console.error('删除失败', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    modal.confirm({
      title: newStatus === 'active' ? '确认启用' : '确认禁用',
      content: newStatus === 'active' ? '确定要启用该用户吗？' : '确定要禁用该用户吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await updateUserStatus(userId, newStatus);
          if (response.code === 200 || response.message === 'success') {
            message.success('状态更新成功');
            fetchUsers(pagination.current, pagination.pageSize);
          } else {
            message.error('状态更新失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          console.error('状态更新失败', error);
          message.error('状态更新失败');
        }
      },
    });
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    try {
      const values = await form.validateFields();
      const response = await updateUser(selectedUser.userId, values);
      if (response.code === 200 || response.message === 'success') {
        message.success('更新成功');
        setEditModalVisible(false);
        fetchUsers(pagination.current, pagination.pageSize);
      } else {
        message.error('更新失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('更新失败', error);
      message.error('更新失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'green',
      inactive: 'red',
      banned: 'orange',
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      active: '正常',
      inactive: '未激活',
      banned: '已禁用',
    };
    return textMap[status] || status;
  };

  const getActionMenuItems = (record: User): MenuProps['items'] => [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: () => handleView(record),
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: () => handleEdit(record),
    },
    {
      key: 'status',
      label: record.accountStatus === 'active' ? '禁用' : '启用',
      icon: record.accountStatus === 'active' ? <LockOutlined /> : <UnlockOutlined />,
      danger: record.accountStatus === 'active',
      onClick: () => handleStatusChange(record.userId, record.accountStatus === 'active' ? 'banned' : 'active'),
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(record.userId),
    },
  ];

  const toggleExpandRow = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 60,
      render: (avatarUrl: string) => (
        avatarUrl ? (
          <Image
            src={avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:8080${avatarUrl}`}
            width={36}
            height={36}
            style={{ objectFit: 'cover', borderRadius: '50%' }}
            fallback="https://via.placeholder.com/36"
          />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserOutlined />
          </div>
        )
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text: string, record: User) => (
        <a onClick={(e) => { e.stopPropagation(); handleView(record); }} style={{ color: '#1a56db' }}>
          {text}
        </a>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 130,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'accountStatus',
      key: 'accountStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'accountLevel',
      key: 'accountLevel',
      width: 80,
    },
    {
      title: '会员类型',
      dataIndex: 'membershipType',
      key: 'membershipType',
      width: 100,
    },
    {
      title: '粉丝/关注',
      key: 'follow',
      width: 120,
      render: (_: any, record: User) => (
        <span>{record.followerCount || 0} / {record.followingCount || 0}</span>
      ),
    },
    {
      title: '发帖数',
      dataIndex: 'postCount',
      key: 'postCount',
      width: 80,
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
      width: 160,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={['hover']}
          placement="bottomRight"
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="用户管理">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="账号状态"
            style={{ width: 120 }}
            value={searchParams.accountStatus || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, accountStatus: value || '' })}
            allowClear
          >
            <Option value="active">正常</Option>
            <Option value="inactive">未激活</Option>
            <Option value="banned">已禁用</Option>
          </Select>
          <Input
            placeholder="搜索用户名/手机号/邮箱"
            style={{ width: 250 }}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchUsers(1, pagination.pageSize)}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setSearchParams({ accountStatus: '', keyword: '' });
            fetchUsers(1, pagination.pageSize);
          }}>
            重置
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="userId"
          scroll={{ x: 'max-content' }}
          size="middle"
          onRow={(record) => ({
            onDoubleClick: () => handleView(record),
          })}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(pagination) => fetchUsers(pagination.current || 1, pagination.pageSize || 10)}
        />
      </Card>

      <Modal
        title="用户详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[<Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>]}
        width={800}
      >
        {selectedUser && (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="用户ID" span={2}>{selectedUser.userId}</Descriptions.Item>
              <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedUser.phoneNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedUser.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">{selectedUser.gender || '-'}</Descriptions.Item>
              <Descriptions.Item label="生日">{selectedUser.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString() : '-'}</Descriptions.Item>
              <Descriptions.Item label="所在地">{selectedUser.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="账号状态">
                <Tag color={getStatusColor(selectedUser.accountStatus)}>{getStatusText(selectedUser.accountStatus)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="账号等级">{selectedUser.accountLevel}</Descriptions.Item>
              <Descriptions.Item label="会员类型">{selectedUser.membershipType || '-'}</Descriptions.Item>
              <Descriptions.Item label="个人简介" span={2}>{selectedUser.bio || '-'}</Descriptions.Item>
            </Descriptions>

            {selectedUser.avatarUrl && (
              <div style={{ marginTop: 24 }}>
                <h3>头像</h3>
                <Image
                  src={selectedUser.avatarUrl.startsWith('http') ? selectedUser.avatarUrl : `http://localhost:8080${selectedUser.avatarUrl}`}
                  width={150}
                  style={{ borderRadius: '50%' }}
                />
              </div>
            )}

            <Descriptions title="统计信息" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="总订单数">{selectedUser.totalOrders || 0}</Descriptions.Item>
              <Descriptions.Item label="总消费">{selectedUser.totalSpent || 0}</Descriptions.Item>
              <Descriptions.Item label="总登录次数">{selectedUser.totalLoginCount || 0}</Descriptions.Item>
              <Descriptions.Item label="连续登录天数">{selectedUser.consecutiveLoginDays || 0}</Descriptions.Item>
              <Descriptions.Item label="发帖数">{selectedUser.postCount || 0}</Descriptions.Item>
              <Descriptions.Item label="关注数">{selectedUser.followingCount || 0}</Descriptions.Item>
              <Descriptions.Item label="粉丝数">{selectedUser.followerCount || 0}</Descriptions.Item>
              <Descriptions.Item label="获赞数">{selectedUser.totalLikesReceived || 0}</Descriptions.Item>
              <Descriptions.Item label="收藏商品数">{selectedUser.favoriteProductCount || 0}</Descriptions.Item>
              <Descriptions.Item label="优惠券数">{selectedUser.couponCount || 0}</Descriptions.Item>
              <Descriptions.Item label="收藏册数" span={2}>{selectedUser.cabinetCount || 0}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="时间信息" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="注册时间">{selectedUser.registerTime ? new Date(selectedUser.registerTime).toLocaleString() : '-'}</Descriptions.Item>
              <Descriptions.Item label="最后登录">{selectedUser.lastLoginTime ? new Date(selectedUser.lastLoginTime).toLocaleString() : '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="编辑用户"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phoneNumber" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择性别">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountStatus" label="账号状态" initialValue="active">
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="inactive">未激活</Option>
                  <Option value="banned">已禁用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountLevel" label="账号等级">
                <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="请输入账号等级" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="membershipType" label="会员类型">
                <Select placeholder="请选择会员类型">
                  <Option value="normal">普通会员</Option>
                  <Option value="silver">银牌会员</Option>
                  <Option value="gold">金牌会员</Option>
                  <Option value="platinum">白金会员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="所在地">
                <Input placeholder="请输入所在地" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={3} placeholder="请输入个人简介" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
