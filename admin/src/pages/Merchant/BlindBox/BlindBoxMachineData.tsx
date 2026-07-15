import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  App,
  Statistic,
  Row,
  Col,
  Progress,
  Image,
  Typography,
  Empty,
  Tabs,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  UserOutlined,
  FireOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import {
  getBlindBoxMachineDetail,
  getBlindBoxMachineStatistics,
  getBlindBoxMachineRecords,
  type BlindBoxMachine,
  type BlindBoxMachineStatistics,
  type BlindBoxDrawRecord,
} from '../../../services/blindBoxMachine';

const { Text, Title } = Typography;

const API_BASE_URL = 'http://localhost:8080';

const getFullImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return 'https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const BlindBoxMachineData: React.FC = () => {
  const { machineId } = useParams<{ machineId: string }>();
  const [machine, setMachine] = useState<BlindBoxMachine | null>(null);
  const [statistics, setStatistics] = useState<BlindBoxMachineStatistics | null>(null);
  const [records, setRecords] = useState<BlindBoxDrawRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const { message } = App.useApp();

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [detailResp, statsResp] = await Promise.all([
        getBlindBoxMachineDetail(machineId!),
        getBlindBoxMachineStatistics(machineId!),
      ]);
      if (detailResp.code === 200 || detailResp.message === 'success') {
        setMachine(detailResp.data);
      }
      if (statsResp.code === 200 || statsResp.message === 'success') {
        setStatistics(statsResp.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setRecordLoading(true);
    try {
      const response = await getBlindBoxMachineRecords(machineId!, {
        page,
        size: pageSize,
      });
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setRecords(data.records || data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: data.total || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      message.error('加载抽盒记录失败');
    } finally {
      setRecordLoading(false);
    }
  };

  useEffect(() => {
    if (machineId) {
      fetchDetail();
      fetchRecords(1, 10);
    }
  }, [machineId]);

  const variantStatColumns = [
    {
      title: '款式图片',
      dataIndex: 'variantImage',
      key: 'variantImage',
      width: 60,
      render: (image: string) => (
        <Image
          width={36}
          height={36}
          src={getFullImageUrl(image)}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60"
        />
      ),
    },
    {
      title: '款式名称',
      dataIndex: 'variantName',
      key: 'variantName',
      render: (name: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.variantType && (
            <Tag color={record.variantType === 'hidden' ? 'purple' : 'blue'}>
              {record.variantType === 'hidden' ? '隐藏款' : '常规款'}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '抽出次数',
      dataIndex: 'drawnCount',
      key: 'drawnCount',
      width: 100,
      sorter: (a: any, b: any) => (a.drawnCount || 0) - (b.drawnCount || 0),
      render: (v: number) => v || 0,
    },
    {
      title: '抽出占比',
      dataIndex: 'drawRate',
      key: 'drawRate',
      width: 220,
      render: (rate: number, record: any) => {
        const percent = rate ? Number(rate) * 100 : 0;
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Progress percent={percent} size="small" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {percent.toFixed(2)}%
            </Text>
          </Space>
        );
      },
    },
    {
      title: '贡献流水',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (v: number) => (v ? `¥${Number(v).toFixed(2)}` : '¥0.00'),
    },
  ];

  const recordColumns = [
    {
      title: '抽盒时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '用户',
      dataIndex: 'userNickname',
      key: 'userNickname',
      width: 140,
      render: (name: string, record: BlindBoxDrawRecord) => name || record.userId,
    },
    {
      title: '抽盒类型',
      dataIndex: 'drawType',
      key: 'drawType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'TEN' ? 'gold' : 'blue'}>
          {type === 'TEN' ? '十连' : '单抽'}
        </Tag>
      ),
    },
    {
      title: '抽中款式',
      key: 'variant',
      render: (_: any, record: BlindBoxDrawRecord) => (
        <Space>
          {record.variantImage && (
            <Image
              width={36}
              height={36}
              src={getFullImageUrl(record.variantImage)}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60"
            />
          )}
          <Space direction="vertical" size={0}>
            <Text>{record.variantName || '-'}</Text>
            <Space size={4}>
              {record.isHidden && <Tag color="purple" style={{ margin: 0 }}>隐藏</Tag>}
              {record.isGuaranteed && <Tag color="gold" style={{ margin: 0 }}>保底</Tag>}
            </Space>
          </Space>
        </Space>
      ),
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (no: string, record: BlindBoxDrawRecord) =>
        no || record.orderId || '-',
    },
    {
      title: '价格',
      dataIndex: 'drawPrice',
      key: 'drawPrice',
      width: 100,
      render: (price: number) => (price ? `¥${Number(price).toFixed(2)}` : '-'),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push('/merchant-center/blind-box/list')}
            >
              返回
            </Button>
            <span>{machine?.machineName || '抽盒机数据'}</span>
            {machine && (
              <Tag color={machine.machineStatus === 'ACTIVE' ? 'green' : 'default'}>
                {machine.machineStatus === 'ACTIVE' ? '运行中' : '已停用'}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchDetail} loading={loading}>
            刷新
          </Button>
        }
      >
        {/* 概览统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总抽数"
                value={statistics?.totalDraws || machine?.totalDraws || 0}
                prefix={<ThunderboltOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总流水"
                value={statistics?.totalRevenue || machine?.totalRevenue || 0}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
                suffix="¥"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="参与用户数"
                value={statistics?.uniqueUsers || 0}
                prefix={<UserOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="保底触发数"
                value={machine?.guaranteeDraws || 0}
                prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 单抽/十连分布 */}
        {statistics && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="单抽次数"
                  value={statistics.singleDraws || 0}
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="十连次数"
                  value={statistics.tenDraws || 0}
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Tabs
          items={[
            {
              key: 'variant-stats',
              label: '款式抽出统计',
              children: (
                <Table
                  columns={variantStatColumns}
                  dataSource={statistics?.variantStats || []}
                  rowKey="saleVariantId"
                  pagination={false}
                  size="middle"
                  loading={loading}
                  locale={{
                    emptyText: <Empty description="暂无抽出数据" />,
                  }}
                />
              ),
            },
            {
              key: 'records',
              label: '抽盒记录',
              children: (
                <Table
                  columns={recordColumns}
                  dataSource={records}
                  rowKey="recordId"
                  size="middle"
                  loading={recordLoading}
                  scroll={{ x: 900 }}
                  pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                  onChange={(p) => fetchRecords(p.current || 1, p.pageSize || 10)}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default BlindBoxMachineData;
