import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, App, Modal, Form, Input, Select, Descriptions, Image, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import {
  getMerchantApplicationList,
  getMerchantApplicationDetail,
  approveMerchantApplication,
  rejectMerchantApplication,
  type MerchantApplication,
} from '../../services/adminManage';

const { Option } = Select;

const SUBJECT_TYPE_MAP: Record<number, string> = {
  0: '个人',
  1: '个体户',
  2: '企业',
};

const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '待审核', color: 'blue' },
  1: { text: '已通过', color: 'green' },
  2: { text: '已驳回', color: 'red' },
};

const MerchantApplicationAudit: React.FC = () => {
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState<MerchantApplication | null>(null);
  const [rejectForm] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (statusFilter !== undefined) params.status = statusFilter;

      const response = await getMerchantApplicationList(params);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setApplications(data.records || data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: data.total || 0,
        });
      } else {
        message.error('获取申请列表失败');
      }
    } catch (error) {
      message.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: MerchantApplication) => {
    setCurrentApp(record);
    setDetailModalVisible(true);
  };

  const handleAudit = (record: MerchantApplication) => {
    setCurrentApp(record);
    rejectForm.resetFields();
    setAuditModalVisible(true);
  };

  const handleApprove = async () => {
    if (!currentApp) return;
    try {
      const response = await approveMerchantApplication(currentApp.id, {});
      if (response.code === 200 || response.message === 'success') {
        message.success('审核通过');
        setAuditModalVisible(false);
        fetchApplications(pagination.current, pagination.pageSize);
      } else {
        message.error('审核失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (!currentApp) return;
      const response = await rejectMerchantApplication(currentApp.id, {
        auditRemark: values.auditRemark,
      });
      if (response.code === 200 || response.message === 'success') {
        message.success('已驳回');
        setAuditModalVisible(false);
        fetchApplications(pagination.current, pagination.pageSize);
      } else {
        message.error('驳回失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      // form validation error
    }
  };


  const columns = [
    {
      title: '申请单号',
      dataIndex: 'applySn',
      key: 'applySn',
      width: 180,
    },
    {
      title: '店铺名称',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 160,
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 120,
    },
    {
      title: '主体类型',
      dataIndex: 'subjectType',
      key: 'subjectType',
      width: 90,
      render: (v: number) => SUBJECT_TYPE_MAP[v] || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: number) => {
        const s = STATUS_MAP[v] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '审核时间',
      dataIndex: 'auditTime',
      key: 'auditTime',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: '驳回原因',
      dataIndex: 'auditRemark',
      key: 'auditRemark',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: MerchantApplication) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 0 && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleAudit(record)}>
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderImageField = (url?: string, label?: string) => {
    if (!url) return '-';
    return (
      <Image
        src={url.startsWith('http') ? url : `http://localhost:8080${url}`}
        width={80}
        height={80}
        style={{ objectFit: 'cover' }}
        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk2iMa1AAAAABJRU5ErkJggg=="
      />
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <Card title="商家入驻审核">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <Select
            placeholder="审核状态"
            style={{ width: 120 }}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            allowClear
          >
            <Option value={0}>待审核</Option>
            <Option value={1}>已通过</Option>
            <Option value={2}>已驳回</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchApplications(1, pagination.pageSize)}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setStatusFilter(undefined);
            fetchApplications(1, pagination.pageSize);
          }}>
            重置
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={applications}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          size="small"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(p) => fetchApplications(p.current || 1, p.pageSize || 10)}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="入驻申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>]}
        width={800}
      >
        {currentApp && (
          <div>
            <Descriptions bordered column={2} size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请单号">{currentApp.applySn}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_MAP[currentApp.status]?.color}>{STATUS_MAP[currentApp.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="店铺名称">{currentApp.shopName}</Descriptions.Item>
              <Descriptions.Item label="联系人">{currentApp.contactName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentApp.mobile}</Descriptions.Item>
              <Descriptions.Item label="主体类型">{SUBJECT_TYPE_MAP[currentApp.subjectType]}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{currentApp.applyTime}</Descriptions.Item>
              <Descriptions.Item label="审核时间">{currentApp.auditTime || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered column={2} size="small" title="资质信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="营业执照号">{currentApp.licenseNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{currentApp.idCardNo}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>证照图片</div>
              <Row gutter={16}>
                {currentApp.licenseImage && (
                  <Col span={8}>
                    <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>营业执照</div>
                    {renderImageField(currentApp.licenseImage)}
                  </Col>
                )}
                <Col span={8}>
                  <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>身份证正面</div>
                  {renderImageField(currentApp.idCardFront)}
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>身份证反面</div>
                  {renderImageField(currentApp.idCardBack)}
                </Col>
              </Row>
            </div>

            <Descriptions bordered column={2} size="small" title="财务信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="银行户名">{currentApp.bankAccountName}</Descriptions.Item>
              <Descriptions.Item label="开户行">{currentApp.bankName}</Descriptions.Item>
              <Descriptions.Item label="银行卡号">{currentApp.bankCardNo}</Descriptions.Item>
            </Descriptions>

            {currentApp.status === 2 && currentApp.auditRemark && (
              <Descriptions bordered column={1} size="small" title="驳回原因">
                <Descriptions.Item label="驳回原因">{currentApp.auditRemark}</Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>

      {/* 审核弹窗 */}
      <Modal
        title="审核入驻申请"
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAuditModalVisible(false)}>
            取消
          </Button>,
          <Button key="reject" danger icon={<CloseOutlined />} onClick={handleReject}>
            驳回
          </Button>,
          <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
            通过
          </Button>,
        ]}
        width={800}
      >
        {currentApp && (
          <div>
            <Descriptions bordered column={2} size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请单号">{currentApp.applySn}</Descriptions.Item>
              <Descriptions.Item label="店铺名称">{currentApp.shopName}</Descriptions.Item>
              <Descriptions.Item label="联系人">{currentApp.contactName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentApp.mobile}</Descriptions.Item>
              <Descriptions.Item label="主体类型">{SUBJECT_TYPE_MAP[currentApp.subjectType]}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{currentApp.applyTime}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered column={2} size="small" title="资质信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="营业执照号">{currentApp.licenseNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{currentApp.idCardNo}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>证照图片</div>
              <Row gutter={16}>
                {currentApp.licenseImage && (
                  <Col span={8}>
                    <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>营业执照</div>
                    {renderImageField(currentApp.licenseImage)}
                  </Col>
                )}
                <Col span={8}>
                  <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>身份证正面</div>
                  {renderImageField(currentApp.idCardFront)}
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>身份证反面</div>
                  {renderImageField(currentApp.idCardBack)}
                </Col>
              </Row>
            </div>

            <Descriptions bordered column={2} size="small" title="财务信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="银行户名">{currentApp.bankAccountName}</Descriptions.Item>
              <Descriptions.Item label="开户行">{currentApp.bankName}</Descriptions.Item>
              <Descriptions.Item label="银行卡号">{currentApp.bankCardNo}</Descriptions.Item>
            </Descriptions>

            <Form form={rejectForm} layout="vertical">
              <Form.Item
                name="auditRemark"
                label="驳回原因"
                extra="驳回时必填"
              >
                <Input.TextArea rows={4} placeholder="请输入驳回原因" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MerchantApplicationAudit;
