import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  App,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
  Dropdown,
  MenuProps,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  type CouponTemplate,
  type CouponTemplateRequest,
} from '../../services/coupon';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({ name: '', status: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CouponTemplate | null>(null);
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchParams.name) params.name = searchParams.name;
      if (searchParams.status) params.status = searchParams.status;
      const response = await listTemplates(params);
      if (response.code === 200 || response.message === 'success') {
        setTemplates(response.data || []);
      } else {
        message.error('获取模板列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取模板列表失败', error);
      message.error('获取模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'FULL_REDUCTION',
      minSpend: 0,
      validDays: 30,
      totalQuantity: 0,
      userLimit: 1,
      status: 'active',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: CouponTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      templateId: record.templateId,
      name: record.name,
      type: record.type,
      discountValue: record.discountValue,
      minSpend: record.minSpend,
      validRange: [record.validFrom ? dayjs(record.validFrom) : null, record.validTo ? dayjs(record.validTo) : null],
      validDays: record.validDays,
      totalQuantity: record.totalQuantity,
      userLimit: record.userLimit,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleToggleStatus = (record: CouponTemplate) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    modal.confirm({
      title: newStatus === 'active' ? '确认启用' : '确认停用',
      content: `确定要${newStatus === 'active' ? '启用' : '停用'}模板「${record.name}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await toggleTemplateStatus(record.templateId, newStatus);
          if (response.code === 200 || response.message === 'success') {
            message.success('状态更新成功');
            fetchTemplates();
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

  const handleDelete = (record: CouponTemplate) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除模板「${record.name}」吗？存在未使用券时无法删除。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteTemplate(record.templateId);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchTemplates();
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
      const validRange = values.validRange;
      if (!validRange || !validRange[0] || !validRange[1]) {
        message.error('请选择有效日期范围');
        return;
      }
      const data: CouponTemplateRequest = {
        templateId: editingTemplate?.templateId,
        name: values.name,
        type: values.type || 'FULL_REDUCTION',
        discountValue: Number(values.discountValue),
        minSpend: Number(values.minSpend || 0),
        validFrom: validRange[0].format('YYYY-MM-DD'),
        validTo: validRange[1].format('YYYY-MM-DD'),
        validDays: Number(values.validDays || 30),
        totalQuantity: Number(values.totalQuantity || 0),
        userLimit: Number(values.userLimit || 1),
        status: values.status || 'active',
      };
      const response = editingTemplate
        ? await updateTemplate(data)
        : await createTemplate(data);
      if (response.code === 200 || response.message === 'success') {
        message.success(editingTemplate ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchTemplates();
      } else {
        message.error((editingTemplate ? '更新失败: ' : '创建失败: ') + (response.message || '未知错误'));
      }
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('提交失败', error);
      message.error('提交失败');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="green">启用</Tag>;
      case 'inactive':
        return <Tag color="red">停用</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };


  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: CouponTemplate) => (
        <a onClick={(e) => { e.stopPropagation(); handleEdit(record); }} style={{ color: '#1a56db' }}>
          {text}
        </a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (type === 'FULL_REDUCTION' ? '满减券' : type),
    },
    {
      title: '减扣金额',
      dataIndex: 'discountValue',
      key: 'discountValue',
      width: 100,
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '满减门槛',
      dataIndex: 'minSpend',
      key: 'minSpend',
      width: 100,
      render: (v: number) => `满¥${Number(v).toFixed(2)}`,
    },
    {
      title: '有效天数',
      dataIndex: 'validDays',
      key: 'validDays',
      width: 90,
      render: (v: number) => `${v}天`,
    },
    {
      title: '有效期',
      key: 'validDate',
      width: 200,
      render: (_: any, record: CouponTemplate) =>
        `${record.validFrom} ~ ${record.validTo}`,
    },
    {
      title: '发放总量',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 90,
      render: (v: number) => (v === 0 ? '不限' : v),
    },
    {
      title: '每人限领',
      dataIndex: 'userLimit',
      key: 'userLimit',
      width: 90,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: CouponTemplate) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record)}>
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <GiftOutlined />
            <span>优惠券模板</span>
          </Space>
        }
      >
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="模板名称"
            style={{ width: 200 }}
            value={searchParams.name}
            onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
            allowClear
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            value={searchParams.status || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
            allowClear
          >
            <Option value="active">启用</Option>
            <Option value="inactive">停用</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchTemplates}>
            搜索
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchParams({ name: '', status: '' });
              setTimeout(fetchTemplates, 0);
            }}
          >
            重置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建模板
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={templates}
          loading={loading}
          rowKey="templateId"
          scroll={{ x: 'max-content' }}
          size="middle"
          onRow={(record) => ({
            onDoubleClick: () => handleEdit(record),
          })}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="如：满100减20" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="券类型">
                <Select>
                  <Option value="FULL_REDUCTION">满减券</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label="减扣金额"
                rules={[{ required: true, message: '请输入减扣金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  precision={2}
                  placeholder="如：20"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minSpend" label="满减门槛">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="如：100（0为无门槛）"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="validRange"
            label="模板有效日期范围"
            rules={[{ required: true, message: '请选择有效日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="validDays"
                label="发券后有效天数"
                rules={[{ required: true, message: '请输入有效天数' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} placeholder="如：30" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="totalQuantity" label="发放总量（0=不限）">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="userLimit" label="每人限领">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateList;
