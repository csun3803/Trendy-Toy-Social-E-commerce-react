import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  App,
  Modal,
  Descriptions,
  Input,
  DatePicker,
  Row,
  Col,
  Typography,
  Select,
  Tabs,
  Badge,
  Radio,
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getAdminAfterSales, getPlatformInterventionList, arbitrateAfterSale } from '../../services/orderManagement';
import type { AfterSale } from '../../services/order';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 售后状态
const AFTER_SALE_STATUSES = [
  { value: 'ALL', label: '全部状态' },
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已同意' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'PLATFORM_REVIEWING', label: '平台介入审核中' },
  { value: 'PLATFORM_RESOLVED', label: '平台已裁决' },
];

const AFTER_SALE_TYPES: Record<string, string> = {
  REFUND: '仅退款',
  RETURN: '退货退款',
};

const getAfterSaleStatusText = (status: string) => {
  const item = AFTER_SALE_STATUSES.find((s) => s.value === status);
  return item ? item.label : '未知';
};

const getAfterSaleStatusColor = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'orange',
    APPROVED: 'blue',
    REJECTED: 'red',
    COMPLETED: 'green',
    PLATFORM_REVIEWING: 'purple',
    PLATFORM_RESOLVED: 'magenta',
  };
  return map[status] || 'default';
};

const TAB_KEYS = {
  ALL: 'all',
  INTERVENTION: 'intervention',
};

