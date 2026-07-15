import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Radio, Table, List, Tag, message, Image, Space } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { request } from '@umijs/max';

const { Title, Text } = Typography;

// 定义后端返回的数据类型
interface DashboardData {
  totalUsers: number;
  todayNewUsers: number;
  totalRevenue: number;
  todayRevenue: number;
  totalMerchants: number;
  salesTrend: Array<{ date: string; sales: number }>;
  orderTrend: Array<{ date: string; orders: number }>;
  merchantMetrics: Array<{ name: string; value: any; type?: string }>;
  userContentMetrics: Array<{ name: string; value: any; type?: string }>;
  pendingTasks: Array<{ id: number; title: string; count: number; type?: string }>;
  hotProducts?: Array<{ rank: number; productName: string; productImage: string; salesCount: number; totalSales: number }>;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [data, setData] = useState<DashboardData | null>(null);

  // Mock数据作为兜底
  const getMockData = (days: number): DashboardData => {
    const trendData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
        sales: 8000 + Math.floor(Math.random() * 5000),
        orders: 180 + Math.floor(Math.random() * 150),
      };
    });

    return {
      totalUsers: 12345,
      todayNewUsers: 128,
      totalRevenue: 456789,
      todayRevenue: 12345,
      totalMerchants: 89,
      salesTrend: trendData.map(d => ({ date: d.date, sales: d.sales })),
      orderTrend: trendData.map(d => ({ date: d.date, orders: d.orders })),
      merchantMetrics: [
        { name: '入驻商家总数', value: 89 },
        { name: '待审核商家', value: 5, type: 'warning' },
        { name: '今日新增商家', value: 2 },
        { name: '商家商品总数', value: 2345 },
        { name: '平均商家销售额', value: '¥5,678' },
      ],
      userContentMetrics: [
        { name: '社交活动发布总数', value: 567 },
        { name: '待审核活动数', value: 12, type: 'warning' },
        { name: '展示柜创建总数', value: 2345 },
        { name: '用户互动总数', value: 8921 },
      ],
      pendingTasks: [
        { id: 1, title: '商家入驻申请待审核', count: 5, type: 'warning' },
        { id: 2, title: '社交活动待审核', count: 12, type: 'warning' },
        { id: 3, title: '纠纷/投诉待处理', count: 3, type: 'warning' },
        { id: 4, title: '商品举报待审核', count: 8, type: 'warning' },
      ],

      hotProducts: [
        { rank: 1, productName: 'SKULLPANDA温度系列-放轻松', productImage: '', salesCount: 156, totalSales: 12480 },
        { rank: 2, productName: 'Dimoo如果今天星期八-快乐洗澡', productImage: '', salesCount: 132, totalSales: 9108 },
        { rank: 3, productName: 'HACIPUPU庆典系列-许愿星', productImage: '', salesCount: 98, totalSales: 6860 },
        { rank: 4, productName: 'Molly幻想流浪记-自由女神', productImage: '', salesCount: 86, totalSales: 6020 },
        { rank: 5, productName: 'Labubu精灵艺术-蒙娜丽莎', productImage: '', salesCount: 75, totalSales: 5250 },
      ],
    };
  };

  const fetchData = async (days: number) => {
    console.log('🔄 开始获取仪表盘数据，参数：', { days });
    setLoading(true);
    try {
      const res = await request<{
        success?: boolean;
        data?: DashboardData;
        code?: number;
        msg?: string;
      }>('/api/admin/dashboard', {
        method: 'GET',
        params: { days },
      });

      console.log('📡 后端返回的原始响应：', res);

      if (res?.success || res?.code === 200) {
        console.log('✅ 获取数据成功！');
        console.log('📊 数据详情：', res.data);
        console.log('👥 总用户数：', res.data?.totalUsers);
        console.log('➕ 今日新增用户：', res.data?.todayNewUsers);
        console.log('💰 总交易额：', res.data?.totalRevenue);
        console.log('💸 今日交易额：', res.data?.todayRevenue);
        console.log('🏪 入驻商家数：', res.data?.totalMerchants);
        console.log('🔥 热门商品：', res.data?.hotProducts);
        setData(res.data);
      } else {
        console.error('❌ 响应状态错误：', res);
        throw new Error(res?.msg || '获取数据失败');
      }
    } catch (error) {
      console.error('❌ 获取仪表盘数据失败，使用Mock数据', error);
      const mockData = getMockData(days);
      console.log('📦 使用的Mock数据：', mockData);
      setData(mockData);
      message.info('使用本地Mock数据');
    } finally {
      setLoading(false);
      console.log('📋 当前data状态：', data);
    }
  };

  useEffect(() => {
    fetchData(timeRange === '7d' ? 7 : 30);
  }, [timeRange]);

  const trendData = data ? (timeRange === '7d' ? data.salesTrend : data.salesTrend) : [];
  const orderTrendData = data ? (timeRange === '7d' ? data.orderTrend : data.orderTrend) : [];

  const mergedTrendData = trendData.map((item, index) => ({
    ...item,
    orders: orderTrendData[index]?.orders || 0,
  }));

  const maxRevenue = mergedTrendData.length > 0 ? Math.max(...mergedTrendData.map(d => d.sales)) : 0;
  const maxOrders = mergedTrendData.length > 0 ? Math.max(...mergedTrendData.map(d => d.orders)) : 0;

  const handleTaskClick = (title: string) => {
    alert(`点击了: ${title}`);
    console.log(`点击了: ${title}`);
  };

  const hotProductColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center',
      render: (rank: number) => {
        let color = '#999';
        if (rank === 1) color = '#ffd700';
        else if (rank === 2) color = '#c0c0c0';
        else if (rank === 3) color = '#cd7f32';
        return <Text strong style={{ color, fontSize: '18px' }}>{rank}</Text>;
      },
    },
    {
      title: '商品',
      dataIndex: 'productName',
      key: 'productName',
      render: (name: string, record: any) => (
        <Space>
          {record.productImage ? (
            <Image src={record.productImage} alt={name} width={36} height={36} style={{ borderRadius: '4px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 36, height: 36, backgroundColor: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>暂无图</Text>
            </div>
          )}
          <Text ellipsis style={{ maxWidth: '200px' }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: '销量',
      dataIndex: 'salesCount',
      key: 'salesCount',
      width: 100,
      align: 'center',
    },
    {
      title: '销售额',
      dataIndex: 'totalSales',
      key: 'totalSales',
      width: 120,
      align: 'center',
      render: (val: number) => <Text style={{ color: '#52c41a' }}>¥{val?.toFixed(2) || '0.00'}</Text>,
    },
  ];

  return (
    <div className="dashboard-page" style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: '24px' }}>平台仪表盘</Title>
      
      <Spin spinning={loading}>
        {/* 1. 指标卡片区 */}
        <Row 
          gutter={[16, 16]} 
          style={{ marginBottom: '24px' }} 
          align="stretch"
          wrap={false}
        >
          <Col flex="1.2" style={{ minWidth: 0 }}>
            <Card style={{ height: '100%' }}>
              <Statistic
                title="总用户数"
                value={data?.totalUsers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff', whiteSpace: 'nowrap' }}
              />
            </Card>
          </Col>
          <Col flex="1.2" style={{ minWidth: 0 }}>
            <Card style={{ height: '100%' }}>
              <Statistic
                title="今日新增用户"
                value={data?.todayNewUsers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a', whiteSpace: 'nowrap' }}
                valueRender={(val) => <span>+{val}</span>}
              />
            </Card>
          </Col>
          <Col flex="2" style={{ minWidth: 0 }}>
            <Card style={{ height: '100%' }}>
              <Statistic
                title="总交易额"
                value={data?.totalRevenue || 0}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1', whiteSpace: 'nowrap' }}
                valueRender={(val) => <span>¥{val}</span>}
              />
            </Card>
          </Col>
          <Col flex="2" style={{ minWidth: 0 }}>
            <Card style={{ height: '100%' }}>
              <Statistic
                title="今日交易额"
                value={data?.todayRevenue || 0}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1', whiteSpace: 'nowrap' }}
                valueRender={(val) => <span>¥{val}</span>}
              />
            </Card>
          </Col>
          <Col flex="1.2" style={{ minWidth: 0 }}>
            <Card style={{ height: '100%' }}>
              <Statistic
                title="入驻商家数"
                value={data?.totalMerchants || 0}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#faad14', whiteSpace: 'nowrap' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 2. 待审核事项（左半） | 热门商品TOP5（右半） */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} align="stretch">
          <Col xs={24} lg={12}>
            <Card title="待审核事项" style={{ height: '100%' }}>
              <List
                dataSource={data?.pendingTasks || []}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleTaskClick(item.title)}
                  >
                    <List.Item.Meta
                      avatar={<ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />}
                      title={
                        <Space>
                          <span>⚠️ {item.title}</span>
                          <Tag color="red">{item.count}</Tag>
                        </Space>
                      }
                      description="点击处理"
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

        {/* 3. 近日交易数据（全宽） */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24}>
            <Card
              title={`近${timeRange === '7d' ? '7' : '30'}天交易数据`}
              extra={
                <Radio.Group
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="small"
                >
                  <Radio.Button value="7d">近7天</Radio.Button>
                  <Radio.Button value="30d">近30天</Radio.Button>
                </Radio.Group>
              }
            >
              <div style={{ display: 'flex', height: '280px' }}>
                {/* Y轴 */}
                <div style={{ width: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'right', paddingRight: '10px' }}>
                  <div style={{ height: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>¥{maxRevenue}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>¥{Math.floor(maxRevenue / 2)}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>¥0</Text>
                  </div>
                  <div style={{ height: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: '10px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{maxOrders}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{Math.floor(maxOrders / 2)}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>0</Text>
                  </div>
                </div>

                {/* 图表区域 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8', paddingLeft: '10px', position: 'relative' }}>
                    {/* 背景线 */}
                    <div style={{ borderBottom: '1px dashed #e8e8e8', width: '100%', position: 'absolute', top: '25%', left: 0 }}></div>
                    <div style={{ borderBottom: '1px dashed #e8e8e8', width: '100%', position: 'absolute', top: '50%', left: 0 }}></div>
                    <div style={{ borderBottom: '1px dashed #e8e8e8', width: '100%', position: 'absolute', top: '75%', left: 0 }}></div>

                    {/* SVG */}
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                      {/* 柱状图（订单量） */}
                      {mergedTrendData.map((d, i) => {
                        const x = (i + 0.5) * (100 / mergedTrendData.length);
                        const height = maxOrders > 0 ? (d.orders / maxOrders) * 45 : 0;
                        return (
                          <rect
                            key={`order-${i}`}
                            x={`calc(${x}% - 12px)`}
                            y={`calc(50% + 10px + ${45 - height}%)`}
                            width="24"
                            height={`${height}%`}
                            fill="#52c41a"
                            fillOpacity="0.6"
                          />
                        );
                      })}

                      {/* 折线图（销售额） */}
                      <defs>
                        <linearGradient id="adminColorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1890ff" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#1890ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      {mergedTrendData.length > 0 && maxRevenue > 0 && (
                        <>
                          <path
                            d={`M 0 ${50 - (mergedTrendData[0].sales / maxRevenue) * 50}% ${
                              mergedTrendData.map((d, i) => 
                                `L ${(i + 0.5) * (100 / mergedTrendData.length)}% ${50 - (d.sales / maxRevenue) * 50}%`
                              ).join(' ')
                            } L 100% 50% L 0 50% Z`}
                            fill="url(#adminColorSales)"
                          />
                          <path
                            d={`M 0 ${50 - (mergedTrendData[0].sales / maxRevenue) * 50}% ${
                              mergedTrendData.map((d, i) => 
                                `L ${(i + 0.5) * (100 / mergedTrendData.length)}% ${50 - (d.sales / maxRevenue) * 50}%`
                              ).join(' ')
                            }`}
                            fill="none"
                            stroke="#1890ff"
                            strokeWidth="2"
                          />
                          {mergedTrendData.map((d, i) => (
                            <g key={`revenue-${i}`}>
                              <circle
                                cx={`${(i + 0.5) * (100 / mergedTrendData.length)}%`}
                                cy={`${50 - (d.sales / maxRevenue) * 50}%`}
                                r="4"
                                fill="#1890ff"
                              />
                              <circle
                                cx={`${(i + 0.5) * (100 / mergedTrendData.length)}%`}
                                cy={`${50 - (d.sales / maxRevenue) * 50}%`}
                                r="2"
                                fill="#fff"
                              />
                            </g>
                          ))}
                        </>
                      )}
                    </svg>
                  </div>

                  {/* X轴 */}
                  <div style={{ height: '30px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginLeft: '10px', overflow: 'hidden' }}>
                    {mergedTrendData.filter((_, i) => i % (timeRange === '7d' ? 1 : 4) === 0).map((d, i) => (
                      <Text key={i} type="secondary" style={{ fontSize: '12px' }}>
                        {d.date}
                      </Text>
                    ))}
                  </div>
                </div>
              </div>

              {/* 图例 */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '24px' }}>
                <Space>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#1890ff' }}></div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>交易额</Text>
                </Space>
                <Space>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#52c41a' }}></div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>订单量</Text>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 4. 用户/内容相关指标（左半） | 商家相关指标（右半） */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} align="stretch">
          <Col xs={24} lg={12}>
            <Card title="用户/内容相关指标" style={{ height: '100%' }}>
              <List
                dataSource={data?.userContentMetrics || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>{item.value}</Text>
                          {item.type === 'warning' && <Tag color="red">待审核</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="商家相关指标" style={{ height: '100%' }}>
              <List
                dataSource={data?.merchantMetrics || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>{item.value}</Text>
                          {item.type === 'warning' && <Tag color="red">待审核</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default AdminDashboard;
