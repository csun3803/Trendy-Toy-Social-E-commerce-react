import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  App,
  Input,
  Select,
  Tabs,
  Modal,
  Form,
  Row,
  Col,
  Descriptions,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  StopOutlined,
  GiftOutlined,
  SendOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  listTemplates,
  listAllUserCoupons,
  revokeUserCoupon,
  issueCoupons,
  type CouponTemplate,
  type UserCouponDTO,
} from '../../services/coupon';
import { getUserList, type User } from '../../services/userManage';

const { Option } = Select;

type StatusTab = 'all' | 'unused' | 'used' | 'expired' | 'revoked';

const UserCouponList: React.FC = () => {
  // 券列表数据
  const [coupons, setCoupons] = useState<UserCouponDTO[]>([]);
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<StatusTab>('all');
  const [keyword, setKeyword] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('');
  const { message, modal } = App.useApp();

  // 发券弹窗状态
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearchKeyword, setUserSearchKeyword] = useState('');

  const selectedTemplate = templates.find((t) => t.templateId === selectedTemplateId);

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      const response = await listTemplates();
      if (response.code === 200 || response.message === 'success') {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('获取模板失败', error);
    }
  };

  // 获取券列表（全量拉取，前端筛选）
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (templateFilter) params.templateId = templateFilter;
      const response = await listAllUserCoupons(params);
      if (response.code === 200 || response.message === 'success') {
        setCoupons(response.data || []);
      } else {
        message.error('获取券列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取券列表失败', error);
      message.error('获取券列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户列表（发券弹窗用）
  const fetchUsers = async (page = 1, pageSize = 50) => {
    setUserLoading(true);
    try {
      const params: any = { page, size: pageSize, accountStatus: 'active' };
      if (userSearchKeyword) params.keyword = userSearchKeyword;
      const response = await getUserList(params);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setUsers(data.records || data.list || []);
      } else {
        message.error('获取用户列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取用户列表失败', error);
      message.error('获取用户列表失败');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCoupons();
  }, []);

  // 状态Tab变化或模板筛选变化时重新拉取
  useEffect(() => {
    fetchCoupons();
  }, [templateFilter]);

  // 前端筛选：状态 + 关键字（用户名/券名称）
  const filteredCoupons = useMemo(() => {
    let list = coupons;
    if (activeStatus !== 'all') {
      list = list.filter((c) => c.status === activeStatus);
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter((c) => {
        const username = (c.username || '').toLowerCase();
        const templateName = (c.templateName || '').toLowerCase();
        const couponCode = (c.couponCode || '').toLowerCase();
        return (
          username.includes(kw) ||
          templateName.includes(kw) ||
          couponCode.includes(kw)
        );
      });
    }
    return list;
  }, [coupons, activeStatus, keyword]);

  // 状态计数
  const statusCounts = useMemo(() => {
    const counts = { all: coupons.length, unused: 0, used: 0, expired: 0, revoked: 0 };
    coupons.forEach((c) => {
      if (c.status === 'unused') counts.unused++;
      else if (c.status === 'used') counts.used++;
      else if (c.status === 'expired') counts.expired++;
      else if (c.status === 'revoked') counts.revoked++;
    });
    return counts;
  }, [coupons]);

  // 打开发券弹窗
  const handleOpenIssueModal = () => {
    setSelectedTemplateId('');
    setSelectedUserIds([]);
    setUserSearchKeyword('');
    setIssueModalVisible(true);
    fetchUsers(1, 50);
  };

  // 发券
  const handleIssue = async () => {
    if (!selectedTemplateId) {
      message.warning('请选择优惠券模板');
      return;
    }
    if (selectedUserIds.length === 0) {
      message.warning('请至少选择一个用户');
      return;
    }
    setIssueSubmitting(true);
    try {
      const response = await issueCoupons(selectedTemplateId, selectedUserIds);
      if (response.code === 200 || response.message === 'success') {
        message.success(`发券成功，共发放 ${selectedUserIds.length} 张`);
        setIssueModalVisible(false);
        // 自动刷新表格
        fetchCoupons();
      } else {
        message.error('发券失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('发券失败', error);
      message.error('发券失败');
    } finally {
      setIssueSubmitting(false);
    }
  };

  // 作废
  const handleRevoke = (record: UserCouponDTO) => {
    modal.confirm({
      title: '确认作废',
      content: `确定要作废用户「${record.username || record.userId}」的券「${
        record.templateName || ''
      }」吗？仅未使用的券可作废。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await revokeUserCoupon(record.userCouponId);
          if (response.code === 200 || response.message === 'success') {
            message.success('作废成功');
            fetchCoupons();
          } else {
            message.error('作废失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          console.error('作废失败', error);
          message.error('作废失败');
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'unused':
        return <Tag color="blue">未使用</Tag>;
      case 'used':
        return <Tag color="green">已使用</Tag>;
      case 'expired':
        return <Tag color="default">已过期</Tag>;
      case 'revoked':
        return <Tag color="red">已作废</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };


  const userRowSelection = {
    selectedRowKeys: selectedUserIds,
    onChange: (keys: React.Key[]) => setSelectedUserIds(keys as string[]),
  };

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'accountStatus',
      key: 'accountStatus',
      render: (status: string) =>
        status === 'active' ? <Tag color="green">正常</Tag> : <Tag>{status}</Tag>,
    },
  ];

  const columns = [
    {
      title: '券码',
      dataIndex: 'couponCode',
      key: 'couponCode',
      width: 200,
    },
    {
      title: '券名称',
      dataIndex: 'templateName',
      key: 'templateName',
      width: 160,
    },
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_: any, record: UserCouponDTO) => (
        <span>
          {record.username || '-'}
          {record.phoneNumber ? ` (${record.phoneNumber})` : ''}
        </span>
      ),
    },
    {
      title: '减扣金额',
      dataIndex: 'discountValue',
      key: 'discountValue',
      width: 100,
      render: (v: number) => `¥${Number(v || 0).toFixed(2)}`,
    },
    {
      title: '门槛',
      dataIndex: 'minSpend',
      key: 'minSpend',
      width: 100,
      render: (v: number) => `满¥${Number(v || 0).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '领取时间',
      dataIndex: 'claimedAt',
      key: 'claimedAt',
      width: 160,
      render: (t: string) => (t ? new Date(t).toLocaleString() : '-'),
    },
    {
      title: '过期日期',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 110,
      render: (t: string) => (t ? t : '-'),
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      width: 160,
      render: (t: string) => (t ? new Date(t).toLocaleString() : '-'),
    },
    {
      title: '订单ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 180,
      render: (id: string) =>
        id ? (
          <span style={{ fontSize: 12, color: '#999' }}>
            {id.substring(0, 8)}...
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: UserCouponDTO) =>
        record.status === 'unused' ? (
          <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleRevoke(record)}>
            作废
          </Button>
        ) : null,
    },
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${statusCounts.all})` },
    { key: 'unused', label: `未使用 (${statusCounts.unused})` },
    { key: 'used', label: `已使用 (${statusCounts.used})` },
    { key: 'expired', label: `已过期 (${statusCounts.expired})` },
    { key: 'revoked', label: `已作废 (${statusCounts.revoked})` },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <GiftOutlined />
            <span>发券管理</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenIssueModal}
          >
            手动发券
          </Button>
        }
      >
        {/* 搜索与筛选区 */}
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索用户名/券名称/券码"
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="按模板筛选"
            style={{ width: 200 }}
            value={templateFilter || undefined}
            onChange={(v) => setTemplateFilter(v || '')}
            allowClear
            showSearch
            optionFilterProp="label"
          >
            {templates.map((t) => (
              <Option key={t.templateId} value={t.templateId} label={t.name}>
                {t.name}
              </Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchCoupons}>
            刷新
          </Button>
        </div>

        {/* 状态Tab */}
        <Tabs
          activeKey={activeStatus}
          onChange={(key) => setActiveStatus(key as StatusTab)}
          items={tabItems}
          size="small"
          style={{ marginBottom: 8 }}
        />

        {/* 券列表表格 */}
        <Table
          columns={columns}
          dataSource={filteredCoupons}
          loading={loading}
          rowKey="userCouponId"
          scroll={{ x: 'max-content' }}
          size="middle"
          style={{ flex: 1 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 手动发券弹窗 */}
      <Modal
        title="手动发券"
        open={issueModalVisible}
        onCancel={() => setIssueModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIssueModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SendOutlined />}
            loading={issueSubmitting}
            disabled={!selectedTemplateId || selectedUserIds.length === 0}
            onClick={handleIssue}
          >
            发券（已选 {selectedUserIds.length} 人）
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="选择优惠券模板" required>
                <Select
                  placeholder="请选择模板"
                  value={selectedTemplateId || undefined}
                  onChange={(v) => setSelectedTemplateId(v)}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                >
                  {templates
                    .filter((t) => t.status === 'active')
                    .map((t) => (
                      <Option key={t.templateId} value={t.templateId} label={t.name}>
                        {t.name}（满¥{Number(t.minSpend).toFixed(2)}减¥
                        {Number(t.discountValue).toFixed(2)} / {t.validDays}天）
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedTemplate && (
            <Descriptions size="small" bordered column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="模板名称">
                {selectedTemplate.name}
              </Descriptions.Item>
              <Descriptions.Item label="减扣金额">
                ¥{Number(selectedTemplate.discountValue).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="满减门槛">
                满¥{Number(selectedTemplate.minSpend).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="发券后有效天数">
                {selectedTemplate.validDays} 天
              </Descriptions.Item>
              <Descriptions.Item label="发放总量">
                {selectedTemplate.totalQuantity === 0
                  ? '不限'
                  : selectedTemplate.totalQuantity}
              </Descriptions.Item>
              <Descriptions.Item label="每人限领">
                {selectedTemplate.userLimit}
              </Descriptions.Item>
            </Descriptions>
          )}

          <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
            <Input
              placeholder="搜索用户名/手机号/邮箱"
              style={{ width: 280 }}
              value={userSearchKeyword}
              onChange={(e) => setUserSearchKeyword(e.target.value)}
              allowClear
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchUsers(1, 50)}
            >
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setUserSearchKeyword('');
                setTimeout(() => fetchUsers(1, 50), 0);
              }}
            >
              重置
            </Button>
          </div>

          <Spin spinning={userLoading}>
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="userId"
              size="middle"
              rowSelection={userRowSelection}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => fetchUsers(page, pageSize),
              }}
            />
          </Spin>
        </Form>
      </Modal>
    </div>
  );
};

export default UserCouponList;
