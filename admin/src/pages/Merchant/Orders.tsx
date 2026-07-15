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
  Select, 
  DatePicker, 
  Form, 
  Timeline,
  Row,
  Col,
  Typography,
} from 'antd';

import { 
  EyeOutlined, 
  SendOutlined, 
  TruckOutlined, 
  SearchOutlined,
  PrintOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getOrderDetail, shipOrder, getLogisticsInfo, type Order, type OrderDetail, type ShipRequest, type LogisticsInfo } from '../../services/order';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 后端订单状态定义
const ORDER_STATUSES = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',      // 待付款
  PENDING_SHIPMENT: 'PENDING_SHIPMENT',    // 待发货
  SHIPPED: 'SHIPPED',                      // 待收货（已发货）
  COMPLETED: 'COMPLETED',                  // 已完成
  CANCELLED: 'CANCELLED',                  // 已取消
  CLOSED: 'CLOSED',                        // 交易关闭
};

// 订单状态标签页
const TAB_KEYS = {
  ALL: 'all',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING_SHIPMENT: 'PENDING_SHIPMENT',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  CLOSED: 'CLOSED',
};

// 物流状态
const LOGISTICS_STATUS = [
  { status: 'signed', text: '已签收', color: 'green' },
  { status: 'delivering', text: '派件中', color: 'blue' },
  { status: 'in_transit', text: '运输中', color: 'orange' },
  { status: 'collected', text: '已揽收', color: 'cyan' },
];

// 物流公司选项
const LOGISTICS_COMPANY_OPTIONS = [
  { value: 'SF', label: '顺丰速运' },
  { value: 'ZTO', label: '中通快递' },
  { value: 'YTO', label: '圆通速递' },
  { value: 'YD', label: '韵达快递' },
  { value: 'EMS', label: 'EMS' },
];

