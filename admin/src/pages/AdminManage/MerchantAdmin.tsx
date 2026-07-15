import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, App, Modal, Form, Input, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  getMerchantAdminList, 
  createMerchantAdmin, 
  updateMerchantAdmin, 
  deleteMerchantAdmin,
  type MerchantAdmin 
} from '../../services/adminManage';

const { Option } = Select;

const MerchantAdmin: React.FC = () => {
  const [admins, setAdmins] = useState<MerchantAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchParams, setSearchParams] = useState({ auditStatus: '', isActive: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<MerchantAdmin | null>(null);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (searchParams.auditStatus) params.auditStatus = searchParams.auditStatus;
      if (searchParams.isActive) params.isActive = searchParams.isActive;

      const response = await getMerchantAdminList(params);
      
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setAdmins(data.records || data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: data.total || 0,
        });
      } else {
        message.error('获取店铺管理员列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取店铺管理员列表失败', error);
      message.error('获取店铺管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAdmin(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: MerchantAdmin) => {
    setEditingAdmin(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (adminId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该商家管理员吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteMerchantAdmin(adminId);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchAdmins(pagination.current, pagination.pageSize);
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let response;
      if (editingAdmin) {
        response = await updateMerchantAdmin(editingAdmin.adminId, values);
      } else {
        response = await createMerchantAdmin(values);
      }
      
      if (response.code === 200 || response.message === 'success') {
        message.success(editingAdmin ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchAdmins(pagination.current, pagination.pageSize);
      } else {
        message.error((editingAdmin ? '更新失败: ' : '创建失败: ') + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('提交失败', error);
      message.error('提交失败');
    }
  };

  const columns = [
    {
      title: '管理员ID',
      dataIndex: 'adminId',
      key: 'adminId',
      width: 120,
      render: (text: string) => (
        <a onClick={(e) => { e.stopPropagation(); }} style={{ color: '#1a56db' }}>
          {text}
        </a>
      ),
    },
    {
      title: '店铺ID',
      dataIndex: 'shopId',
      key: 'shopId',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: number) => (
        <Tag color={isActive === 1 ? 'green' : 'red'}>
          {isActive === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '待审核': 'orange',
          '已通过': 'green',
          '已拒绝': 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status || '待审核'}</Tag>;
      },
    },
    {
      title: '登录次数',
      dataIndex: 'loginCount',
      key: 'loginCount',
      width: 100,
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 160,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: MerchantAdmin) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.adminId)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="店铺管理员管理">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="审核状态"
            style={{ width: 120 }}
            value={searchParams.auditStatus || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, auditStatus: value || '' })}
            allowClear
          >
            <Option value="待审核">待审核</Option>
            <Option value="已通过">已通过</Option>
            <Option value="已拒绝">已拒绝</Option>
          </Select>
          <Select
            placeholder="启用状态"
            style={{ width: 120 }}
            value={searchParams.isActive || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, isActive: value || '' })}
            allowClear
          >
            <Option value="1">启用</Option>
            <Option value="0">禁用</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchAdmins(1, pagination.pageSize)}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setSearchParams({ auditStatus: '', isActive: '' });
            fetchAdmins(1, pagination.pageSize);
          }}>
            重置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增商家管理员
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={admins}
          loading={loading}
          rowKey="adminId"
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            onDoubleClick: () => {},
          })}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(pagination) => fetchAdmins(pagination.current || 1, pagination.pageSize || 10)}
        />
      </Card>

      <Modal
        title={editingAdmin ? '编辑店铺管理员' : '新增店铺管理员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="adminId" label="管理员ID" rules={[{ required: true, message: '请输入管理员ID' }]}>
                <Input placeholder="请输入管理员ID" disabled={!!editingAdmin} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shopId" label="店铺ID" rules={[{ required: true, message: '请输入店铺ID' }]}>
                <Input placeholder="请输入店铺ID" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="password" label="密码" rules={[{ required: !editingAdmin, message: '请输入密码' }]}>
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="状态" initialValue={1}>
                <Select>
                  <Option value={1}>启用</Option>
                  <Option value={0}>禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="auditNotes" label="审核备注">
            <Input.TextArea rows={3} placeholder="请输入审核备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MerchantAdmin;
