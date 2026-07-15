import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Table, List, Space, Tag, Image } from 'antd';
import { ShoppingOutlined, DollarOutlined, ShopOutlined, UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

const { Title, Text } = Typography;

interface DashboardData {
  todaySales: number;
  todayOrders: number;
  pendingShipment: number;
  afterSales: number;
  productCount: number;
  salesTrend: Array<{ date: string; sales: number; orders: number }>;
  hotProducts: Array<{ rank: number; name: string; image: string; sales: number; amount: number }>;
  tasks: Array<{ id: number; title: string; count: number; type: string }>;
}

const MerchantDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await request('/api/merchant/dashboard', { method: 'GET' });
      if (res && res.code === 200 && res.data) {
        const d = res.data;
        setData({
          todaySales: d.todaySales || 0,
          todayOrders: d.todayOrders || 0,
          pendingShipment: d.pendingShipment || 0,
          afterSales: d.afterSales || 0,
          productCount: d.productCount || 0,
          salesTrend: d.salesTrend || [],
          hotProducts: d.hotProducts || [],
          tasks: d.tasks || [],
        });
      } else {
        setFallbackData();
      }
    } catch (error) {
      console.error('获取仪表盘数据失败', error);
      setFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const setFallbackData = () => {
    // 兜底数据
    const now = new Date();
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - (6 - i));
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return {
        date: `${mm}-${dd}`,
        sales: Math.floor(Math.random() * 8000 + 2000),
        orders: Math.floor(Math.random() * 80 + 20),
      };
    });

    setData({
      todaySales: 8965.32,
      todayOrders: 56,
      pendingShipment: 12,
      afterSales: 3,
      productCount: 156,
      salesTrend: trendData,
      hotProducts: [
        { rank: 1, name: 'SKULLPANDA温度系列 - 放轻松', image: '', sales: 128, amount: 9984 },
        { rank: 2, name: 'Dimoo如果今天星期八-快乐洗澡', image: '', sales: 96, amount: 6624 },
        { rank: 3, name: 'MINISO疯狂动物城秋日庄园系列', image: '', sales: 78, amount: 5382 },
        { rank: 4, name: 'Labubu精灵艺术系列', image: '', sales: 65, amount: 4225 },
        { rank: 5, name: 'Molly我的小时候系列', image: '', sales: 52, amount: 3640 },
      ],
      tasks: [
        { id: 1, title: '待发货订单数', count: 12, type: 'warning' },
        { id: 2, title: '售后申请数', count: 3, type: 'info' },
        { id: 3, title: '库存不足商品数', count: 8, type: 'warning' },
      ],
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 热门商品列定义
  const hotProductColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => (
        <Tag color={rank <= 3 ? '#ff4d4f' : '#8c8c8c'} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {rank}
        </Tag>
      ),
    },
    {
      title: '商品',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: any) => (
        <Space>
          {record.image ? (
            <Image src={record.image} width={36} height={36} style={{ borderRadius: 4, objectFit: 'cover' }} preview={false} />
          ) : (
            <div style={{ width: 36, height: 36, backgroundColor: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>暂无</Text>
            </div>
          )}
          <Text ellipsis style={{ maxWidth: 160 }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 80,
    },
    {
      title: '销售额',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (amount: number) => <Text style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{amount?.toFixed(2) || '0.00'}</Text>,
    },
  ];

  // 渲染趋势图
  const renderTrendChart = () => {
    if (!data?.salesTrend || data.salesTrend.length === 0) {
      return <Text type="secondary">暂无数据</Text>;
    }

    const trendData = data.salesTrend;
    const maxSales = Math.max(...trendData.map((d) => d.sales), 1);
    const maxOrders = Math.max(...trendData.map((d) => d.orders), 1);
    const chartHeight = 200;

    return (
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', height: `${chartHeight + 30}px` }}>
          {/* Y轴 */}
          <div style={{ width: '60px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'right', paddingRight: '8px' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>¥{maxSales}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>¥{Math.round(maxSales / 2)}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>¥0</Text>
            </div>
            <div style={{ height: 8 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'right', paddingRight: '8px' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{maxOrders}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{Math.round(maxOrders / 2)}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>0</Text>
            </div>
          </div>

          {/* 图表区域 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 销售额图 */}
            <div style={{ height: `${chartHeight / 2}px`, position: 'relative', borderLeft: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8', paddingLeft: '8px' }}>
              <div style={{ borderBottom: '1px dashed #f0f0f0', width: '100%', position: 'absolute', top: '50%', left: 0 }} />
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="merchantSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1890ff" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1890ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {(() => {
                  const h = chartHeight / 2 - 10;
                  return (
                    <>
                      <path
                        d={`M 0 ${h - (trendData[0].sales / maxSales * h)} ${trendData.map((d, i) => `L ${(i + 0.5) * (100 / trendData.length)}% ${h - (d.sales / maxSales * h)}`).join(' ')} L 100% ${h} L 0 ${h} Z`}
                        fill="url(#merchantSalesGrad)"
                      />
                      <path
                        d={`M 0 ${h - (trendData[0].sales / maxSales * h)} ${trendData.map((d, i) => `L ${(i + 0.5) * (100 / trendData.length)}% ${h - (d.sales / maxSales * h)}`).join(' ')}`}
                        fill="none" stroke="#1890ff" strokeWidth="2"
                      />
                      {trendData.map((d, i) => (
                        <circle key={`s${i}`} cx={`${(i + 0.5) * (100 / trendData.length)}%`} cy={h - (d.sales / maxSales * h)} r="3" fill="#1890ff" />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* 订单量图 */}
            <div style={{ height: `${chartHeight / 2}px`, position: 'relative', borderLeft: '1px solid #e8e8e8', paddingLeft: '8px' }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="merchantOrdersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#52c41a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#52c41a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {(() => {
                  const h = chartHeight / 2 - 10;
                  return (
                    <>
                      <path
                        d={`M 0 ${h - (trendData[0].orders / maxOrders * h)} ${trendData.map((d, i) => `L ${(i + 0.5) * (100 / trendData.length)}% ${h - (d.orders / maxOrders * h)}`).join(' ')} L 100% ${h} L 0 ${h} Z`}
                        fill="url(#merchantOrdersGrad)"
                      />
                      <path
                        d={`M 0 ${h - (trendData[0].orders / maxOrders * h)} ${trendData.map((d, i) => `L ${(i + 0.5) * (100 / trendData.length)}% ${h - (d.orders / maxOrders * h)}`).join(' ')}`}
                        fill="none" stroke="#52c41a" strokeWidth="2"
                      />
                      {trendData.map((d, i) => (
                        <circle key={`o${i}`} cx={`${(i + 0.5) * (100 / trendData.length)}%`} cy={h - (d.orders / maxOrders * h)} r="3" fill="#52c41a" />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* X轴 */}
            <div style={{ height: 30, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginLeft: '8px' }}>
              {trendData.map((d, i) => (
                <Text type="secondary" key={i} style={{ fontSize: 11 }}>{d.date}</Text>
              ))}
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 24 }}>
          <Space>
            <div style={{ width: 12, height: 12, backgroundColor: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>销售额</Text>
          </Space>
          <Space>
            <div style={{ width: 12, height: 12, backgroundColor: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>订单量</Text>
          </Space>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page" style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>商家数据仪表盘</Title>

      <Spin spinning={loading}>
        {/* 1. 指标卡片区 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={5}>
            <Card>
              <Statistic title="今日销售量" value={data?.todayOrders || 0} prefix={<ShoppingOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={5}>
            <Card>
              <Statistic title="今日销售额" value={data?.todaySales || 0} precision={2} prefix={<DollarOutlined />} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={5}>
            <Card>
              <Statistic title="待发货数" value={data?.pendingShipment || 0} prefix={<ShopOutlined />} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={5}>
            <Card>
              <Statistic title="售后中数" value={data?.afterSales || 0} prefix={<UserOutlined />} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic title="商品总数" value={data?.productCount || 0} prefix={<ShoppingOutlined />} valueStyle={{ color: '#722ed1' }} />
            </Card>
          </Col>
        </Row>

        {/* 2. 待处理事项 + 热门商品TOP5 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="stretch">
          <Col xs={24} lg={12}>
            <Card title="待处理事项" style={{ height: '100%' }}>
              <List
                dataSource={data?.tasks || []}
                renderItem={(item) => (
                  <List.Item style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      avatar={<ExclamationCircleOutlined style={{ color: item.type === 'warning' ? '#ff4d4f' : '#1890ff', fontSize: 20 }} />}
                      title={
                        <Space>
                          <span>{item.title}</span>
                          <Tag color={item.type === 'warning' ? 'red' : item.type === 'success' ? 'green' : 'blue'}>
                            {item.count}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="热门商品TOP5" style={{ height: '100%' }}>
              <Table
                columns={hotProductColumns}
                dataSource={data?.hotProducts || []}
                pagination={false}
                size="middle"
                rowKey="rank"
              />
            </Card>
          </Col>
        </Row>

        {/* 3. 今日销售趋势 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="今日销售趋势">
              {renderTrendChart()}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default MerchantDashboard;
