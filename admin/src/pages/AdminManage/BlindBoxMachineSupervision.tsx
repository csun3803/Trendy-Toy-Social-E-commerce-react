import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  App,
  Modal,
  Input,
  Select,
  Image,
  Descriptions,
  Tabs,
  Typography,
  Tooltip,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  getAdminBlindBoxMachines,
  getAdminBlindBoxMachineDetail,
  getAdminBlindBoxMachineVariants,
  getAdminBlindBoxMachineRecords,
  takedownBlindBoxMachine,
  type BlindBoxMachine,
  type BlindBoxMachineVariant,
  type BlindBoxDrawRecord,
} from '../../services/blindBoxMachine';

const { Option } = Select;
const { Text } = Typography;

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

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  ACTIVE: { text: '启用', color: 'green' },
  INACTIVE: { text: '停用', color: 'orange' },
  TAKEDOWN: { text: '已强制下架', color: 'red' },
};

const AUDIT_MAP: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待审核', color: 'blue' },
  APPROVED: { text: '已通过', color: 'green' },
  REJECTED: { text: '已驳回', color: 'red' },
  DRAFT: { text: '草稿', color: 'default' },
};

const BlindBoxMachineSupervision: React.FC = () => {
  const [machines, setMachines] = useState<BlindBoxMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchParams, setSearchParams] = useState({
    shopId: '',
    machineStatus: '',
    auditStatus: '',
    keyword: '',
  });
  const [shopOptions, setShopOptions] = useState<{ shopId: string; shopName: string }[]>([]);

  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentMachine, setCurrentMachine] = useState<BlindBoxMachine | null>(null);
  const [currentVariants, setCurrentVariants] = useState<BlindBoxMachineVariant[]>([]);
  const [currentRecords, setCurrentRecords] = useState<BlindBoxDrawRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recordPagination, setRecordPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 强制下架弹窗
  const [takedownVisible, setTakedownVisible] = useState(false);
  const [takedownMachine, setTakedownMachine] = useState<BlindBoxMachine | null>(null);
  const [takedownRemark, setTakedownRemark] = useState('');
  const [takedownLoading, setTakedownLoading] = useState(false);

  const { message } = App.useApp();

  const fetchShops = async () => {
    try {
      // 复用商家管理接口获取店铺列表作为筛选项
      const { getShopList } = await import('../../services/adminManage');
      const response = await getShopList({ page: 1, size: 100 });
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        const list = data.records || data.list || [];
        setShopOptions(list.map((s: any) => ({ shopId: s.shopId, shopName: s.shopName })));
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchMachines = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (searchParams.shopId) params.shopId = searchParams.shopId;
      if (searchParams.machineStatus) params.machineStatus = searchParams.machineStatus;
      if (searchParams.auditStatus) params.auditStatus = searchParams.auditStatus;
      if (searchParams.keyword) params.keyword = searchParams.keyword;

      const response = await getAdminBlindBoxMachines(params);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setMachines(data.records || data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: data.total || 0,
        });
      } else {
        message.error('获取抽盒机列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      message.error('获取抽盒机列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    fetchMachines(1, 10);
  }, []);

  // 查看详情
  const handleViewDetail = async (record: BlindBoxMachine) => {
    setDetailVisible(true);
    setDetailLoading(true);
    setCurrentMachine(record);
    setCurrentVariants([]);
    setCurrentRecords([]);
    try {
      const [detailResp, variantsResp, recordsResp] = await Promise.all([
        getAdminBlindBoxMachineDetail(record.machineId),
        getAdminBlindBoxMachineVariants(record.machineId),
        getAdminBlindBoxMachineRecords(record.machineId, { page: 1, size: 10 }),
      ]);

      if (detailResp.code === 200 || detailResp.message === 'success') {
        setCurrentMachine(detailResp.data);
      }
      if (variantsResp.code === 200 || variantsResp.message === 'success') {
        setCurrentVariants(variantsResp.data || []);
      }
      if (recordsResp.code === 200 || recordsResp.message === 'success') {
        const data = recordsResp.data as any;
        setCurrentRecords(data.records || data.list || []);
        setRecordPagination({
          current: 1,
          pageSize: 10,
          total: data.total || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching detail:', error);
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 加载更多抽盒记录
  const fetchRecordsPage = async (page: number, pageSize: number) => {
    if (!currentMachine) return;
    try {
      const response = await getAdminBlindBoxMachineRecords(currentMachine.machineId, {
        page,
        size: pageSize,
      });
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setCurrentRecords(data.records || data.list || []);
        setRecordPagination({
          current: page,
          pageSize,
          total: data.total || 0,
        });
      }
    } catch (error) {
      message.error('加载记录失败');
    }
  };

  // 强制下架
  const handleOpenTakedown = (record: BlindBoxMachine) => {
    setTakedownMachine(record);
    setTakedownRemark('');
    setTakedownVisible(true);
  };

  const handleConfirmTakedown = async () => {
    if (!takedownRemark.trim()) {
      message.warning('请填写下架原因');
      return;
    }
    if (!takedownMachine) return;
    setTakedownLoading(true);
    try {
      const response = await takedownBlindBoxMachine(takedownMachine.machineId, {
        auditRemark: takedownRemark,
      });
      if (response.code === 200 || response.message === 'success') {
        message.success('已强制下架');
        setTakedownVisible(false);
        fetchMachines(pagination.current, pagination.pageSize);
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setTakedownLoading(false);
    }
  };


  const columns = [
    {
      title: '封面',
      dataIndex: 'machineCoverImage',
      key: 'machineCoverImage',
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
      title: '抽盒机名称',
      dataIndex: 'machineName',
      key: 'machineName',
      render: (name: string, record: BlindBoxMachine) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.saleSeriesName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              系列：{record.saleSeriesName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '所属店铺',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 160,
      render: (name: string, record: BlindBoxMachine) => name || record.shopId,
    },
    {
      title: '单抽/十连',
      key: 'price',
      width: 130,
      render: (_: any, record: BlindBoxMachine) => (
        <Space direction="vertical" size={0}>
          <Text>单抽 ¥{Number(record.drawPrice || 0).toFixed(2)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.tenDrawPrice != null
              ? `十连 ¥${Number(record.tenDrawPrice).toFixed(2)}`
              : '十连 -'}
          </Text>
        </Space>
      ),
    },
    {
      title: '总抽数',
      dataIndex: 'totalDraws',
      key: 'totalDraws',
      width: 90,
      render: (v: number) => v || 0,
    },
    {
      title: '流水',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 120,
      sorter: (a: BlindBoxMachine, b: BlindBoxMachine) =>
        (a.totalRevenue || 0) - (b.totalRevenue || 0),
      render: (v: number) => (v ? `¥${Number(v).toFixed(2)}` : '¥0.00'),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (status: string, record: BlindBoxMachine) => {
        const s = AUDIT_MAP[status] || { text: status, color: 'default' };
        const tag = <Tag color={s.color}>{s.text}</Tag>;
        if ((status === 'REJECTED' || status === 'TAKEDOWN') && record.auditRemark) {
          return <Tooltip title={record.auditRemark}>{tag}</Tooltip>;
        }
        return tag;
      },
    },
    {
      title: '运行状态',
      dataIndex: 'machineStatus',
      key: 'machineStatus',
      width: 100,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { text: status, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: BlindBoxMachine) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.auditStatus === 'APPROVED' && record.machineStatus !== 'TAKEDOWN' && (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleOpenTakedown(record)}>
              下架
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 详情弹窗：款式配置列
  const variantConfigColumns = [
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
    },
    {
      title: '库存',
      key: 'stock',
      width: 160,
      render: (_: any, record: BlindBoxMachineVariant) =>
        record.overrideStock ? (
          <Tag color="orange">覆盖：{record.stockQuantity}</Tag>
        ) : (
          <Tag color="default">复用商城（{record.remainingStock ?? '-'}）</Tag>
        ),
    },
    {
      title: '概率',
      key: 'probability',
      width: 140,
      render: (_: any, record: BlindBoxMachineVariant) =>
        record.overrideProbability ? (
          <Tag color="orange">
            覆盖：{((Number(record.drawProbability) || 0) * 100).toFixed(2)}%
          </Tag>
        ) : (
          <Tag color="default">复用商城</Tag>
        ),
    },
    {
      title: '已抽次数',
      dataIndex: 'drawnCount',
      key: 'drawnCount',
      width: 100,
      render: (v: number) => v || 0,
    },
  ];

  // 详情弹窗：抽盒记录列
  const recordColumns = [
    {
      title: '抽盒时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '用户',
      key: 'user',
      width: 120,
      render: (_: any, record: BlindBoxDrawRecord) =>
        record.userNickname || record.userId,
    },
    {
      title: '类型',
      dataIndex: 'drawType',
      key: 'drawType',
      width: 80,
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
      width: 160,
      render: (no: string, record: BlindBoxDrawRecord) => no || record.orderId || '-',
    },
    {
      title: '价格',
      dataIndex: 'drawPrice',
      key: 'drawPrice',
      width: 90,
      render: (price: number) => (price ? `¥${Number(price).toFixed(2)}` : '-'),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="抽盒机监管"
      >
        <Alert
          message="管理员仅具备监管权限，不能创建或编辑抽盒机配置"
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索抽盒机名称"
            allowClear
            style={{ width: 200 }}
            value={searchParams.keyword}
            onChange={(e) =>
              setSearchParams({ ...searchParams, keyword: e.target.value })
            }
            onPressEnter={() => fetchMachines(1, pagination.pageSize)}
          />
          <Select
            placeholder="按店铺筛选"
            style={{ width: 180 }}
            value={searchParams.shopId || undefined}
            onChange={(value) =>
              setSearchParams({ ...searchParams, shopId: value || '' })
            }
            allowClear
            showSearch
            optionFilterProp="label"
            options={shopOptions.map((s) => ({
              label: s.shopName,
              value: s.shopId,
            }))}
          />
          <Select
            placeholder="审核状态"
            style={{ width: 130 }}
            value={searchParams.auditStatus || undefined}
            onChange={(value) =>
              setSearchParams({ ...searchParams, auditStatus: value || '' })
            }
            allowClear
          >
            <Option value="PENDING">待审核</Option>
            <Option value="APPROVED">已通过</Option>
            <Option value="REJECTED">已驳回</Option>
            <Option value="DRAFT">草稿</Option>
          </Select>
          <Select
            placeholder="运行状态"
            style={{ width: 130 }}
            value={searchParams.machineStatus || undefined}
            onChange={(value) =>
              setSearchParams({ ...searchParams, machineStatus: value || '' })
            }
            allowClear
          >
            <Option value="ACTIVE">启用</Option>
            <Option value="INACTIVE">停用</Option>
            <Option value="TAKEDOWN">已强制下架</Option>
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => fetchMachines(1, pagination.pageSize)}
          >
            搜索
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchParams({
                shopId: '',
                machineStatus: '',
                auditStatus: '',
                keyword: '',
              });
              setTimeout(() => fetchMachines(1, pagination.pageSize), 0);
            }}
          >
            重置
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={machines}
          loading={loading}
          rowKey="machineId"
          scroll={{ x: 'max-content' }}
          size="middle"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(p) => fetchMachines(p.current || 1, p.pageSize || 10)}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="抽盒机详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        {currentMachine && (
          <div>
            <Descriptions bordered column={2} size="small" title="基础信息" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="抽盒机名称">
                {currentMachine.machineName}
              </Descriptions.Item>
              <Descriptions.Item label="所属店铺">
                {currentMachine.shopName || currentMachine.shopId}
              </Descriptions.Item>
              <Descriptions.Item label="关联销售系列">
                {currentMachine.saleSeriesName || currentMachine.saleSeriesId}
              </Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Tag color={AUDIT_MAP[currentMachine.auditStatus]?.color}>
                  {AUDIT_MAP[currentMachine.auditStatus]?.text || currentMachine.auditStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="运行状态">
                <Tag color={STATUS_MAP[currentMachine.machineStatus]?.color}>
                  {STATUS_MAP[currentMachine.machineStatus]?.text || currentMachine.machineStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="单抽/十连价格">
                单抽 ¥{Number(currentMachine.drawPrice || 0).toFixed(2)} / 十连{' '}
                {currentMachine.tenDrawPrice != null
                  ? `¥${Number(currentMachine.tenDrawPrice).toFixed(2)}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="总抽数">{currentMachine.totalDraws || 0}</Descriptions.Item>
              <Descriptions.Item label="总流水">
                ¥{Number(currentMachine.totalRevenue || 0).toFixed(2)}
              </Descriptions.Item>
              {currentMachine.machineDescription && (
                <Descriptions.Item label="描述" span={2}>
                  {currentMachine.machineDescription}
                </Descriptions.Item>
              )}
              {currentMachine.auditRemark && (
                <Descriptions.Item label="审核/下架备注" span={2}>
                  {currentMachine.auditRemark}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">
                {currentMachine.createdAt
                  ? new Date(currentMachine.createdAt).toLocaleString()
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {currentMachine.updatedAt
                  ? new Date(currentMachine.updatedAt).toLocaleString()
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              items={[
                {
                  key: 'variants',
                  label: `款式配置 (${currentVariants.length})`,
                  children: (
                    <Table
                      columns={variantConfigColumns}
                      dataSource={currentVariants}
                      rowKey="saleVariantId"
                      pagination={false}
                      size="middle"
                      loading={detailLoading}
                    />
                  ),
                },
                {
                  key: 'records',
                  label: '抽盒记录',
                  children: (
                    <Table
                      columns={recordColumns}
                      dataSource={currentRecords}
                      rowKey="recordId"
                      size="middle"
                      loading={detailLoading}
                      scroll={{ x: 800 }}
                      pagination={{
                        ...recordPagination,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                      }}
                      onChange={(p) =>
                        fetchRecordsPage(p.current || 1, p.pageSize || 10)
                      }
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* 强制下架弹窗 */}
      <Modal
        title="强制下架抽盒机"
        open={takedownVisible}
        onCancel={() => setTakedownVisible(false)}
        onOk={handleConfirmTakedown}
        confirmLoading={takedownLoading}
        okText="确认下架"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        {takedownMachine && (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="抽盒机名称">
                {takedownMachine.machineName}
              </Descriptions.Item>
              <Descriptions.Item label="所属店铺">
                {takedownMachine.shopName || takedownMachine.shopId}
              </Descriptions.Item>
            </Descriptions>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              下架原因（必填）：
            </Text>
            <Input.TextArea
              rows={4}
              placeholder="请填写下架原因，将通知商家"
              value={takedownRemark}
              onChange={(e) => setTakedownRemark(e.target.value)}
              maxLength={200}
              showCount
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BlindBoxMachineSupervision;
