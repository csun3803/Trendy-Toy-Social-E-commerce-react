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
  Image,
  Descriptions,
  Typography,
  Empty,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getAdminBlindBoxMachines,
  getAdminBlindBoxMachineDetail,
  getAdminBlindBoxMachineVariants,
  approveBlindBoxMachine,
  rejectBlindBoxMachine,
  type BlindBoxMachine,
  type BlindBoxMachineVariant,
} from '../../services/blindBoxMachine';

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

const BlindBoxMachineAudit: React.FC = () => {
  const [machines, setMachines] = useState<BlindBoxMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');

  // 审核弹窗
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditingMachine, setAuditingMachine] = useState<BlindBoxMachine | null>(null);
  const [auditVariants, setAuditVariants] = useState<BlindBoxMachineVariant[]>([]);
  const [auditDetail, setAuditDetail] = useState<BlindBoxMachine | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailMachine, setDetailMachine] = useState<BlindBoxMachine | null>(null);
  const [detailVariants, setDetailVariants] = useState<BlindBoxMachineVariant[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const { message } = App.useApp();

  const fetchMachines = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        size: pageSize,
        auditStatus: 'PENDING', // 审核管理页固定筛选待审核
      };
      if (keyword) params.keyword = keyword;

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
        message.error('获取待审核列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      message.error('获取待审核列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines(1, 10);
  }, []);

  // 打开审核弹窗
  const handleOpenAudit = async (record: BlindBoxMachine) => {
    setAuditingMachine(record);
    setAuditVisible(true);
    setRejectRemark('');
    setAuditLoading(true);
    setAuditVariants([]);
    setAuditDetail(null);
    try {
      const [detailResp, variantsResp] = await Promise.all([
        getAdminBlindBoxMachineDetail(record.machineId),
        getAdminBlindBoxMachineVariants(record.machineId),
      ]);
      if (detailResp.code === 200 || detailResp.message === 'success') {
        setAuditDetail(detailResp.data);
      }
      if (variantsResp.code === 200 || variantsResp.message === 'success') {
        setAuditVariants(variantsResp.data || []);
      }
    } catch (error) {
      console.error('Error fetching audit detail:', error);
      message.error('加载详情失败');
    } finally {
      setAuditLoading(false);
    }
  };

  // 打开详情弹窗
  const handleOpenDetail = async (record: BlindBoxMachine) => {
    setDetailVisible(true);
    setDetailLoading(true);
    setDetailMachine(record);
    setDetailVariants([]);
    try {
      const [detailResp, variantsResp] = await Promise.all([
        getAdminBlindBoxMachineDetail(record.machineId),
        getAdminBlindBoxMachineVariants(record.machineId),
      ]);
      if (detailResp.code === 200 || detailResp.message === 'success') {
        setDetailMachine(detailResp.data);
      }
      if (variantsResp.code === 200 || variantsResp.message === 'success') {
        setDetailVariants(variantsResp.data || []);
      }
    } catch (error) {
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 通过审核
  const handleApprove = async () => {
    if (!auditingMachine) return;
    setActionLoading(true);
    try {
      const response = await approveBlindBoxMachine(auditingMachine.machineId);
      if (response.code === 200 || response.message === 'success') {
        message.success('审核通过');
        setAuditVisible(false);
        fetchMachines(pagination.current, pagination.pageSize);
      } else {
        message.error('审核失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('审核失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 驳回审核
  const handleReject = async () => {
    if (!auditingMachine) return;
    if (!rejectRemark.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    setActionLoading(true);
    try {
      const response = await rejectBlindBoxMachine(auditingMachine.machineId, {
        auditRemark: rejectRemark,
      });
      if (response.code === 200 || response.message === 'success') {
        message.success('已驳回');
        setAuditVisible(false);
        fetchMachines(pagination.current, pagination.pageSize);
      } else {
        message.error('驳回失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('驳回失败');
    } finally {
      setActionLoading(false);
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
      title: '款式数',
      key: 'variantCount',
      width: 80,
      render: () => '-',
    },
    {
      title: '提交审核时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (date: string) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: BlindBoxMachine) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleOpenAudit(record)}>
            审核
          </Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // 款式配置列（用于审核/详情弹窗）
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
      render: (name: string, record: BlindBoxMachineVariant) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.variantType && (
            <Tag color={record.variantType === 'hidden' ? 'purple' : 'blue'} style={{ margin: 0 }}>
              {record.variantType === 'hidden' ? '隐藏款' : '常规款'}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '库存配置',
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
      title: '概率配置',
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
  ];

  const renderMachineInfo = (machine: BlindBoxMachine | null) => {
    if (!machine) return null;
    return (
      <Descriptions bordered column={2} size="small" title="抽盒机配置" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="抽盒机名称">{machine.machineName}</Descriptions.Item>
        <Descriptions.Item label="所属店铺">
          {machine.shopName || machine.shopId}
        </Descriptions.Item>
        <Descriptions.Item label="关联销售系列">
          {machine.saleSeriesName || machine.saleSeriesId}
        </Descriptions.Item>
        <Descriptions.Item label="单抽价格">
          ¥{Number(machine.drawPrice || 0).toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="十连价格">
          {machine.tenDrawPrice != null ? `¥${Number(machine.tenDrawPrice).toFixed(2)}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="排序权重">{machine.sortOrder ?? 0}</Descriptions.Item>
        {machine.machineDescription && (
          <Descriptions.Item label="描述" span={2}>
            {machine.machineDescription}
          </Descriptions.Item>
        )}
      </Descriptions>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="抽盒机审核管理"
      >
        <Alert
          message="此处展示商家提交审核的抽盒机，管理员可查看完整配置后通过或驳回。"
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索抽盒机名称"
            allowClear
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchMachines(1, pagination.pageSize)}
          />
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
              setKeyword('');
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
          locale={{
            emptyText: <Empty description="暂无待审核的抽盒机" />,
          }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(p) => fetchMachines(p.current || 1, p.pageSize || 10)}
        />
      </Card>

      {/* 审核弹窗 */}
      <Modal
        title="审核抽盒机"
        open={auditVisible}
        onCancel={() => setAuditVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setAuditVisible(false)}>
            取消
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            loading={actionLoading}
            onClick={handleReject}
          >
            驳回
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            loading={actionLoading}
            onClick={handleApprove}
          >
            通过
          </Button>,
        ]}
      >
        {renderMachineInfo(auditDetail || auditingMachine)}

        <div style={{ marginBottom: 8, fontWeight: 500 }}>
          款式配置（共 {auditVariants.length} 个款式）
        </div>
        <Table
          columns={variantConfigColumns}
          dataSource={auditVariants}
          rowKey="saleVariantId"
          pagination={false}
          size="middle"
          loading={auditLoading}
          scroll={{ x: 600 }}
        />

        <div style={{ marginTop: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            驳回原因（驳回时必填）：
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="如选择驳回，请填写驳回原因"
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.target.value)}
            maxLength={200}
            showCount
          />
        </div>
      </Modal>

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
        width={900}
      >
        {renderMachineInfo(detailMachine)}

        <div style={{ marginBottom: 8, fontWeight: 500 }}>
          款式配置（共 {detailVariants.length} 个款式）
        </div>
        <Table
          columns={variantConfigColumns}
          dataSource={detailVariants}
          rowKey="saleVariantId"
          pagination={false}
          size="middle"
          loading={detailLoading}
          scroll={{ x: 600 }}
        />
      </Modal>
    </div>
  );
};

export default BlindBoxMachineAudit;
