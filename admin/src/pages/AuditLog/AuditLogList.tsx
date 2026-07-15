import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Select,
  Input,
  DatePicker,
  Row,
  Col,
  Button,
  Modal,
  Descriptions,
  App,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getAuditLogList, getAuditLogById, type AuditLog } from '../../services/auditLog';

const { RangePicker } = DatePicker;

// 操作模块映射
const MODULE_MAP: Record<string, { text: string; color: string }> = {
  USER: { text: '用户管理', color: 'blue' },
  SHOP: { text: '商家管理', color: 'green' },
  ORDER: { text: '订单管理', color: 'orange' },
  ADMIN: { text: '管理员管理', color: 'purple' },
  ACTIVITY: { text: '动态管理', color: 'cyan' },
  ALBUM: { text: '图鉴管理', color: 'geekblue' },
};

// 操作类型映射
const ACTION_MAP: Record<string, { text: string; color: string }> = {
  CREATE: { text: '新增', color: 'green' },
  UPDATE: { text: '修改', color: 'blue' },
  DELETE: { text: '删除', color: 'red' },
  LOGIN: { text: '登录', color: 'purple' },
  APPROVE: { text: '审批通过', color: 'cyan' },
  REJECT: { text: '审批驳回', color: 'orange' },
};

// 操作人类型映射
const OPERATOR_TYPE_MAP: Record<string, string> = {
  PLATFORM_ADMIN: '平台管理员',
  SHOP_ADMIN: '店铺管理员',
};

const AuditLogList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 筛选条件
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [operatorNameFilter, setOperatorNameFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { message } = App.useApp();

  const fetchLogs = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: any = { page, size };
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;
      if (operatorNameFilter) params.operatorName = operatorNameFilter;
      if (dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0]!.format('YYYY-MM-DD');
        params.endDate = dateRange[1]!.format('YYYY-MM-DD');
      }

      const response = await getAuditLogList(params);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data;
        setLogs(data.records || []);
        setTotal(data.total || 0);
      } else {
        message.error('获取审计日志失败');
      }
    } catch (error) {
      console.error('获取审计日志失败', error);
      message.error('获取审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 查看详情
  const handleViewDetail = async (logId: string) => {
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const response = await getAuditLogById(logId);
      if (response.code === 200 || response.message === 'success') {
        setSelectedLog(response.data);
      } else {
        message.error('获取日志详情失败');
      }
    } catch (error) {
      message.error('获取日志详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 重置筛选
  const handleReset = () => {
    setModuleFilter(undefined);
    setActionFilter(undefined);
    setOperatorNameFilter('');
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1, pageSize);
  };

  // 表格列定义
  const columns: ColumnsType<AuditLog> = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
      sorter: true,
    },
    {
      title: '操作人',
      key: 'operator',
      width: 160,
      render: (_: any, record: AuditLog) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.operatorName || record.operatorId?.slice(0, 8) || '未知'}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {OPERATOR_TYPE_MAP[record.operatorType] || record.operatorType}
          </div>
        </div>
      ),
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      key: 'module',
      width: 110,
      render: (module: string) => {
        const info = MODULE_MAP[module];
        return info ? <Tag color={info.color}>{info.text}</Tag> : <Tag>{module}</Tag>;
      },
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 110,
      render: (action: string) => {
        const info = ACTION_MAP[action];
        return info ? <Tag color={info.color}>{info.text}</Tag> : <Tag>{action}</Tag>;
      },
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '请求路径',
      dataIndex: 'requestUrl',
      key: 'requestUrl',
      width: 220,
      ellipsis: true,
      render: (url: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{url}</span>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
      render: (ip: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{ip || '-'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'responseCode',
      key: 'responseCode',
      width: 80,
      render: (code: number) => (
        <Tag color={code === 200 ? 'green' : 'red'}>
          {code || '-'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: any, record: AuditLog) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.logId)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card>
        {/* 筛选栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Select
              placeholder="操作模块"
              value={moduleFilter}
              onChange={setModuleFilter}
              allowClear
              style={{ width: '100%' }}
              options={Object.entries(MODULE_MAP).map(([key, val]) => ({
                value: key,
                label: val.text,
              }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="操作类型"
              value={actionFilter}
              onChange={setActionFilter}
              allowClear
              style={{ width: '100%' }}
              options={Object.entries(ACTION_MAP).map(([key, val]) => ({
                value: key,
                label: val.text,
              }))}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="操作人"
              value={operatorNameFilter}
              onChange={(e) => setOperatorNameFilter(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 日志列表 */}
        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="logId"
          scroll={{ x: 'max-content' }}
          size="small"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
              fetchLogs(page, size);
            },
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="审计日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : selectedLog ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="日志ID" span={2}>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedLog.logId}</span>
            </Descriptions.Item>
            <Descriptions.Item label="操作人ID">
              {selectedLog.operatorId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作人名称">
              {selectedLog.operatorName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作人类型">
              {OPERATOR_TYPE_MAP[selectedLog.operatorType] || selectedLog.operatorType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作模块">
              {(() => {
                const info = MODULE_MAP[selectedLog.module];
                return info ? <Tag color={info.color}>{info.text}</Tag> : <Tag>{selectedLog.module}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="操作类型">
              {(() => {
                const info = ACTION_MAP[selectedLog.action];
                return info ? <Tag color={info.color}>{info.text}</Tag> : <Tag>{selectedLog.action}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="操作描述" span={2}>
              {selectedLog.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="目标ID">
              {selectedLog.targetId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="目标类型">
              {selectedLog.targetType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="请求方法">
              <Tag>{selectedLog.method || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="请求路径">
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedLog.requestUrl || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="请求参数" span={2}>
              <div style={{
                maxHeight: 150,
                overflow: 'auto',
                background: '#f5f5f5',
                padding: 8,
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {selectedLog.requestParams
                  ? (() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.requestParams), null, 2);
                      } catch {
                        return selectedLog.requestParams;
                      }
                    })()
                  : '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="响应状态码">
              <Tag color={selectedLog.responseCode === 200 ? 'green' : 'red'}>
                {selectedLog.responseCode || '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              <span style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
};

export default AuditLogList;