interface ExtendedOrder extends Order {
  key?: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.ALL);
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 发货弹窗
  const [shipVisible, setShipVisible] = useState(false);
  const [shipOrderId, setShipOrderId] = useState<string>('');
  const [shipForm] = Form.useForm();
  
  // 物流弹窗
  const [logisticsVisible, setLogisticsVisible] = useState(false);
  const [logisticsData, setLogisticsData] = useState<any[]>([]);
  const [currentLogisticsStatus, setCurrentLogisticsStatus] = useState('in_transit');

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
        
        const response = await fetch(`http://localhost:8080/api/orders/seller/${sellerId}/with-items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        
        if (result.code === 200 || result.message === 'success') {
          const ordersList = result.data || [];
          // 只保留正常订单（无售后或售后已拒绝的订单）
          const normalOrders = ordersList.filter((o: Order) => 
            !o.afterSalesStatus || o.afterSalesStatus === 'NONE' || o.afterSalesStatus === 'REJECTED'
          );
          setOrders(normalOrders);
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

  // 状态切换时重新获取数据
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  // 过滤订单
  useEffect(() => {
    let result = [...orders];

    // 按状态标签页筛选
    if (activeTab !== TAB_KEYS.ALL) {
      result = result.filter(o => o.orderStatus === activeTab);
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
  }, [orders, searchOrderNo, dateRange, activeTab]);

  // 获取订单状态文本
  const getOrderStatusText = (order: Order) => {
    switch (order.orderStatus) {
      case ORDER_STATUSES.PENDING_PAYMENT: return '待付款';
      case ORDER_STATUSES.PENDING_SHIPMENT: return '待发货';
      case ORDER_STATUSES.SHIPPED: return '待收货';
      case ORDER_STATUSES.COMPLETED: return '已完成';
      case ORDER_STATUSES.CANCELLED: return '已取消';
      case ORDER_STATUSES.CLOSED: return '交易关闭';
      default: return '未知';
    }
  };

  // 获取订单状态颜色
  const getOrderStatusColor = (order: Order) => {
    switch (order.orderStatus) {
      case ORDER_STATUSES.PENDING_PAYMENT: return 'orange';
      case ORDER_STATUSES.PENDING_SHIPMENT: return 'blue';
      case ORDER_STATUSES.SHIPPED: return 'cyan';
      case ORDER_STATUSES.COMPLETED: return 'green';
      case ORDER_STATUSES.CANCELLED: return 'red';
      case ORDER_STATUSES.CLOSED: return 'default';
      default: return 'default';
    }
  };

  // 获取订单状态标签
  const getOrderStatusTag = (order: Order) => {
    const text = getOrderStatusText(order);
    const color = getOrderStatusColor(order);
    return <Tag color={color}>{text}</Tag>;
  };



  // 获取操作按钮
  const getActionButtons = (order: Order) => {
    const buttons = [];

    buttons.push(
      <Button type="link" size="small" icon={<EyeOutlined />} key="view" onClick={() => handleViewDetail(order.orderId)}>
        详情
      </Button>
    );

    switch (order.orderStatus) {
      case ORDER_STATUSES.PENDING_SHIPMENT:
        buttons.push(
          <Button type="primary" size="small" icon={<SendOutlined />} key="ship" onClick={() => handleShip(order.orderId)}>
            发货
          </Button>
        );
        break;
      case ORDER_STATUSES.SHIPPED:
        buttons.push(
          <Button type="link" size="small" icon={<TruckOutlined />} key="logistics" onClick={() => handleViewLogistics(order)}>
            物流
          </Button>
        );
        break;
    }

    return <Space size="small">{buttons}</Space>;
  };

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

  // 发货
  const handleShip = (orderId: string) => {
    setShipOrderId(orderId);
    shipForm.resetFields();
    setShipVisible(true);
  };

  // 确认发货
  const confirmShip = async () => {
    try {
      const values = await shipForm.validateFields();
      const response = await shipOrder(shipOrderId, values);
      if (response.code === 200) {
        message.success('发货成功！');
        setShipVisible(false);
        fetchOrders();
      } else {
        message.error(response.message || '发货失败');
      }
    } catch (error) {
      console.error('发货失败', error);
      message.error('发货失败');
    }
  };

  // 查看物流
  const handleViewLogistics = async (order: Order) => {
    try {
      // 先尝试从后端获取真实物流信息
      const response = await getLogisticsInfo(order.orderId);
      if (response.code === 200 && response.data) {
        setLogisticsData(response.data.tracks);
      } else {
        // 如果没有真实数据，使用模拟数据
        const mockData = generateMockLogistics(order.logisticsCompany || 'SF', order.trackingNumber || '');
        setLogisticsData(mockData);
      }
    } catch (error) {
      // 如果接口调用失败，也使用模拟数据
      const mockData = generateMockLogistics(order.logisticsCompany || 'SF', order.trackingNumber || '');
      setLogisticsData(mockData);
    }
    setLogisticsVisible(true);
  };

  // 生成模拟物流数据
  const generateMockLogistics = (company: string, trackingNo: string) => {
    const companyName = LOGISTICS_COMPANY_OPTIONS.find(c => c.value === company)?.label || company;
    const today = dayjs();
    
    return [
      {
        time: today.format('YYYY-MM-DD HH:mm:ss'),
        status: 'signed',
        description: `【深圳市】已签收，感谢使用${companyName}`,
      },
      {
        time: today.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        status: 'delivering',
        description: '【深圳市】派件中，快递员：李师傅 138****1234',
      },
      {
        time: today.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        status: 'in_transit',
        description: '【广州市】已发出，下一站深圳',
      },
      {
        time: today.subtract(1, 'day').subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        status: 'collected',
        description: '【广州市】商家已发货，等待揽收',
      },
    ];
  };

  // 切换物流状态
  const switchLogisticsStatus = (status: string) => {
    setCurrentLogisticsStatus(status);
    message.info(`物流状态已切换为: ${LOGISTICS_STATUS.find(s => s.status === status)?.text}`);
  };

  // 批量发货
  const handleBatchShip = () => {
    Modal.info({
      title: '批量发货',
      content: '批量发货功能开发中...',
    });
  };

  // 批量打印
  const handleBatchPrint = () => {
    Modal.info({
      title: '批量打印',
      content: '批量打印功能开发中...',
    });
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
      width: 320,
      render: (_: any, record: any) => {
        const item = record.items?.[0];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item?.productImage ? (
                <img 
                  src={item.productImage} 
                  alt={item.productName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#999', fontSize: 12 }}>暂无图</span>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{item?.productName || '商品名称'}</div>
              <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{item?.productSpec ? `规格: ${item.productSpec}` : '规格: 标准'}</div>
              <div style={{ fontSize: 12, color: '#999' }}>x{item?.quantity || 1}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '实付金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 130,
      render: (amount: number) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{amount.toFixed(2)}</span>,
    },
    {
      title: '买家',
      dataIndex: 'userId',
      key: 'userId',
      width: 140,
      render: (id: string) => `用户${id.slice(0, 6)}`,
    },
    {
      title: '下单时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 200,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '订单状态',
      key: 'status',
      width: 130,
      render: (_: any, record: Order) => getOrderStatusTag(record),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Order) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.orderId)}>
            详情
          </Button>
          {record.orderStatus === ORDER_STATUSES.PENDING_SHIPMENT && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleShip(record.orderId)}>
              发货
            </Button>
          )}
          {record.orderStatus === ORDER_STATUSES.SHIPPED && (
            <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleViewLogistics(record)}>
              物流
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 表格行选择
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

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
            { key: TAB_KEYS.PENDING_PAYMENT, label: '待付款' },
            { key: TAB_KEYS.PENDING_SHIPMENT, label: '待发货' },
            { key: TAB_KEYS.SHIPPED, label: '待收货' },
            { key: TAB_KEYS.COMPLETED, label: '已完成' },
            { key: TAB_KEYS.CANCELLED, label: '已取消' },
            { key: TAB_KEYS.CLOSED, label: '交易关闭' },
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
          <Col span={8} style={{ textAlign: 'right' }}>
            {selectedRowKeys.length > 0 && (
              <Space>
                <Button type="default" icon={<SendOutlined />} onClick={handleBatchShip}>
                  批量发货
                </Button>
                <Button type="default" icon={<PrintOutlined />} onClick={handleBatchPrint}>
                  批量打印
                </Button>
              </Space>
            )}
          </Col>
        </Row>

        {/* 订单列表 */}
        <Table
          rowSelection={rowSelection}
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
            showTotal: (total) => `共 ${total} 条订单`,
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
              <Descriptions.Item label="总优惠">
                ¥{selectedOrder.totalDiscount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="实付金额">
                <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                  ¥{selectedOrder.actualAmount.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                {getOrderStatusTag(selectedOrder)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedOrder.createTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="用户备注" span={2}>
                {selectedOrder.userRemark || '无'}
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
                            <img 
                              src={item.productImage} 
                              alt={item.productName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
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

          </div>
        ) : null}
      </Modal>

      {/* 发货弹窗 */}
      <Modal
        title="订单发货"
        open={shipVisible}
        onOk={confirmShip}
        onCancel={() => setShipVisible(false)}
        okText="确认发货"
        cancelText="取消"
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item
            label="物流公司"
            name="logisticsCompany"
            rules={[{ required: true, message: '请选择物流公司' }]}
          >
            <Select placeholder="请选择物流公司">
              {LOGISTICS_COMPANY_OPTIONS.map(company => (
                <Option key={company.value} value={company.value}>
                  {company.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="运单号"
            name="trackingNumber"
            rules={[
              { required: true, message: '请输入运单号' },
              { 
                pattern: /^[A-Za-z0-9]{10,15}$/, 
                message: '运单号需为10-15位数字或字母组合' 
              }
            ]}
          >
            <Input placeholder="请输入运单号" maxLength={15} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 物流轨迹弹窗 */}
      <Modal
        title="物流信息"
        open={logisticsVisible}
        onCancel={() => setLogisticsVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 20 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>物流状态：</span>
            {LOGISTICS_STATUS.map(status => (
              <Tag 
                key={status.status}
                color={status.status === currentLogisticsStatus ? status.color : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => switchLogisticsStatus(status.status)}
              >
                {status.text}
              </Tag>
            ))}
          </Space>
        </div>
        <Timeline
          mode="left"
          items={logisticsData.map(item => ({
            color: item.status === currentLogisticsStatus ? 'green' : 'gray',
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>{item.description}</div>
                <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
              </div>
            ),
          }))}
        />
      </Modal>

    </div>
  );
};

export default Orders;
