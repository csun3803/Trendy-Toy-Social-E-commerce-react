import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, App, Modal, Form, Input, Select, Row, Col, InputNumber, Descriptions, Image, Typography, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, CheckOutlined, CloseOutlined, MoreOutlined } from '@ant-design/icons';
import {
  getShopList, updateShop, deleteShop, type Shop, approveShop, rejectShop, getShopFiles, type ShopCertificationFile,
} from '../../services/adminManage';

const { Text } = Typography;

const FILE_TYPE_NAMES = {
  BUSINESS_LICENSE: '营业执照',
  LEGAL_ID_FRONT: '法人身份证正面',
  LEGAL_ID_BACK: '法人身份证反面',
  TRADEMARK_CERT: '商标注册证',
  BRAND_AUTHORIZATION: '品牌授权书',
  BANK_LICENSE: '银行开户许可证',
  OTHER: '其他补充材料'
};

const { Option } = Select;

const MerchantList: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchParams, setSearchParams] = useState({ shopStatus: '', auditStatus: '' });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [viewingShop, setViewingShop] = useState<Shop | null>(null);
  const [auditingShop, setAuditingShop] = useState<Shop | null>(null);
  const [auditFiles, setAuditFiles] = useState<ShopCertificationFile[]>([]);
  const [viewFiles, setViewFiles] = useState<ShopCertificationFile[]>([]);

  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [auditForm] = Form.useForm();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (searchParams.shopStatus) params.shopStatus = searchParams.shopStatus;
      if (searchParams.auditStatus) params.auditStatus = searchParams.auditStatus;

      const response = await getShopList(params);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setShops(data.records || data.list || []);
        setPagination({ current: page, pageSize, total: data.total || 0 });
      } else {
        message.error('获取商家列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('获取商家列表失败', error);
      message.error('获取商家列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Shop) => {
    setEditingShop(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  const fetchFilesForAudit = async (shopId: string) => {
    try {
      const response = await getShopFiles(shopId);
      if (response.code === 200 || response.message === 'success') {
        setAuditFiles(response.data || []);
      }
    } catch (error) {
      console.error('获取文件失败', error);
    }
  };

  const fetchFilesForView = async (shopId: string) => {
    try {
      const response = await getShopFiles(shopId);
      if (response.code === 200 || response.message === 'success') {
        setViewFiles(response.data || []);
      }
    } catch (error) {
      console.error('获取文件失败', error);
    }
  };

  const handleAudit = (record: Shop) => {
    setAuditingShop(record);
    auditForm.resetFields();
    fetchFilesForAudit(record.shopId);
    setAuditModalVisible(true);
  };

  const handleView = (record: Shop) => {
    setViewingShop(record);
    fetchFilesForView(record.shopId);
    setViewModalVisible(true);
  };

  const handleApprove = async () => {
    if (!auditingShop) return;
    try {
      const response = await approveShop(auditingShop.shopId, {});
      if (response.code === 200 || response.message === 'success') {
        message.success('审核通过');
        setAuditModalVisible(false);
        fetchShops(pagination.current, pagination.pageSize);
      } else {
        message.error('审核失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('审核失败', error);
      message.error('审核失败');
    }
  };

  const handleReject = async () => {
    if (!auditingShop) return;
    try {
      const values = await auditForm.validateFields();
      const response = await rejectShop(auditingShop.shopId, { auditNotes: values.auditNotes });
      if (response.code === 200 || response.message === 'success') {
        message.success('已驳回');
        setAuditModalVisible(false);
        fetchShops(pagination.current, pagination.pageSize);
      } else {
        message.error('驳回失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('驳回失败', error);
    }
  };

  const handleDelete = (shopId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该商家吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteShop(shopId);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchShops(pagination.current, pagination.pageSize);
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          console.error('删除失败', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!editingShop) return;
      const response = await updateShop(editingShop.shopId, values);
      if (response.code === 200 || response.message === 'success') {
        message.success('更新成功');
        setEditModalVisible(false);
        fetchShops(pagination.current, pagination.pageSize);
      } else {
        message.error('更新失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('提交失败', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      '正常营业': 'green', '停业整顿': 'orange', '已关闭': 'red',
      '待审核': 'blue', '已通过': 'green', '已拒绝': 'red',
    };
    return colorMap[status] || 'default';
  };

  const groupFilesByType = (files: ShopCertificationFile[]) => {
    const grouped: { [key: string]: ShopCertificationFile[] } = {};
    files.forEach(file => {
      if (!grouped[file.fileType]) grouped[file.fileType] = [];
      grouped[file.fileType].push(file);
    });
    return grouped;
  };

  const isImageFile = (file: ShopCertificationFile) => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
    return imageExtensions.test(file.fileFormat || '') || imageExtensions.test(file.fileUrl || '') || imageExtensions.test(file.fileName || '');
  };

  const renderTags = (data: any, color?: string) => {
    const items = Array.isArray(data) ? data : (typeof data === 'string' ? (data.startsWith('[') ? JSON.parse(data) : data.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : []);
    return items.length > 0 ? items.map((item: string, idx: number) => <Tag key={idx} color={color}>{item}</Tag>) : '-';
  };

  const renderFiles = (files: ShopCertificationFile[]) => {
    const grouped = groupFilesByType(files);
    return Object.keys(grouped).map(fileType => {
      const typeFiles = grouped[fileType];
      if (typeFiles.length === 0) return null;
      return (
        <div key={fileType} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{FILE_TYPE_NAMES[fileType as keyof typeof FILE_TYPE_NAMES] || fileType}</div>
          <Row gutter={8}>
            {typeFiles.map(file => (
              <Col key={file.fileId} span={8} style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                  {isImageFile(file) && (
                    <Image src={file.fileUrl} style={{ width: 60, height: 60, objectFit: 'cover' }} fallback="https://via.placeholder.com/60?text=图片" />
                  )}
                  <div style={{ flex: 1 }}>
                    <Text>{file.fileName}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>上传时间：{file.uploadedAt}</Text>
                  </div>
                  <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => window.open(file.fileUrl, '_blank')} />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      );
    });
  };

  const renderImageField = (url?: string) => {
    if (!url) return '-';
    return <Image src={url.startsWith('http') ? url : `http://localhost:8080${url}`} width={80} height={80} style={{ objectFit: 'cover' }} fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk2iMa1AAAAABJRU5ErkJggg==" />;
  };

  // 构建操作列 - ≤3个直接显示，>3个用Dropdown
  const buildActions = (record: Shop) => {
    const actions = [
      { key: 'view', label: '查看', icon: <EyeOutlined />, onClick: () => handleView(record) },
      { key: 'edit', label: '编辑', icon: <EditOutlined />, onClick: () => handleEdit(record) },
    ];
    if (record.auditStatus === '待审核') {
      actions.push({ key: 'audit', label: '审核', icon: <CheckOutlined />, onClick: () => handleAudit(record) });
    }
    actions.push({ key: 'delete', label: '删除', icon: <DeleteOutlined />, onClick: () => handleDelete(record.shopId), danger: true });

    if (actions.length <= 3) {
      return (
        <Space size="small">
          {actions.map(a => (
            <Button key={a.key} type="link" size="small" icon={a.icon} onClick={a.onClick} danger={a.danger}>
              {a.label}
            </Button>
          ))}
        </Space>
      );
    }

    // >3: 显示前2个 + 更多下拉
    const visibleActions = actions.slice(0, 2);
    const moreActions = actions.slice(2);
    return (
      <Space size="small">
        {visibleActions.map(a => (
          <Button key={a.key} type="link" size="small" icon={a.icon} onClick={a.onClick}>
            {a.label}
          </Button>
        ))}
        <Dropdown menu={{ items: moreActions.map(a => ({ key: a.key, label: a.label, icon: a.icon, danger: a.danger, onClick: a.onClick })) }}>
          <Button type="link" size="small">更多<MoreOutlined /></Button>
        </Dropdown>
      </Space>
    );
  };

  const columns = [
    { title: '商家ID', dataIndex: 'shopId', key: 'shopId', width: 120 },
    {
      title: '商家名称', dataIndex: 'shopName', key: 'shopName', width: 180,
      render: (text: string, record: Shop) => (
        <a onClick={() => handleView(record)} style={{ color: '#1a56db', cursor: 'pointer' }}>{text}</a>
      ),
    },
    { title: '商家类型', dataIndex: 'shopType', key: 'shopType', width: 120 },
    {
      title: '店铺状态', dataIndex: 'shopStatus', key: 'shopStatus', width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status || '未知'}</Tag>,
    },
    {
      title: '审核状态', dataIndex: 'auditStatus', key: 'auditStatus', width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status || '待审核'}</Tag>,
    },
    { title: '评分', dataIndex: 'shopRating', key: 'shopRating', width: 80 },
    { title: '月销量', dataIndex: 'monthlySales', key: 'monthlySales', width: 100 },
    { title: '总销量', dataIndex: 'totalSales', key: 'totalSales', width: 100 },
    { title: '粉丝数', dataIndex: 'followerCount', key: 'followerCount', width: 100 },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: any, record: Shop) => buildActions(record),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="商家列表">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select placeholder="店铺状态" style={{ width: 120 }} value={searchParams.shopStatus || undefined} onChange={(value) => setSearchParams({ ...searchParams, shopStatus: value || '' })} allowClear>
            <Option value="正常营业">正常营业</Option>
            <Option value="停业整顿">停业整顿</Option>
            <Option value="已关闭">已关闭</Option>
          </Select>
          <Select placeholder="审核状态" style={{ width: 120 }} value={searchParams.auditStatus || undefined} onChange={(value) => setSearchParams({ ...searchParams, auditStatus: value || '' })} allowClear>
            <Option value="待审核">待审核</Option>
            <Option value="已通过">已通过</Option>
            <Option value="已拒绝">已拒绝</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchShops(1, pagination.pageSize)}>搜索</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setSearchParams({ shopStatus: '', auditStatus: '' }); fetchShops(1, pagination.pageSize); }}>重置</Button>
        </div>

        <Table
          columns={columns}
          dataSource={shops}
          loading={loading}
          rowKey="shopId"
          scroll={{ x: 'max-content' }}
          size="middle"
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }}
          onChange={(p) => fetchShops(p.current || 1, p.pageSize || 10)}
          onRow={(record) => ({ onDoubleClick: () => handleView(record) })}
        />
      </Card>

      {/* 编辑商家弹窗 */}
      <Modal title="编辑商家" open={editModalVisible} onOk={handleSubmit} onCancel={() => setEditModalVisible(false)} okText="确定" cancelText="取消" width={800}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="shopId" label="商家ID"><Input disabled /></Form.Item></Col>
            <Col span={12}><Form.Item name="shopName" label="商家名称" rules={[{ required: true, message: '请输入商家名称' }]}><Input placeholder="请输入商家名称" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="shopType" label="商家类型"><Select placeholder="请选择商家类型"><Option value="品牌店">品牌店</Option><Option value="专营店">专营店</Option><Option value="旗舰店">旗舰店</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="shopStatus" label="店铺状态"><Select><Option value="正常营业">正常营业</Option><Option value="停业整顿">停业整顿</Option><Option value="已关闭">已关闭</Option></Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="customerServicePhone" label="联系电话"><Input placeholder="请输入联系电话" /></Form.Item></Col>
            <Col span={12}><Form.Item name="customerServiceEmail" label="联系邮箱"><Input placeholder="请输入联系邮箱" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* 商家详情弹窗 */}
      <Modal title="商家详情" open={viewModalVisible} onCancel={() => setViewModalVisible(false)} footer={[<Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>]} width={900}>
        {viewingShop && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="商家ID">{viewingShop.shopId}</Descriptions.Item>
              <Descriptions.Item label="商家名称">{viewingShop.shopName}</Descriptions.Item>
              <Descriptions.Item label="商家类型">{viewingShop.shopType}</Descriptions.Item>
              <Descriptions.Item label="店铺状态"><Tag color={getStatusColor(viewingShop.shopStatus)}>{viewingShop.shopStatus}</Tag></Descriptions.Item>
              <Descriptions.Item label="审核状态"><Tag color={getStatusColor(viewingShop.auditStatus)}>{viewingShop.auditStatus}</Tag></Descriptions.Item>
              <Descriptions.Item label="店铺评分">{viewingShop.shopRating}</Descriptions.Item>
              <Descriptions.Item label="月销量">{viewingShop.monthlySales}</Descriptions.Item>
              <Descriptions.Item label="总销量">{viewingShop.totalSales}</Descriptions.Item>
              <Descriptions.Item label="总销售额">{viewingShop.totalSalesAmount}</Descriptions.Item>
              <Descriptions.Item label="粉丝数">{viewingShop.followerCount}</Descriptions.Item>
              <Descriptions.Item label="商品数">{viewingShop.productCount}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{viewingShop.customerServicePhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{viewingShop.customerServiceEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="店铺简介" span={2}>{(viewingShop as any).shopIntro || '-'}</Descriptions.Item>
              <Descriptions.Item label="主要品类">{renderTags((viewingShop as any).mainCategories)}</Descriptions.Item>
              <Descriptions.Item label="主要IP">{renderTags((viewingShop as any).mainIps, 'blue')}</Descriptions.Item>
              <Descriptions.Item label="审核备注" span={2}>{viewingShop.auditNotes || '-'}</Descriptions.Item>
              <Descriptions.Item label="审核时间">{viewingShop.auditedAt || '-'}</Descriptions.Item>
            </Descriptions>
            {viewFiles.length > 0 && (<div><div style={{ fontWeight: 500, marginBottom: 8, fontSize: 16 }}>资质文件</div>{renderFiles(viewFiles)}</div>)}
          </div>
        )}
      </Modal>

      {/* 商家审核弹窗 */}
      <Modal title="商家审核" open={auditModalVisible} onCancel={() => setAuditModalVisible(false)} footer={[<Button key="cancel" onClick={() => setAuditModalVisible(false)}>取消</Button>, <Button key="reject" danger icon={<CloseOutlined />} onClick={handleReject}>驳回</Button>, <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={handleApprove}>通过</Button>]} width={900}>
        {auditingShop && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="商家ID">{auditingShop.shopId}</Descriptions.Item>
              <Descriptions.Item label="商家名称">{auditingShop.shopName}</Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">{(auditingShop as any).unifiedSocialCreditCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="法人姓名">{(auditingShop as any).legalPersonName || '-'}</Descriptions.Item>
              <Descriptions.Item label="商家类型">{auditingShop.shopType}</Descriptions.Item>
              <Descriptions.Item label="审核状态"><Tag color={getStatusColor(auditingShop.auditStatus)}>{auditingShop.auditStatus}</Tag></Descriptions.Item>
              <Descriptions.Item label="联系电话">{auditingShop.customerServicePhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{auditingShop.customerServiceEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="店铺简介" span={2}>{(auditingShop as any).shopIntro || '-'}</Descriptions.Item>
              <Descriptions.Item label="主要品类">{renderTags((auditingShop as any).mainCategories)}</Descriptions.Item>
              <Descriptions.Item label="主要IP">{renderTags((auditingShop as any).mainIps, 'blue')}</Descriptions.Item>
            </Descriptions>
            {auditFiles.length > 0 && (<div style={{ marginBottom: 16 }}><div style={{ fontWeight: 500, marginBottom: 8, fontSize: 16 }}>资质文件</div>{renderFiles(auditFiles)}</div>)}
            <Form form={auditForm} layout="vertical">
              <Form.Item name="auditNotes" label="驳回原因" rules={[{ required: true, message: '请输入驳回原因' }]}>
                <Input.TextArea rows={4} placeholder="请输入驳回原因（驳回时必填）" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MerchantList;
