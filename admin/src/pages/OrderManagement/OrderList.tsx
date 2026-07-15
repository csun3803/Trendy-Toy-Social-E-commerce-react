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
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getAdminOrders,
  type AdminOrderView,
  type AdminOrder,
  type AdminOrderItem,
} from '../../services/orderManagement';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 订单状态
const ORDER_STATUSES = [
  { value: 'ALL', label: '全部状态' },
  { value: 'PENDING_PAYMENT', label: '待付款' },
  { value: 'PENDING_SHIPMENT', label: '待发货' },
  { value: 'SHIPPED', label: '待收货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

const getOrderStatusText = (status: string) => {
  const item = ORDER_STATUSES.find((s) => s.value === status);
  return item ? item.label : '未知';
};

const getOrderStatusColor = (status: string) => {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'orange',
    PENDING_SHIPMENT: 'blue',
    SHIPPED: 'cyan',
    COMPLETED: 'green',
    CANCELLED: 'red',
  };
  return map[status] || 'default';
};

const OrderList: React.FC = () => {
  const [data, setData] = useState<AdminOrderView[]>([]);
  const [filtered, setFiltered] = useState<AdminOrderView[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [searchSellerId, setSearchSellerId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedView, setSelectedView] = useState<AdminOrderView | null>(null);

  const { message } = App.useApp();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (searchUserId) params.userId = searchUserId;
      if (searchSellerId) params.sellerId = searchSellerId;
      if (searchOrderNo) params.orderNo = searchOrderNo;
      if (dateRange[0]) params.startTime = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
      if (dateRange[1]) params.endTime = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');

      const res = await getAdminOrders(params);
      if (res.code === 200 || res.message === 'success') {
        const list = res.data || [];
        setData(list);
        setFiltered(list);
      } else {
        message.error('获取订单列表失败: ' + (res.message || '未知错误'));
      }
    } catch (err) {
      console.error(err);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 本地过滤（兜底）
  useEffect(() => {
    let result = [...data];
    if (searchOrderNo) {
      result = result.filter((v) =>
        v.order.orderNo?.toLowerCase().includes(searchOrderNo.toLowerCase()),
      );
    }
    if (searchUserId) {
      result = result.filter((v) =>
        v.order.userId?.toLowerCase().includes(searchUserId.toLowerCase()),
      );
    }
    if (searchSellerId) {
      result = result.filter((v) => v.shopId?.toLowerCase().includes(searchSellerId.toLowerCase()));
    }
    if (statusFilter && statusFilter !== 'ALL') {
      result = result.filter((v) => v.order.orderStatus === statusFilter);
    }
    if (dateRange[0] && dateRange[1]) {
      result = result.filter((v) => {
        const t = dayjs(v.order.createTime);
        return t.isAfter(dateRange[0]!.startOf('day')) && t.isBefore(dateRange[1]!.endOf('day'));
      });
    }
    setFiltered(result);
  }, [data, searchOrderNo, searchUserId, searchSellerId, statusFilter, dateRange]);

  // 导出CSV
  const handleExport = () => {
    if (filtered.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    const headers = ['订单号', '用户ID', '店铺', '实付金额', '运费', '订单状态', '商品数', '创建时间'];
    const rows = filtered.map((v) => [
      v.order.orderNo,
      v.order.userId,
      v.shopName || '-',
      v.order.actualAmount,
      v.order.shippingFee,
      getOrderStatusText(v.order.orderStatus),
      v.order.totalQuantity,
      v.order.createTime,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    // BOM 解决 Excel 中文乱码
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${filtered.length} 条订单`);
  };

  const columns: ColumnsType<AdminOrderView> = [
    {
      title: '订单号',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
      width: 200,
    },
    {
      title: '商品信息',
      key: 'product',
      width: 280,
      render: (_: any, record: AdminOrderView) => {
        const item = record.orderItems?.[0];
        const extra = (record.orderItems?.length || 0) - 1;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: '#f5f5f5',
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item?.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#999', fontSize: 12 }}>暂无</span>
              )}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 180,
                }}
              >
                {item?.productName || '商品名称'}
              </div>
              {extra > 0 && (
                <div style={{ fontSize: 12, color: '#999' }}>等{extra + 1}件商品</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '实付金额',
      dataIndex: ['order', 'actualAmount'],
      key: 'actualAmount',
      width: 110,
      render: (amount: number) => <span>¥{Number(amount || 0).toFixed(2)}</span>,
    },
    {
      title: '运费',
      dataIndex: ['order', 'shippingFee'],
      key: 'shippingFee',
      width: 90,
      render: (fee: number) => <span>¥{Number(fee || 0).toFixed(2)}</span>,
    },
    {
      title: '买家',
      key: 'buyer',
      width: 140,
      render: (_: any, record: AdminOrderView) => (
        <div>
          <div>{record.userInfo?.username || record.order.userId.slice(0, 8)}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.order.userId.slice(0, 12)}</div>
        </div>
      ),
    },
    {
      title: '店铺',
      key: 'shop',
      width: 140,
      render: (_: any, record: AdminOrderView) => record.shopName || '-',
    },
    {
      title: '订单状态',
      dataIndex: ['order', 'orderStatus'],
      key: 'orderStatus',
      width: 110,
      render: (status: string) => (
        <Tag color={getOrderStatusColor(status)}>{getOrderStatusText(status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: ['order', 'createTime'],
      key: 'createTime',
      width: 170,
      render: (t: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_: any, record: AdminOrderView) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedView(record);
            setDetailVisible(true);
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索订单号"
              prefix={<SearchOutlined />}
              value={searchOrderNo}
              onChange={(e) => setSearchOrderNo(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="用户ID"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="商家/店铺ID"
              value={searchSellerId}
              onChange={(e) => setSearchSellerId(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={ORDER_STATUSES}
            />
          </Col>
          <Col span={4}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as any)}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" onClick={fetchData} loading={loading}>
              刷新
            </Button>
          </Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出CSV
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey={(record) => record.order.orderId}
          scroll={{ x: 'max-content' }}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条订单`,
          }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={820}
      >
        {selectedView && (
          <div>
            <Descriptions title="基本信息" bordered column={2} size="small">
              <Descriptions.Item label="订单号">{selectedView.order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getOrderStatusColor(selectedView.order.orderStatus)}>
                  {getOrderStatusText(selectedView.order.orderStatus)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="买家">
                {selectedView.userInfo?.username || selectedView.order.userId}
              </Descriptions.Item>
              <Descriptions.Item label="店铺">
                {selectedView.shopName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                ¥{Number(selectedView.order.actualAmount || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="运费">
                ¥{Number(selectedView.order.shippingFee || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="退款金额">
                <span style={{ color: '#ff4d4f' }}>
                  ¥{Number(selectedView.order.refundAmount || 0).toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="商品总数">
                {selectedView.order.totalQuantity}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedView.order.createTime
                  ? dayjs(selectedView.order.createTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="支付时间">
                {selectedView.order.paymentTime
                  ? dayjs(selectedView.order.paymentTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {selectedView.order.paymentMethod || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="售后状态">
                {selectedView.order.afterSalesStatus || 'NONE'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>订单商品</Title>
              <Table
                columns={[
                  {
                    title: '商品信息',
                    key: 'product',
                    render: (_: any, item: AdminOrderItem) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: '#f5f5f5',
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ color: '#999', fontSize: 12, display: 'inline-block', paddingTop: 12 }}>无</span>
                          )}
                        </div>
                        <div>
                          <div>{item.productName || '商品'}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {item.productSpec || '标准'}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: '单价',
                    dataIndex: 'unitPrice',
                    render: (p: number) => `¥${Number(p || 0).toFixed(2)}`,
                  },
                  { title: '数量', dataIndex: 'quantity' },
                  {
                    title: '小计',
                    dataIndex: 'actualSubtotal',
                    render: (s: number) => `¥${Number(s || 0).toFixed(2)}`,
                  },
                  {
                    title: '售后状态',
                    dataIndex: 'itemAfterSalesStatus',
                    render: (s: string) =>
                      s && s !== 'NONE' ? <Tag color="orange">{s}</Tag> : <Tag>无</Tag>,
                  },
                ]}
                dataSource={selectedView.orderItems || []}
                rowKey="orderItemId"
                pagination={false}
                size="small"
              />
            </div>

            {(selectedView.order.logisticsCompany || selectedView.order.trackingNumber) && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>物流信息</Title>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="物流公司">
                    {selectedView.order.logisticsCompany || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="物流单号">
                    {selectedView.order.trackingNumber || '-'}
                  </Descriptions.Item>
                  {selectedView.order.shippedTime && (
                    <Descriptions.Item label="发货时间">
                      {dayjs(selectedView.order.shippedTime).format('YYYY-MM-DD HH:mm:ss')}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}

            <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
              <Text type="secondary">
                平台监管视角：仅查看，不支持发货、修改等操作。用于平台监管和GMV统计。
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;