const AfterSaleList: React.FC = () => {
  const [data, setData] = useState<AfterSale[]>([]);
  const [interventionList, setInterventionList] = useState<AfterSale[]>([]);
  const [filtered, setFiltered] = useState<AfterSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.ALL);

  const [searchUserId, setSearchUserId] = useState('');
  const [searchSellerId, setSearchSellerId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAfterSale, setSelectedAfterSale] = useState<AfterSale | null>(null);

  // 仲裁弹窗
  const [arbitrateVisible, setArbitrateVisible] = useState(false);
  const [arbitrateResult, setArbitrateResult] = useState<'USER' | 'SELLER'>('USER');
  const [arbitrateReason, setArbitrateReason] = useState('');
  const [arbitrateSubmitting, setArbitrateSubmitting] = useState(false);

  const { message } = App.useApp();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (searchUserId) params.userId = searchUserId;
      if (searchSellerId) params.sellerId = searchSellerId;
      if (dateRange[0]) params.startTime = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
      if (dateRange[1]) params.endTime = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');

      const res = await getAdminAfterSales(params);
      if (res.code === 200 || res.message === 'success') {
        setData(res.data || []);
      } else {
        message.error('获取售后列表失败: ' + (res.message || '未知错误'));
      }

      // 同步获取介入列表
      const intRes = await getPlatformInterventionList();
      if (intRes.code === 200 || intRes.message === 'success') {
        setInterventionList(intRes.data || []);
      }
    } catch (err) {
      console.error(err);
      message.error('获取售后列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 本地过滤
  useEffect(() => {
    let result = [...data];
    if (activeTab === TAB_KEYS.INTERVENTION) {
      result = result.filter((v) => v.afterSaleStatus === 'PLATFORM_REVIEWING');
    } else {
      if (statusFilter && statusFilter !== 'ALL') {
        result = result.filter((v) => v.afterSaleStatus === statusFilter);
      }
    }
    if (searchUserId) {
      result = result.filter((v) => v.userId?.toLowerCase().includes(searchUserId.toLowerCase()));
    }
    if (searchSellerId) {
      result = result.filter((v) =>
        v.sellerId?.toLowerCase().includes(searchSellerId.toLowerCase()),
      );
    }
    if (dateRange[0] && dateRange[1]) {
      result = result.filter((v) => {
        const t = dayjs(v.createTime);
        return t.isAfter(dateRange[0]!.startOf('day')) && t.isBefore(dateRange[1]!.endOf('day'));
      });
    }
    setFiltered(result);
  }, [data, activeTab, statusFilter, searchUserId, searchSellerId, dateRange]);

  // 查看详情
  const handleViewDetail = (afterSale: AfterSale) => {
    setSelectedAfterSale(afterSale);
    setDetailVisible(true);
  };

  // 打开仲裁弹窗
  const handleOpenArbitrate = (afterSale: AfterSale) => {
    setSelectedAfterSale(afterSale);
    setArbitrateResult('USER');
    setArbitrateReason('');
    setDetailVisible(false);
    setArbitrateVisible(true);
  };

  // 提交仲裁
  const handleArbitrateSubmit = async () => {
    if (!selectedAfterSale) return;
    if (!arbitrateReason.trim()) {
      message.warning('请填写裁决理由');
      return;
    }
    setArbitrateSubmitting(true);
    try {
      const res = await arbitrateAfterSale(
        selectedAfterSale.afterSaleId,
        arbitrateResult,
        arbitrateReason.trim(),
      );
      if (res.code === 200 || res.message === 'success') {
        message.success('仲裁结果已提交');
        setArbitrateVisible(false);
        fetchData();
      } else {
        message.error('仲裁失败: ' + (res.message || '未知错误'));
      }
    } catch (err) {
      console.error(err);
      message.error('仲裁失败，请稍后重试');
    } finally {
      setArbitrateSubmitting(false);
    }
  };

  const columns: ColumnsType<AfterSale> = [
    {
      title: '售后单号',
      dataIndex: 'afterSaleId',
      key: 'afterSaleId',
      width: 160,
      render: (id: string) => <Text copyable>{id.slice(0, 12)}...</Text>,
    },
    {
      title: '关联订单',
      key: 'orderNo',
      width: 160,
      render: (_: any, record: AfterSale) => record.orderNo || record.orderId.slice(0, 12),
    },
    {
      title: '商品',
      key: 'product',
      width: 240,
      render: (_: any, record: AfterSale) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: '#f5f5f5',
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {record.productImage ? (
              <img
                src={record.productImage}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#999', fontSize: 11 }}>无</span>
            )}
          </div>
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 180,
            }}
          >
            {record.productName || '商品'}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'afterSaleType',
      key: 'afterSaleType',
      width: 100,
      render: (t: string) => <Tag color="blue">{AFTER_SALE_TYPES[t] || t}</Tag>,
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 110,
      render: (a: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{Number(a || 0).toFixed(2)}</span>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 120,
      render: (_: any, record: AfterSale) => (
        <div>
          <div>{record.username || record.userId.slice(0, 8)}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.userId.slice(0, 12)}</div>
        </div>
      ),
    },
    {
      title: '店铺',
      key: 'shop',
      width: 120,
      render: (_: any, record: AfterSale) => record.shopName || record.sellerId.slice(0, 8),
    },
    {
      title: '状态',
      dataIndex: 'afterSaleStatus',
      key: 'afterSaleStatus',
      width: 120,
      render: (s: string) => (
        <Tag color={getAfterSaleStatusColor(s)}>{getAfterSaleStatusText(s)}</Tag>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (t: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: AfterSale) => (
        <Space size="small" direction="vertical" style={{ alignItems: 'flex-start' }}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          {record.afterSaleStatus === 'PLATFORM_REVIEWING' && (
            <Button
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              style={{ color: '#FF6B00' }}
              onClick={() => handleOpenArbitrate(record)}
            >
              查看并处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: TAB_KEYS.ALL,
              label: '全部售后',
            },
            {
              key: TAB_KEYS.INTERVENTION,
              label: (
                <span>
                  <ThunderboltOutlined style={{ color: '#FF6B00' }} />
                  <span style={{ marginLeft: 4 }}>平台介入申请</span>
                  {interventionList.length > 0 && (
                    <Badge
                      count={interventionList.length}
                      style={{ marginLeft: 8, backgroundColor: '#FF6B00' }}
                    />
                  )}
                </span>
              ),
            },
          ]}
        />

        <Row gutter={16} style={{ marginBottom: 16, marginTop: 8 }}>
          <Col span={6}>
            <Input
              placeholder="用户ID"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="商家ID"
              value={searchSellerId}
              onChange={(e) => setSearchSellerId(e.target.value)}
              allowClear
            />
          </Col>
          {activeTab === TAB_KEYS.ALL && (
            <Col span={5}>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
                options={AFTER_SALE_STATUSES}
              />
            </Col>
          )}
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as any)}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={2}>
            <Button type="primary" onClick={fetchData} loading={loading}>
              刷新
            </Button>
          </Col>
        </Row>

        {activeTab === TAB_KEYS.INTERVENTION && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 6,
            }}
          >
            <Text strong style={{ color: '#FF6B00' }}>
              <ThunderboltOutlined /> 平台介入仲裁
            </Text>
            <Paragraph style={{ marginTop: 8, marginBottom: 0, color: '#666', fontSize: 13 }}>
              以下售后单由用户在商家拒绝后申请平台介入。请查看双方证据后做出最终裁决：
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  <Text strong>支持用户</Text>
                  ：平台判定商家应承担售后责任，将执行退款/退货流程
                </li>
                <li>
                  <Text strong>支持商家</Text>
                  ：平台判定维持商家拒绝决定，售后单关闭
                </li>
              </ul>
              仲裁完成后，商家和用户均无法再操作此售后单。
            </Paragraph>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="afterSaleId"
          scroll={{ x: 'max-content' }}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条售后单`,
          }}
        />
      </Card>

      {/* 售后详情弹窗 */}
      <Modal
        title="售后详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={820}
        footer={
          selectedAfterSale?.afterSaleStatus === 'PLATFORM_REVIEWING'
            ? [
                <Button key="close" onClick={() => setDetailVisible(false)}>
                  关闭
                </Button>,
                <Button
                  key="arbitrate"
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  style={{ backgroundColor: '#FF6B00' }}
                  onClick={() => handleOpenArbitrate(selectedAfterSale)}
                >
                  进行仲裁
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setDetailVisible(false)}>
                  关闭
                </Button>,
              ]
        }
      >
        {selectedAfterSale && (
          <div>
            <Descriptions title="基本信息" bordered column={2} size="small">
              <Descriptions.Item label="售后单号">
                <Text copyable>{selectedAfterSale.afterSaleId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">{selectedAfterSale.orderNo}</Descriptions.Item>
              <Descriptions.Item label="售后类型">
                <Tag color="blue">{AFTER_SALE_TYPES[selectedAfterSale.afterSaleType]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="售后状态">
                <Tag color={getAfterSaleStatusColor(selectedAfterSale.afterSaleStatus)}>
                  {getAfterSaleStatusText(selectedAfterSale.afterSaleStatus)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="退款金额">
                <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                  ¥{Number(selectedAfterSale.refundAmount || 0).toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {selectedAfterSale.createTime
                  ? dayjs(selectedAfterSale.createTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户" span={2}>
                {selectedAfterSale.username || selectedAfterSale.userId}（ID:{' '}
                {selectedAfterSale.userId}）
              </Descriptions.Item>
              <Descriptions.Item label="店铺" span={2}>
                {selectedAfterSale.shopName || selectedAfterSale.sellerId}
              </Descriptions.Item>
              <Descriptions.Item label="申请原因" span={2}>
                {selectedAfterSale.reason}
              </Descriptions.Item>
              {selectedAfterSale.description && (
                <Descriptions.Item label="问题描述" span={2}>
                  {selectedAfterSale.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 商品信息 */}
            <div style={{ marginTop: 16 }}>
              <Title level={5}>商品信息</Title>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: '#f9f9f9',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedAfterSale.productImage ? (
                    <img
                      src={selectedAfterSale.productImage}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: '#999', fontSize: 12 }}>无</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{selectedAfterSale.productName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {selectedAfterSale.productSpec || '标准'}
                  </div>
                </div>
              </div>
            </div>

            {/* 商家拒绝信息（用户证据视角） */}
            {selectedAfterSale.rejectReason && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  borderRadius: 6,
                }}
              >
                <Title level={5} style={{ color: '#ff4d4f', marginBottom: 8 }}>
                  商家拒绝原因
                </Title>
                <div>{selectedAfterSale.rejectReason}</div>
                {selectedAfterSale.auditTime && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    审核时间：{dayjs(selectedAfterSale.auditTime).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                )}
              </div>
            )}

            {/* 平台介入信息（用户证据视角） */}
            {selectedAfterSale.platformInterventionReason && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: 6,
                }}
              >
                <Title level={5} style={{ color: '#1890ff', marginBottom: 8 }}>
                  用户申请平台介入原因
                </Title>
                <div>{selectedAfterSale.platformInterventionReason}</div>
                {selectedAfterSale.platformInterventionTime && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    申请时间：{dayjs(selectedAfterSale.platformInterventionTime).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                )}
              </div>
            )}

            {/* 退货地址和物流 */}
            {selectedAfterSale.returnAddress && (
              <Descriptions title="退货地址" bordered column={1} size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="退货地址">{selectedAfterSale.returnAddress}</Descriptions.Item>
              </Descriptions>
            )}
            {selectedAfterSale.returnTrackingNumber && (
              <Descriptions title="退货物流" bordered column={2} size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="物流公司">
                  {selectedAfterSale.returnLogisticsCompany || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="运单号">
                  {selectedAfterSale.returnTrackingNumber}
                </Descriptions.Item>
              </Descriptions>
            )}

            {/* 平台裁决结果 */}
            {selectedAfterSale.platformArbitrationResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6,
                }}
              >
                <Title level={5} style={{ color: '#52c41a', marginBottom: 8 }}>
                  平台裁决结果
                </Title>
                <Tag color={selectedAfterSale.platformArbitrationResult === 'USER' ? 'green' : 'red'}>
                  {selectedAfterSale.platformArbitrationResult === 'USER'
                    ? '支持用户'
                    : '支持商家'}
                </Tag>
                {selectedAfterSale.platformArbitrationReason && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">裁决理由：</Text>
                    <div>{selectedAfterSale.platformArbitrationReason}</div>
                  </div>
                )}
                {selectedAfterSale.platformArbitrationTime && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    裁决时间：{dayjs(selectedAfterSale.platformArbitrationTime).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 仲裁弹窗 */}
      <Modal
        title={
          <span>
            <ThunderboltOutlined style={{ color: '#FF6B00' }} /> 平台仲裁
          </span>
        }
        open={arbitrateVisible}
        onCancel={() => !arbitrateSubmitting && setArbitrateVisible(false)}
        confirmLoading={arbitrateSubmitting}
        onOk={handleArbitrateSubmit}
        okText="提交裁决"
        cancelText="取消"
        width={620}
      >
        {selectedAfterSale && (
          <div>
            <div
              style={{
                padding: 12,
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <Text strong>售后单：{selectedAfterSale.afterSaleId.slice(0, 16)}...</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">用户申请原因：</Text>
                <div style={{ marginTop: 4 }}>{selectedAfterSale.platformInterventionReason}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">商家拒绝原因：</Text>
                <div style={{ marginTop: 4 }}>{selectedAfterSale.rejectReason || '无'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>请做出最终裁决：</Text>
              <Radio.Group
                value={arbitrateResult}
                onChange={(e) => setArbitrateResult(e.target.value)}
                style={{ display: 'block', marginTop: 12 }}
              >
                <Space direction="vertical">
                  <Radio value="USER">
                    <Space>
                      <CheckOutlined style={{ color: '#52c41a' }} />
                      <Text strong>支持用户</Text>
                      <Text type="secondary">
                        （执行{AFTER_SALE_TYPES[selectedAfterSale.afterSaleType]}流程，退款给用户）
                      </Text>
                    </Space>
                  </Radio>
                  <Radio value="SELLER">
                    <Space>
                      <CloseOutlined style={{ color: '#ff4d4f' }} />
                      <Text strong>支持商家</Text>
                      <Text type="secondary">（维持商家拒绝决定，售后单关闭）</Text>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>

            <div>
              <Text strong>裁决理由 *</Text>
              <TextArea
                style={{ marginTop: 8 }}
                value={arbitrateReason}
                onChange={(e) => setArbitrateReason(e.target.value)}
                placeholder="请详细填写裁决理由，将作为最终结论记录"
                rows={4}
                maxLength={500}
                showCount
              />
            </div>

            <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
              提示：仲裁完成后，商家和用户都将无法再操作此售后单。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AfterSaleList;
