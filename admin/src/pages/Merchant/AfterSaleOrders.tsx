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
  Tabs, 
  Input, 
  DatePicker, 
  Row,
  Col,
  Typography,
  Image,
  Timeline,
  Form,
} from 'antd';

const { TextArea } = Input;
import { 
  EyeOutlined, 
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getOrderDetail, approveAfterSale, rejectAfterSale, confirmReturnReceived, fillReturnAddress, getAfterSalesByOrder, type Order, type OrderDetail, type AfterSale } from '../../services/order';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 售后状态
const AFTER_SALE_STATUSES = {
  PENDING: 'PENDING',        // 待审核
  APPROVED: 'APPROVED',      // 已同意
  REJECTED: 'REJECTED',      // 已拒绝
  COMPLETED: 'COMPLETED',    // 已完成
  PLATFORM_REVIEWING: 'PLATFORM_REVIEWING',  // 平台介入审核中
  PLATFORM_RESOLVED: 'PLATFORM_RESOLVED',    // 平台已裁决
};

// 售后类型
const AFTER_SALE_TYPES = {
  REFUND: 'REFUND',          // 仅退款
  RETURN: 'RETURN',          // 退货退款
};

// 售后标签页
const TAB_KEYS = {
  ALL: 'all',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

interface ExtendedOrder extends Order {
  key?: string;
}

const AfterSaleOrders: React.FC = () => {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.ALL);
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 售后弹窗相关
  const [afterSaleVisible, setAfterSaleVisible] = useState(false);
  const [selectedAfterSale, setSelectedAfterSale] = useState<AfterSale | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 退货地址弹窗相关
  const [returnAddressVisible, setReturnAddressVisible] = useState(false);
  const [returnAddress, setReturnAddress] = useState('');
  const [returnAddressSubmitting, setReturnAddressSubmitting] = useState(false);

  // 当前商家ID
  const [currentSellerId, setCurrentSellerId] = useState<string | undefined>(undefined);

  // 售后信息映射
  const [afterSalesMap, setAfterSalesMap] = useState<Map<string, AfterSale[]>>(new Map());

  const { message } = App.useApp();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return;
      }

      const merchantResponse = await fetch('http://localhost:8080/api/merchant/info/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const merchantData = await merchantResponse.json();
      
      if (merchantData.code === 200 || merchantData.message === 'success') {
        const sellerId = merchantData.data.shopId;
        setCurrentSellerId(sellerId);
        
        const response = await fetch(`http://localhost:8080/api/orders/seller/${sellerId}/with-items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        
        if (result.code === 200 || result.message === 'success') {
          const allOrders = result.data || [];
          // 只保留有售后记录的订单
          const afterSaleOrders = allOrders.filter((o: Order) => 
            o.afterSalesStatus === 'PROCESSING' || o.afterSalesStatus === 'COMPLETED' || o.afterSalesStatus === 'REJECTED'
          );
          setOrders(afterSaleOrders);
          
          // 获取每个订单的售后信息
          const newAfterSalesMap = new Map<string, AfterSale[]>();
          for (const order of afterSaleOrders) {
            try {
              const afterSaleResponse = await getAfterSalesByOrder(order.orderId);
              if (afterSaleResponse.code === 200 || afterSaleResponse.message === 'success') {
                newAfterSalesMap.set(order.orderId, afterSaleResponse.data || []);
              }
            } catch (error) {
              console.error(`获取订单${order.orderId}售后信息失败`, error);
            }
          }
          setAfterSalesMap(newAfterSalesMap);
        } else {
          message.error('获取订单列表失败: ' + (result.message || '未知错误'));
        }
      } else {
        message.error('获取商家信息失败: ' + (merchantData.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取订单列表失败', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 获取售后状态文本
  const getAfterSaleStatusText = (status: string) => {
    switch (status) {
      case AFTER_SALE_STATUSES.PENDING: return '待审核';
      case AFTER_SALE_STATUSES.APPROVED: return '已同意';
      case AFTER_SALE_STATUSES.REJECTED: return '已拒绝';
      case AFTER_SALE_STATUSES.COMPLETED: return '已完成';
      case AFTER_SALE_STATUSES.PLATFORM_REVIEWING: return '平台介入审核中';
      case AFTER_SALE_STATUSES.PLATFORM_RESOLVED: return '平台已裁决';
      default: return '未知';
    }
  };

  // 获取售后状态标签颜色
  const getAfterSaleStatusColor = (status: string) => {
    switch (status) {
      case AFTER_SALE_STATUSES.PENDING: return 'orange';
      case AFTER_SALE_STATUSES.APPROVED: return 'blue';
      case AFTER_SALE_STATUSES.REJECTED: return 'red';
      case AFTER_SALE_STATUSES.COMPLETED: return 'green';
      case AFTER_SALE_STATUSES.PLATFORM_REVIEWING: return 'purple';
      case AFTER_SALE_STATUSES.PLATFORM_RESOLVED: return 'magenta';
      default: return 'default';
    }
  };

  // 获取售后类型文本
  const getAfterSaleTypeText = (type: string) => {
    switch (type) {
      case AFTER_SALE_TYPES.REFUND: return '仅退款';
      case AFTER_SALE_TYPES.RETURN: return '退货退款';
      default: return '未知';
    }
  };

  // 获取订单售后状态标签
  const getAfterSaleStatusTag = (order: Order) => {
    const afterSales = afterSalesMap.get(order.orderId);
    if (!afterSales || afterSales.length === 0) {
      return <Tag>未知</Tag>;
    }
    const latest = afterSales[0];
    
    if (order.afterSalesStatus === 'PROCESSING') {
      if (latest.afterSaleStatus === 'PENDING') {
        return <Tag color="orange">待审核</Tag>;
      } else if (latest.afterSaleStatus === 'APPROVED') {
        if (latest.afterSaleType === 'RETURN' && !latest.returnTrackingNumber) {
          return <Tag color="blue">待填写退货物流</Tag>;
        } else if (latest.afterSaleType === 'RETURN' && latest.returnTrackingNumber) {
          return <Tag color="blue">待确认退货收货</Tag>;
        }
        return <Tag color="blue">已同意</Tag>;
      }
      return <Tag color="orange">售后中</Tag>;
    }
    if (order.afterSalesStatus === 'COMPLETED') {
      if (latest.afterSaleType === 'REFUND') {
        return <Tag color="green">已退款</Tag>;
      } else if (latest.afterSaleType === 'RETURN') {
        return <Tag color="green">已退货退款</Tag>;
      }
      return <Tag color="green">已完成</Tag>;
    }
    if (order.afterSalesStatus === 'REJECTED') {
      return <Tag color="red">售后已拒绝</Tag>;
    }
    return <Tag>未知</Tag>;
  };

  // 获取售后类型标签
  const getAfterSaleTypeTag = (order: Order) => {
    const afterSales = afterSalesMap.get(order.orderId);
    if (!afterSales || afterSales.length === 0) return <Tag>-</Tag>;
    const latest = afterSales[0];
    return latest.afterSaleType === 'REFUND' 
      ? <Tag color="blue">仅退款</Tag> 
      : <Tag color="purple">退货退款</Tag>;
  };

  // 获取退款金额
  const getRefundAmount = (order: Order) => {
    const afterSales = afterSalesMap.get(order.orderId);
    if (!afterSales || afterSales.length === 0) return '-';
    return afterSales[0].refundAmount;
  };

  // 过滤订单
  useEffect(() => {
    let result = [...orders];

    // 按售后状态标签页筛选
    if (activeTab !== TAB_KEYS.ALL) {
      result = result.filter(o => {
        const afterSales = afterSalesMap.get(o.orderId);
        if (!afterSales || afterSales.length === 0) return false;
        const latest = afterSales[0];
        
        if (activeTab === TAB_KEYS.PENDING) {
          return latest.afterSaleStatus === 'PENDING';
        }
        if (activeTab === TAB_KEYS.APPROVED) {
          return latest.afterSaleStatus === 'APPROVED';
        }
        if (activeTab === TAB_KEYS.COMPLETED) {
          return latest.afterSaleStatus === 'COMPLETED';
        }
        if (activeTab === TAB_KEYS.REJECTED) {
          return latest.afterSaleStatus === 'REJECTED';
        }
        return true;
      });
    }

    // 按订单号搜索
    if (searchOrderNo) {
      result = result.filter(o => 
        o.orderNo.toLowerCase().includes(searchOrderNo.toLowerCase())
      );
    }

    // 按时间范围筛选
    if (dateRange[0] && dateRange[1]) {
      result = result.filter(o => {
        const orderDate = dayjs(o.createTime);
        return orderDate.isAfter(dateRange[0]!.startOf('day')) && 
               orderDate.isBefore(dateRange[1]!.endOf('day'));
      });
    }

    setFilteredOrders(result);
  }, [orders, searchOrderNo, dateRange, activeTab, afterSalesMap]);

  // 查看详情
  const handleViewDetail = async (orderId: string) => {
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const response = await getOrderDetail(orderId);
      if (response.code === 200 || response.message === 'success') {
        setSelectedOrder(response.data);
      } else {
        message.error('获取订单详情失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取订单详情失败', error);
      message.error('获取订单详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 查看售后详情
  const handleViewAfterSale = (afterSale: AfterSale) => {
    setSelectedAfterSale(afterSale);
    setRejectReason('');
    setAfterSaleVisible(true);
  };

  // 同意售后
  const handleApproveAfterSale = async () => {
    if (!selectedAfterSale) return;
    try {
      const response = await approveAfterSale(selectedAfterSale.afterSaleId);
      if (response.code === 200) {
        message.success('售后申请已同意');
        setAfterSaleVisible(false);
        fetchOrders();
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('同意售后失败', error);
      message.error('操作失败，请稍后重试');
    }
  };

  // 拒绝售后
  const handleRejectAfterSale = async () => {
    if (!selectedAfterSale || !rejectReason) {
      message.warning('请填写拒绝原因');
      return;
    }
    try {
      const response = await rejectAfterSale(selectedAfterSale.afterSaleId, rejectReason);
      if (response.code === 200) {
        message.success('售后申请已拒绝');
        setAfterSaleVisible(false);
        fetchOrders();
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('拒绝售后失败', error);
      message.error('操作失败，请稍后重试');
    }
  };

  // 确认退货收货
  const handleConfirmReturnReceived = async () => {
    if (!selectedAfterSale) return;
    try {
      const response = await confirmReturnReceived(selectedAfterSale.afterSaleId);
      if (response.code === 200) {
        message.success('退货已确认收货，退款完成');
        setAfterSaleVisible(false);
        fetchOrders();
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('确认退货收货失败', error);
      message.error('操作失败，请稍后重试');
    }
  };

  // 打开填写退货地址弹窗
  const handleOpenReturnAddress = (afterSale: AfterSale) => {
    setSelectedAfterSale(afterSale);
    setReturnAddress(afterSale.returnAddress || '');
    setReturnAddressVisible(true);
  };

  // 提交退货地址
  const handleSubmitReturnAddress = async () => {
    if (!selectedAfterSale) return;
    if (!returnAddress.trim()) {
      message.warning('请填写退货地址');
      return;
    }
    setReturnAddressSubmitting(true);
    try {
      const response = await fillReturnAddress(
        selectedAfterSale.afterSaleId,
        returnAddress.trim(),
        currentSellerId
      );
      if (response.code === 200) {
        message.success('退货地址已填写');
        setReturnAddressVisible(false);
        setAfterSaleVisible(false);
        fetchOrders();
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('填写退货地址失败', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setReturnAddressSubmitting(false);
    }
  };

  // 获取订单状态文本（用于详情弹窗）
  const getOrderStatusText = (order: Order) => {
    switch (order.orderStatus) {
      case 'PENDING_PAYMENT': return '待付款';
      case 'PENDING_SHIPMENT': return '待发货';
      case 'SHIPPED': return '待收货';
      case 'COMPLETED': return '已完成';
      case 'CANCELLED': return '已取消';
      case 'CLOSED': return '交易关闭';
      default: return '未知';
    }
  };

  const getOrderStatusTag = (order: Order) => {
    const text = getOrderStatusText(order);
    const colorMap: Record<string, string> = {
      'PENDING_PAYMENT': 'orange',
      'PENDING_SHIPMENT': 'blue',
      'SHIPPED': 'cyan',
      'COMPLETED': 'green',
      'CANCELLED': 'red',
      'CLOSED': 'default',
    };
    return <Tag color={colorMap[order.orderStatus] || 'default'}>{text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<ExtendedOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
    },
    {
      title: '商品信息',
      key: 'product',
      width: 280,
      render: (_: any, record: any) => {
        const item = record.items?.[0];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item?.productImage ? (
                <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#999', fontSize: 12 }}>暂无图</span>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{item?.productName || '商品名称'}</div>
              <div style={{ fontSize: 12, color: '#999' }}>x{item?.quantity || 1}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '售后类型',
      key: 'afterSaleType',
      width: 110,
      render: (_: any, record: Order) => getAfterSaleTypeTag(record),
    },
    {
      title: '退款金额',
      key: 'refundAmount',
      width: 120,
      render: (_: any, record: Order) => {
        const amount = getRefundAmount(record);
        return amount !== '-' ? <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{Number(amount).toFixed(2)}</span> : '-';
      },
    },
    {
      title: '实付金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 110,
      render: (amount: number) => <span>¥{amount.toFixed(2)}</span>,
    },
    {
      title: '买家',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (id: string) => `用户${id.slice(0, 6)}`,
    },
    {
      title: '申请时间',
      dataIndex: 'afterSalesTime',
      key: 'afterSalesTime',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '售后状态',
      key: 'afterSaleStatus',
      width: 140,
      render: (_: any, record: Order) => getAfterSaleStatusTag(record),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: Order) => {
        const afterSales = afterSalesMap.get(record.orderId);
        const latest = afterSales?.[0];
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.orderId)}>
              详情
            </Button>
            {latest && (
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleViewAfterSale(latest)}>
                售后
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // 时间范围快捷选项
  const dateQuickOptions = [
    { label: '今日', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: '本周', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
    { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card>
        {/* 状态筛选标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: TAB_KEYS.ALL, label: '全部' },
            { key: TAB_KEYS.PENDING, label: '待审核' },
            { key: TAB_KEYS.APPROVED, label: '已同意' },
            { key: TAB_KEYS.COMPLETED, label: '已完成' },
            { key: TAB_KEYS.REJECTED, label: '已拒绝' },
          ]}
        />

        {/* 搜索和筛选栏 */}
        <Row gutter={16} style={{ marginBottom: 8, marginTop: 8 }}>
          <Col span={8}>
            <Input
              placeholder="搜索订单号"
              prefix={<SearchOutlined />}
              value={searchOrderNo}
              onChange={(e) => setSearchOrderNo(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              presets={dateQuickOptions}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
        </Row>

        {/* 售后订单列表 */}
        <Table
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          rowKey="orderId"
          scroll={{ x: 'max-content' }}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条售后订单`,
          }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : selectedOrder ? (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="用户ID">{selectedOrder.userId}</Descriptions.Item>
              <Descriptions.Item label="订单金额">
                ¥{selectedOrder.actualAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="运费">
                ¥{selectedOrder.shippingFee.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                {getOrderStatusTag(selectedOrder)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedOrder.createTime).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>订单商品</Title>
              <Table
                columns={[
                  {
                    title: '商品信息',
                    key: 'product',
                    render: (_: any, item: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 60, height: 60, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item?.productImage ? (
                            <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: '#999', fontSize: 12 }}>暂无图</span>
                          )}
                        </div>
                        <div>
                          <div>{item?.productName || '商品名称'}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{item?.productSpec ? `规格: ${item.productSpec}` : '规格: 标准'}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: '单价',
                    dataIndex: 'unitPrice',
                    key: 'unitPrice',
                    render: (price: number) => `¥${price.toFixed(2)}`,
                  },
                  {
                    title: '数量',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: '小计',
                    dataIndex: 'actualSubtotal',
                    key: 'actualSubtotal',
                    render: (subtotal: number) => `¥${subtotal.toFixed(2)}`,
                  },
                ]}
                dataSource={selectedOrder.orderItems || []}
                rowKey="orderItemId"
                pagination={false}
              />
            </div>

            {/* 售后信息 */}
            {selectedOrder && afterSalesMap.get(selectedOrder.orderId) && afterSalesMap.get(selectedOrder.orderId)!.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={4}>售后信息</Title>
                {afterSalesMap.get(selectedOrder.orderId)!.map((afterSale, index) => (
                  <div key={afterSale.afterSaleId} style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16, marginBottom: index < afterSalesMap.get(selectedOrder.orderId)!.length - 1 ? 16 : 0 }}>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="售后类型">
                        <Tag color="blue">{getAfterSaleTypeText(afterSale.afterSaleType)}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="售后状态">
                        <Tag color={
                          afterSale.afterSaleStatus === 'PENDING' ? 'orange' :
                          afterSale.afterSaleStatus === 'APPROVED' ? 'blue' :
                          afterSale.afterSaleStatus === 'REJECTED' ? 'red' : 'green'
                        }>
                          {getAfterSaleStatusText(afterSale.afterSaleStatus)}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="退款金额">
                        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                          ¥{afterSale.refundAmount.toFixed(2)}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="申请时间">
                        {new Date(afterSale.createTime).toLocaleString()}
                      </Descriptions.Item>
                      {afterSale.reason && (
                        <Descriptions.Item label="申请原因" span={2}>
                          {afterSale.reason}
                        </Descriptions.Item>
                      )}
                      {afterSale.description && (
                        <Descriptions.Item label="详细描述" span={2}>
                          {afterSale.description}
                        </Descriptions.Item>
                      )}
                      {afterSale.returnLogisticsCompany && (
                        <Descriptions.Item label="退货物流公司">
                          {afterSale.returnLogisticsCompany}
                        </Descriptions.Item>
                      )}
                      {afterSale.returnTrackingNumber && (
                        <Descriptions.Item label="退货物流单号">
                          {afterSale.returnTrackingNumber}
                        </Descriptions.Item>
                      )}
                      {afterSale.rejectReason && (
                        <Descriptions.Item label="拒绝原因" span={2}>
                          {afterSale.rejectReason}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                    {/* 售后操作按钮 */}
                    {(afterSale.afterSaleStatus === 'PENDING' || (afterSale.afterSaleStatus === 'APPROVED' && afterSale.afterSaleType === 'RETURN' && afterSale.returnTrackingNumber)) && (
                      <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {afterSale.afterSaleStatus === 'PENDING' && (
                          <>
                            <Button 
                              type="primary" 
                              icon={<CheckOutlined />}
                              onClick={() => {
                                setSelectedAfterSale(afterSale);
                                handleApproveAfterSale();
                              }}
                            >
                              同意
                            </Button>
                            <Button 
                              danger 
                              icon={<CloseOutlined />}
                              onClick={() => {
                                setSelectedAfterSale(afterSale);
                                Modal.confirm({
                                  title: '拒绝售后申请',
                                  content: (
                                    <div>
                                      <p>请输入拒绝原因：</p>
                                      <TextArea 
                                        style={{ marginTop: 8 }}
                                        placeholder="请输入拒绝原因"
                                        rows={3}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                      />
                                    </div>
                                  ),
                                  okText: '确认拒绝',
                                  cancelText: '取消',
                                  onOk: () => handleRejectAfterSale(),
                                });
                              }}
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                        {afterSale.afterSaleStatus === 'APPROVED' && afterSale.afterSaleType === 'RETURN' && afterSale.returnTrackingNumber && (
                          <Button 
                            type="primary" 
                            icon={<CheckOutlined />}
                            onClick={() => {
                              setSelectedAfterSale(afterSale);
                              handleConfirmReturnReceived();
                            }}
                          >
                            确认退货收货
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* 售后详情弹窗 */}
      <Modal
        title="售后详情"
        open={afterSaleVisible}
        onCancel={() => setAfterSaleVisible(false)}
        width={700}
        footer={[
          selectedAfterSale?.afterSaleStatus === AFTER_SALE_STATUSES.PENDING && (
            <>
              <Button key="reject" danger onClick={handleRejectAfterSale}>
                拒绝
              </Button>
              <Button key="approve" type="primary" onClick={handleApproveAfterSale}>
                同意
              </Button>
            </>
          ),
          selectedAfterSale?.afterSaleStatus === AFTER_SALE_STATUSES.APPROVED &&
          selectedAfterSale?.afterSaleType === AFTER_SALE_TYPES.RETURN &&
          !selectedAfterSale?.returnAddress && (
            <Button key="fillAddress" type="primary" onClick={() => handleOpenReturnAddress(selectedAfterSale)}>
              填写退货地址
            </Button>
          ),
          selectedAfterSale?.afterSaleStatus === AFTER_SALE_STATUSES.APPROVED &&
          selectedAfterSale?.afterSaleType === AFTER_SALE_TYPES.RETURN &&
          selectedAfterSale?.returnTrackingNumber && (
            <Button key="confirm" type="primary" onClick={handleConfirmReturnReceived}>
              确认收货
            </Button>
          ),
          <Button key="close" onClick={() => setAfterSaleVisible(false)}>
            关闭
          </Button>,
        ].filter(Boolean)}
      >
        {selectedAfterSale && (
          <div>
            <Descriptions title="售后信息" bordered column={2}>
              <Descriptions.Item label="售后类型">
                <Tag color="blue">{getAfterSaleTypeText(selectedAfterSale.afterSaleType)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="售后状态">
                <Tag color={getAfterSaleStatusColor(selectedAfterSale.afterSaleStatus)}>
                  {getAfterSaleStatusText(selectedAfterSale.afterSaleStatus)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="退款金额">
                <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                  ¥{selectedAfterSale.refundAmount.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {new Date(selectedAfterSale.createTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="申请原因" span={2}>
                {selectedAfterSale.reason}
              </Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>
                {selectedAfterSale.description || '无'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>商品信息</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                <div style={{ width: 80, height: 80, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedAfterSale.productImage ? (
                    <img src={selectedAfterSale.productImage} alt={selectedAfterSale.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#999', fontSize: 12 }}>暂无图</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{selectedAfterSale.productName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {selectedAfterSale.productSpec ? `规格: ${selectedAfterSale.productSpec}` : '规格: 标准'}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    店铺: {selectedAfterSale.shopName || '未知'}
                  </div>
                </div>
              </div>
            </div>

            {selectedAfterSale.afterSaleType === AFTER_SALE_TYPES.RETURN && selectedAfterSale.returnAddress && (
              <div style={{ marginTop: 24 }}>
                <Title level={4}>退货地址</Title>
                <Descriptions column={1}>
                  <Descriptions.Item label="退货地址">
                    {selectedAfterSale.returnAddress}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {selectedAfterSale.afterSaleType === AFTER_SALE_TYPES.RETURN && selectedAfterSale.returnTrackingNumber && (
              <div style={{ marginTop: 24 }}>
                <Title level={4}>退货物流</Title>
                <Descriptions column={2}>
                  <Descriptions.Item label="物流公司">
                    {selectedAfterSale.returnLogisticsCompany || '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="运单号">
                    {selectedAfterSale.returnTrackingNumber}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {selectedAfterSale.afterSaleStatus === AFTER_SALE_STATUSES.REJECTED && (
              <div style={{ marginTop: 24, padding: 16, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#ff4d4f', marginBottom: 8 }}>拒绝原因</Title>
                <div>{selectedAfterSale.rejectReason}</div>
              </div>
            )}

            {/* 平台介入信息 */}
            {(selectedAfterSale.afterSaleStatus === AFTER_SALE_STATUSES.PLATFORM_REVIEWING
              || selectedAfterSale.afterSaleStatus === AFTER_SALE_STATUSES.PLATFORM_RESOLVED) && (
              <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', marginBottom: 8 }}>
                  {selectedAfterSale.afterSaleStatus === AFTER_SALE_STATUSES.PLATFORM_REVIEWING
                    ? '平台介入审核中' : '平台已裁决'}
                </Title>
                {selectedAfterSale.platformInterventionReason && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">用户申请介入原因：</Text>
                    <div>{selectedAfterSale.platformInterventionReason}</div>
                  </div>
                )}
                {selectedAfterSale.platformInterventionTime && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">申请时间：</Text>
                    {new Date(selectedAfterSale.platformInterventionTime).toLocaleString()}
                  </div>
                )}
                {selectedAfterSale.platformArbitrationResult && (
                  <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 4 }}>
                    <Tag color={selectedAfterSale.platformArbitrationResult === 'USER' ? 'green' : 'red'}>
                      裁决结果：{selectedAfterSale.platformArbitrationResult === 'USER' ? '支持用户' : '支持商家'}
                    </Tag>
                    {selectedAfterSale.platformArbitrationReason && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">裁决理由：</Text>
                        <div>{selectedAfterSale.platformArbitrationReason}</div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
                  平台介入后，商家和用户均无法再操作此售后单
                </div>
              </div>
            )}

            {selectedAfterSale.afterSaleStatus === AFTER_SALE_STATUSES.PENDING && (
              <div style={{ marginTop: 24 }}>
                <Title level={4}>审核操作</Title>
                <Form.Item label="拒绝原因">
                  <TextArea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请填写拒绝原因（拒绝时必填）"
                    rows={3}
                  />
                </Form.Item>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 填写退货地址弹窗 */}
      <Modal
        title="填写退货地址"
        open={returnAddressVisible}
        onCancel={() => !returnAddressSubmitting && setReturnAddressVisible(false)}
        confirmLoading={returnAddressSubmitting}
        onOk={handleSubmitReturnAddress}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 8, color: '#999', fontSize: 12 }}>
          用户退货时将看到此地址，请填写完整的收货信息（收件人、电话、详细地址等）
        </div>
        <TextArea
          value={returnAddress}
          onChange={(e) => setReturnAddress(e.target.value)}
          placeholder="例如：张三 13800138000 北京市朝阳区xx街道xx号"
          rows={4}
          maxLength={300}
          showCount
        />
      </Modal>
    </div>
  );
};

export default AfterSaleOrders;
