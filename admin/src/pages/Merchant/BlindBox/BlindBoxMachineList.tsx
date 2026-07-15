import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  App,
  Modal,
  Input,
  Select,
  Image,
  Dropdown,
  MenuProps,
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  MoreOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  getMerchantBlindBoxMachines,
  deleteBlindBoxMachine,
  updateBlindBoxMachineStatus,
  submitBlindBoxMachineForAudit,
  type BlindBoxMachine,
} from '../../../services/blindBoxMachine';

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
  TAKEDOWN: { text: '已下架', color: 'red' },
};

const AUDIT_MAP: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待审核', color: 'blue' },
  APPROVED: { text: '已通过', color: 'green' },
  REJECTED: { text: '已驳回', color: 'red' },
  DRAFT: { text: '草稿', color: 'default' },
};

const BlindBoxMachineList: React.FC = () => {
  const [machineList, setMachineList] = useState<BlindBoxMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
    auditStatus: '',
  });
  const { message } = App.useApp();

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchParams.keyword) params.keyword = searchParams.keyword;
      if (searchParams.status) params.status = searchParams.status;
      if (searchParams.auditStatus) params.auditStatus = searchParams.auditStatus;

      const response = await getMerchantBlindBoxMachines(params);
      if (response.code === 200 || response.message === 'success') {
        setMachineList(response.data || []);
      } else {
        message.error('获取抽盒机列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('Error fetching blind box machines:', error);
      message.error('获取抽盒机列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleToggleStatus = async (record: BlindBoxMachine) => {
    const targetStatus = record.machineStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (record.auditStatus !== 'APPROVED') {
      message.warning('仅审核通过的抽盒机可启用/停用');
      return;
    }
    try {
      const response = await updateBlindBoxMachineStatus(record.machineId, targetStatus);
      if (response.code === 200 || response.message === 'success') {
        message.success(targetStatus === 'ACTIVE' ? '已启用' : '已停用');
        fetchMachines();
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmitAudit = async (record: BlindBoxMachine) => {
    Modal.confirm({
      title: '提交审核',
      content: `确定要提交抽盒机「${record.machineName}」进行审核吗？提交后等待平台审核通过才能上架。`,
      okText: '提交审核',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await submitBlindBoxMachineForAudit(record.machineId);
          if (response.code === 200 || response.message === 'success') {
            message.success('已提交审核');
            fetchMachines();
          } else {
            message.error('提交失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          message.error('提交失败');
        }
      },
    });
  };

  const handleDelete = (record: BlindBoxMachine) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除抽盒机「${record.machineName}」吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteBlindBoxMachine(record.machineId);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchMachines();
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const getActionMenuItems = (record: BlindBoxMachine): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'edit',
        label: '编辑配置',
        icon: <EditOutlined />,
        onClick: () => history.push(`/merchant-center/blind-box/edit/${record.machineId}`),
      },
      {
        key: 'data',
        label: '数据统计',
        icon: <BarChartOutlined />,
        onClick: () => history.push(`/merchant-center/blind-box/data/${record.machineId}`),
      },
    ];

    // 提交审核
    if (
      record.auditStatus === 'DRAFT' ||
      record.auditStatus === 'REJECTED'
    ) {
      items.push({
        key: 'submit-audit',
        label: '提交审核',
        icon: <SendOutlined />,
        onClick: () => handleSubmitAudit(record),
      });
    }

    // 启用/停用
    if (record.auditStatus === 'APPROVED' && record.machineStatus !== 'TAKEDOWN') {
      items.push({
        key: 'toggle-status',
        label: record.machineStatus === 'ACTIVE' ? '停用' : '启用',
        icon: record.machineStatus === 'ACTIVE' ? <StopOutlined /> : <CheckCircleOutlined />,
        onClick: () => handleToggleStatus(record),
      });
    }

    items.push({ type: 'divider' });

    items.push({
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      disabled: record.machineStatus === 'ACTIVE',
      onClick: () => handleDelete(record),
    });

    return items;
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
          {record.machineDescription && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.machineDescription.length > 30
                ? `${record.machineDescription.slice(0, 30)}...`
                : record.machineDescription}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '关联销售系列',
      dataIndex: 'saleSeriesName',
      key: 'saleSeriesName',
      render: (name: string) => name || '-',
    },
    {
      title: '单抽价格',
      dataIndex: 'drawPrice',
      key: 'drawPrice',
      width: 100,
      render: (price: number) => (price ? `¥${Number(price).toFixed(2)}` : '-'),
    },
    {
      title: '十连价格',
      dataIndex: 'tenDrawPrice',
      key: 'tenDrawPrice',
      width: 100,
      render: (price: number | null) => (price != null ? `¥${Number(price).toFixed(2)}` : '-'),
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
      width: 110,
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
        if (status === 'REJECTED' && record.auditRemark) {
          return (
            <Tooltip title={`驳回原因：${record.auditRemark}`}>
              {tag}
            </Tooltip>
          );
        }
        return tag;
      },
    },
    {
      title: '状态',
      dataIndex: 'machineStatus',
      key: 'machineStatus',
      width: 90,
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
      width: 70,
      fixed: 'right' as const,
      render: (_: any, record: BlindBoxMachine) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={['hover']}
          placement="bottomRight"
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="抽盒机管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/merchant-center/blind-box/edit/new')}
          >
            新建抽盒机
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索抽盒机名称"
            allowClear
            style={{ width: 220 }}
            value={searchParams.keyword}
            onChange={(e) =>
              setSearchParams({ ...searchParams, keyword: e.target.value })
            }
            onPressEnter={fetchMachines}
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
            <Option value="DRAFT">草稿</Option>
            <Option value="PENDING">待审核</Option>
            <Option value="APPROVED">已通过</Option>
            <Option value="REJECTED">已驳回</Option>
          </Select>
          <Select
            placeholder="运行状态"
            style={{ width: 120 }}
            value={searchParams.status || undefined}
            onChange={(value) =>
              setSearchParams({ ...searchParams, status: value || '' })
            }
            allowClear
          >
            <Option value="ACTIVE">启用</Option>
            <Option value="INACTIVE">停用</Option>
            <Option value="TAKEDOWN">已下架</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchMachines}>
            搜索
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchParams({ keyword: '', status: '', auditStatus: '' });
              setTimeout(fetchMachines, 0);
            }}
          >
            重置
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={machineList}
          loading={loading}
          rowKey="machineId"
          scroll={{ x: 'max-content' }}
          size="middle"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSize: 10,
          }}
        />
      </Card>
    </div>
  );
};

export default BlindBoxMachineList;
