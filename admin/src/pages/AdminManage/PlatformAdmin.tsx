import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, App, Modal, Form, Input, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  getPlatformAdminList, 
  createPlatformAdmin, 
  updatePlatformAdmin, 
  deletePlatformAdmin,
  type PlatformAdmin 
} from '../../services/adminManage';

const { Option } = Select;

const PlatformAdmin: React.FC = () => {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchParams, setSearchParams] = useState({ adminLevel: '', accountStatus: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<PlatformAdmin | null>(null);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (searchParams.adminLevel) params.adminLevel = searchParams.adminLevel;
      if (searchParams.accountStatus) params.accountStatus = searchParams.accountStatus;

      const response = await getPlatformAdminList(params);
      
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setAdmins(data.records || data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: data.total || 0,
        });
      } else {
        message.error('获取平台管理员列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取平台管理员列表失败', error);
      message.error('获取平台管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAdmin(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PlatformAdmin) => {
    setEditingAdmin(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (adminId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该平台管理员吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deletePlatformAdmin(adminId);
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
        response = await updatePlatformAdmin(editingAdmin.adminId, values);
      } else {
        response = await createPlatformAdmin(values);
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
      title: '工号',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 120,
    },
    {
      title: '级别',
      dataIndex: 'adminLevel',
      key: 'adminLevel',
      width: 120,
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          '超级管理员': 'red',
          '高级管理员': 'orange',
          '普通管理员': 'blue',
          '普通': 'default',
        };
        return <Tag color={colorMap[level] || 'default'}>{level}</Tag>;
      },
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 100,
    },
    {
      title: '账户状态',
      dataIndex: 'accountStatus',
      key: 'accountStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={status === '正常' || status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : status}
        </Tag>
      ),
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
      render: (_: any, record: PlatformAdmin) => (
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
      <Card title="平台管理员管理">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="管理员级别"
            style={{ width: 140 }}
            value={searchParams.adminLevel || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, adminLevel: value || '' })}
            allowClear
          >
            <Option value="超级管理员">超级管理员</Option>
            <Option value="高级管理员">高级管理员</Option>
            <Option value="普通管理员">普通管理员</Option>
            <Option value="普通">普通</Option>
          </Select>
          <Select
            placeholder="账户状态"
            style={{ width: 120 }}
            value={searchParams.accountStatus || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, accountStatus: value || '' })}
            allowClear
          >
            <Option value="正常">正常</Option>
            <Option value="active">正常</Option>
            <Option value="禁用">禁用</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchAdmins(1, pagination.pageSize)}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setSearchParams({ adminLevel: '', accountStatus: '' });
            fetchAdmins(1, pagination.pageSize);
          }}>
            重置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增平台管理员
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
        title={editingAdmin ? '编辑平台管理员' : '新增平台管理员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="adminId" label="管理员ID" rules={[{ required: true, message: '请输入管理员ID' }]}>
                <Input placeholder="请输入管理员ID" disabled={!!editingAdmin} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="employeeId" label="工号">
                <Input placeholder="请输入工号" />
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
              <Form.Item name="adminLevel" label="管理员级别" rules={[{ required: true, message: '请选择管理员级别' }]}>
                <Select placeholder="请选择管理员级别">
                  <Option value="超级管理员">超级管理员</Option>
                  <Option value="高级管理员">高级管理员</Option>
                  <Option value="普通管理员">普通管理员</Option>
                  <Option value="普通">普通</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="部门">
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="职位">
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountStatus" label="账户状态" initialValue="正常">
                <Select>
                  <Option value="正常">正常</Option>
                  <Option value="禁用">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PlatformAdmin;
