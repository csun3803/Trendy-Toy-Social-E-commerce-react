import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, App, Modal, Descriptions, Image } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getOrdersBySeller, getOrderDetail, deleteOrder, type Order, type OrderDetail } from '../../services/order';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
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
        
        const response = await getOrdersBySeller(sellerId);
        
        if (response.code === 200 || response.message === 'success') {
          setOrders(response.data || []);
        } else {
          message.error('获取订单列表失败: ' + (response.message || '未知错误'));
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

  const handleDeleteOrder = (orderId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该订单吗？删除后将同时删除订单详情，此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteOrder(orderId);
          
          if (response.code === 200 || response.message === 'success') {
            message.success('订单删除成功');
            fetchOrders();
          } else {
            message.error('删除订单失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          console.error('删除订单失败', error);
          message.error('删除订单失败');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'PROCESSING':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '待处理';
      case 'PROCESSING':
        return '处理中';
      case 'COMPLETED':
        return '已完成';
      case 'CANCELLED':
        return '已取消';
      default:
        return '未知';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return '未支付';
      case 'PAID':
        return '已支付';
      case 'REFUNDED':
        return '已退款';
      default:
        return '未知';
    }
  };

  const getShippingStatusText = (status: string) => {
    switch (status) {
      case 'UNSHIPPED':
        return '未发货';
      case 'SHIPPED':
        return '已发货';
      case 'DELIVERED':
        return '已送达';
      default:
        return '未知';
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: '订单金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => <Tag>{getPaymentStatusText(status)}</Tag>,
    },
    {
      title: '发货状态',
      dataIndex: 'shippingStatus',
      key: 'shippingStatus',
      render: (status: string) => <Tag>{getShippingStatusText(status)}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.orderId)}>
            查看
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteOrder(record.orderId)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="订单列表">
        <Table columns={columns} dataSource={orders} loading={loading} rowKey="orderId" />
      </Card>

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
                ¥{selectedOrder.actualAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getStatusColor(selectedOrder.orderStatus)}>
                  {getStatusText(selectedOrder.orderStatus)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="支付状态">
                <Tag>{getPaymentStatusText(selectedOrder.paymentStatus)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发货状态">
                <Tag>{getShippingStatusText(selectedOrder.shippingStatus)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedOrder.createTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="用户备注" span={2}>
                {selectedOrder.userRemark || '无'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h3>订单商品</h3>
              <Table
                columns={[
                  {
                    title: '商品ID',
                    dataIndex: 'productId',
                    key: 'productId',
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
    </div>
  );
};

export default Orders;
