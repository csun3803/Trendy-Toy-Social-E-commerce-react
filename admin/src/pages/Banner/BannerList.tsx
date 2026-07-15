import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  App,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Image,
  Switch,
  Upload,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  updateSortOrder,
  toggleBannerStatus,
  uploadImage,
  type Banner,
} from '../../services/banner';

const { Option } = Select;

const JUMP_TYPE_LABELS: Record<string, string> = {
  NONE: '无跳转',
  PRODUCT: '商品详情',
  ACTIVITY: '活动页面',
  BLIND_BOX: '抽盒机',
  EXTERNAL_LINK: '外部链接',
};

const JUMP_TYPE_PLACEHOLDERS: Record<string, string> = {
  NONE: '无需填写',
  PRODUCT: '请输入商品ID',
  ACTIVITY: '请输入活动ID',
  BLIND_BOX: '请输入抽盒机ID',
  EXTERNAL_LINK: '请输入完整URL（如 https://...）',
};

const BannerList: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  
  // 图片上传预览状态
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  // 拖拽状态
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [draggedRow, setDraggedRow] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await getAllBanners();
      if (response.code === 200 || response.message === 'success') {
        setBanners(response.data || []);
      } else {
        message.error('获取轮播图列表失败');
      }
    } catch (error) {
      console.error('获取轮播图列表失败', error);
      message.error('获取轮播图列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAdd = () => {
    setEditingBanner(null);
    setUploadedImageUrl('');
    form.resetFields();
    form.setFieldsValue({
      jumpType: 'NONE',
      sortOrder: banners.length,
      status: 'ENABLED',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Banner) => {
    setEditingBanner(record);
    const imageUrl = record.imageUrl?.startsWith('http') 
      ? record.imageUrl 
      : `http://localhost:8080${record.imageUrl}`;
    setUploadedImageUrl(imageUrl);
    form.setFieldsValue({
      title: record.title,
      imageUrl: record.imageUrl,
      sortOrder: record.sortOrder,
      jumpType: record.jumpType,
      jumpValue: record.jumpValue,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = (bannerId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该轮播图吗？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteBanner(bannerId);
          message.success('删除成功');
          fetchBanners();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleToggleStatus = async (bannerId: string) => {
    try {
      await toggleBannerStatus(bannerId);
      message.success('状态切换成功');
      fetchBanners();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 拖拽开始
  const handleDragStart = (index: number, record: Banner) => {
    setDragIndex(index);
    setDraggedRow(record);
  };

  // 拖拽进入
  const handleDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDropIndex(index);
  };

  // 拖拽结束
  const handleDragEnd = async () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      const newBanners = [...banners];
      const [draggedItem] = newBanners.splice(dragIndex, 1);
      newBanners.splice(dropIndex, 0, draggedItem);
      setBanners(newBanners);
      
      try {
        await updateSortOrder(newBanners.map((b) => b.bannerId));
        message.success('排序已更新');
      } catch (error) {
        message.error('排序更新失败');
        fetchBanners(); // 恢复原始顺序
      }
    }
    setDragIndex(null);
    setDropIndex(null);
    setDraggedRow(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data: Partial<Banner> = {
        title: values.title,
        imageUrl: values.imageUrl,
        sortOrder: values.sortOrder || 0,
        jumpType: values.jumpType || 'NONE',
        jumpValue: values.jumpValue || '',
        status: values.status || 'ENABLED',
      };

      if (editingBanner) {
        data.bannerId = editingBanner.bannerId;
        await updateBanner(data);
        message.success('编辑成功');
      } else {
        await createBanner(data);
        message.success('新增成功');
      }
      setModalVisible(false);
      fetchBanners();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(editingBanner ? '编辑失败' : '新增失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8080${url}`;
      form.setFieldValue('imageUrl', fullUrl);
      setUploadedImageUrl(fullUrl);
      message.success('上传成功');
    } catch (error) {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const columns = [
    {
      title: '',
      key: 'sort',
      width: 40,
      render: (_: any, record: Banner, index: number) => (
        <div
          draggable
          onDragStart={() => handleDragStart(index, record)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          style={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <HolderOutlined style={{ fontSize: 14, color: '#999' }} />
        </div>
      ),
    },
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url: string) => (
        <Image
          src={url?.startsWith('http') ? url : `http://localhost:8080${url}`}
          width={100}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: true,
    },
    {
      title: '跳转类型',
      dataIndex: 'jumpType',
      key: 'jumpType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'NONE' ? 'default' : 'blue'}>{JUMP_TYPE_LABELS[type] || type}</Tag>
      ),
    },
    {
      title: '跳转值',
      dataIndex: 'jumpValue',
      key: 'jumpValue',
      width: 200,
      ellipsis: true,
      render: (val: string, record: Banner) =>
        record.jumpType === 'NONE' ? '-' : val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: Banner) => (
        <Switch
          checked={status === 'ENABLED'}
          checkedChildren="上架"
          unCheckedChildren="下架"
          onChange={() => handleToggleStatus(record.bannerId)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Banner) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.bannerId)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const selectedJumpType = Form.useWatch('jumpType', form);

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="轮播图管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增轮播图
          </Button>
        }
      >
        <div style={{ marginBottom: 8, color: '#999', fontSize: 12 }}>
          提示：拖拽左侧图标可调整排序
        </div>
        <Table
          columns={columns}
          dataSource={banners}
          loading={loading}
          rowKey="bannerId"
          size="middle"
          pagination={false}
          onRow={(record: Banner, index: number) => ({
            onDragEnter: () => handleDragEnter(index as number),
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
            style: {
              opacity: dragIndex === index ? 0.3 : 1,
              backgroundColor: dropIndex === index && dragIndex !== index ? '#e6f7ff' : 'transparent',
              border: dropIndex === index && dragIndex !== index ? '2px dashed #1890ff' : 'none',
              transition: 'all 0.2s',
            },
          })}
        />
      </Card>

      <Modal
        title={editingBanner ? '编辑轮播图' : '新增轮播图'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="图片"
            rules={[{ required: true, message: '请上传图片' }]}
          >
            <Space align="start">
              {uploadedImageUrl && (
                <Image
                  src={uploadedImageUrl}
                  width={80}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
              )}
              <Upload
                beforeUpload={handleUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {uploading ? '上传中...' : '上传图片'}
                </Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} placeholder="数字越小越靠前" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="jumpType" label="跳转类型">
            <Select>
              <Option value="NONE">无跳转（仅展示）</Option>
              <Option value="PRODUCT">商品详情</Option>
              <Option value="ACTIVITY">活动页面</Option>
              <Option value="BLIND_BOX">抽盒机</Option>
              <Option value="EXTERNAL_LINK">外部链接</Option>
            </Select>
          </Form.Item>

          <Form.Item name="jumpValue" label="跳转值">
            <Input
              placeholder={JUMP_TYPE_PLACEHOLDERS[selectedJumpType] || '请输入跳转值'}
              disabled={selectedJumpType === 'NONE' || !selectedJumpType}
            />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select>
              <Option value="ENABLED">启用</Option>
              <Option value="DISABLED">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BannerList;