import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Tag, Space, App, Modal, Form, Input, Select, Image, Steps, Row, Col, Pagination, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { request, history } from '@umijs/max';

const { TextArea } = Input;
const { Option } = Select;

const API_BASE_URL = 'http://localhost:8080';

interface SaleSeries {
  saleSeriesId: string;
  shopId: string;
  seriesId: string;
  saleTitle: string;
  saleDescription: string;
  saleCoverImage: string;
  saleStatus: string;
  variantCount: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

interface Series {
  seriesId: string;
  seriesName: string;
  theme: string;
  description: string;
  coverImage: string;
  regularVariants: number;
  hiddenVariants: number;
  totalVariants: number;
  isLimited: boolean;
  status: string;
  seriesHotness: number;
}

const getFullImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return 'https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const SaleSeries: React.FC = () => {
  const [saleSeriesList, setSaleSeriesList] = useState<SaleSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSeries, setEditingSeries] = useState<SaleSeries | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [seriesKeyword, setSeriesKeyword] = useState('');
  const [seriesPage, setSeriesPage] = useState(1);
  const [seriesTotal, setSeriesTotal] = useState(0);
  const [shopId, setShopId] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchSaleSeries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await request('/api/merchant/info/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.code === 200 || response.message === 'success') {
        const id = response.data.shopId;
        setShopId(id);
        
        const seriesResponse = await request(`/api/sale-series/shop/${id}`);
        
        if (seriesResponse.code === 200 || seriesResponse.message === 'success') {
          setSaleSeriesList(seriesResponse.data);
        } else {
          message.error('获取销售系列失败: ' + (seriesResponse.message || '未知错误'));
        }
      } else {
        message.error('获取商家信息失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('Error fetching sale series:', error);
      message.error('获取销售系列列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeriesList = async (page: number = 1, keyword: string = '') => {
    setSeriesLoading(true);
    try {
      const response = await request(`/api/series`, {
        params: { page, size: 8, keyword }
      });
      
      if (response.code === 200 || response.message === 'success') {
        setSeriesList(response.data.records || []);
        setSeriesTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      message.error('获取图鉴系列失败');
    } finally {
      setSeriesLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleSeries();
  }, []);

  useEffect(() => {
    if (isModalVisible && currentStep === 0) {
      fetchSeriesList(1, seriesKeyword);
    }
  }, [isModalVisible, currentStep]);

  const columns = [
    {
      title: '封面',
      dataIndex: 'saleCoverImage',
      key: 'saleCoverImage',
      width: 100,
      render: (image: string) => (
        <Image
          width={60}
          height={60}
          src={getFullImageUrl(image)}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60"
        />
      ),
    },
    {
      title: '销售标题',
      dataIndex: 'saleTitle',
      key: 'saleTitle',
    },
    {
      title: '款式数量',
      dataIndex: 'variantCount',
      key: 'variantCount',
    },
    {
      title: '总销量',
      dataIndex: 'totalSales',
      key: 'totalSales',
    },
    {
      title: '状态',
      dataIndex: 'saleStatus',
      key: 'saleStatus',
      render: (status: string) => {
        let color = status === 'ACTIVE' ? 'green' : status === 'INACTIVE' ? 'orange' : 'red';
        return <Tag color={color}>{status === 'ACTIVE' ? '上架' : status === 'INACTIVE' ? '下架' : '禁用'}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SaleSeries) => (
        <Space size="middle">
          <Button type="link" icon={<SettingOutlined />} onClick={() => handleManage(record.saleSeriesId)}>管理</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.saleSeriesId)}>删除</Button>
        </Space>
      ),
    },
  ];

  const seriesColumns = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 80,
      render: (image: string) => (
        <Image
          width={50}
          height={50}
          src={getFullImageUrl(image)}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60"
        />
      ),
    },
    {
      title: '系列名称',
      dataIndex: 'seriesName',
      key: 'seriesName',
    },
    {
      title: '主题',
      dataIndex: 'theme',
      key: 'theme',
    },
    {
      title: '款式数量',
      dataIndex: 'totalVariants',
      key: 'totalVariants',
      render: (_: any, record: Series) => `${record.regularVariants || 0}常规 + ${record.hiddenVariants || 0}隐藏`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'ACTIVE' ? 'green' : 'default';
        return <Tag color={color}>{status === 'ACTIVE' ? '已发布' : status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Series) => (
        <Button 
          type={selectedSeries?.seriesId === record.seriesId ? 'primary' : 'default'}
          size="small"
          onClick={() => handleSelectSeries(record)}
        >
          {selectedSeries?.seriesId === record.seriesId ? '已选择' : '选择'}
        </Button>
      ),
    },
  ];

  const handleSelectSeries = (series: Series) => {
    setSelectedSeries(series);
  };

  const handleNextStep = () => {
    if (!selectedSeries) {
      message.warning('请先选择一个图鉴系列');
      return;
    }
    setCurrentStep(1);
    form.setFieldsValue({
      seriesId: selectedSeries.seriesId,
      saleTitle: selectedSeries.seriesName,
      saleDescription: selectedSeries.description || '',
      saleCoverImage: selectedSeries.coverImage || '',
      saleStatus: 'INACTIVE',
    });
  };

  const handleAdd = () => {
    setEditingSeries(null);
    setSelectedSeries(null);
    setCurrentStep(0);
    form.resetFields();
    setSeriesKeyword('');
    setSeriesPage(1);
    setIsModalVisible(true);
  };

  const handleEdit = (record: SaleSeries) => {
    setEditingSeries(record);
    setCurrentStep(1);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleManage = (saleSeriesId: string) => {
    history.push(`/merchant/products/variants/${saleSeriesId}`);
  };

  const handleDelete = async (saleSeriesId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个销售系列吗？',
      onOk: async () => {
        try {
          const response = await request(`/api/sale-series/${saleSeriesId}`, { method: 'DELETE' });
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchSaleSeries();
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的销售系列');
      return;
    }
    
    Modal.confirm({
      title: '确认批量删除',
      content: `您确定要删除选中的 ${selectedRowKeys.length} 个销售系列吗？`,
      onOk: async () => {
        try {
          const deletePromises = selectedRowKeys.map(id => 
            request(`/api/sale-series/${id}`, { method: 'DELETE' })
          );
          const results = await Promise.all(deletePromises);
          const failedCount = results.filter(r => r.code !== 200 && r.message !== 'success').length;
          
          if (failedCount === 0) {
            message.success(`成功删除 ${selectedRowKeys.length} 个销售系列`);
          } else {
            message.warning(`删除完成，${failedCount} 个失败`);
          }
          setSelectedRowKeys([]);
          fetchSaleSeries();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        shopId: shopId,
      };
      
      let response;
      if (editingSeries) {
        response = await request(`/api/sale-series/${editingSeries.saleSeriesId}`, {
          method: 'PUT',
          data,
        });
      } else {
        response = await request('/api/sale-series', {
          method: 'POST',
          data,
        });
      }
      if (response.code === 200 || response.message === 'success') {
        message.success(editingSeries ? '更新成功' : '创建成功');
        setIsModalVisible(false);
        fetchSaleSeries();
        
        if (!editingSeries && selectedSeries) {
          Modal.confirm({
            title: '添加销售款式',
            content: '销售系列创建成功！是否立即添加销售款式？',
            okText: '去添加',
            cancelText: '稍后再说',
            onOk: () => {
              history.push(`/merchant/products/variants/${response.data.saleSeriesId}`);
            },
          });
        }
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSeriesSearch = (value: string) => {
    setSeriesKeyword(value);
    setSeriesPage(1);
    fetchSeriesList(1, value);
  };

  const handleSeriesPageChange = (page: number) => {
    setSeriesPage(page);
    fetchSeriesList(page, seriesKeyword);
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="销售系列管理"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定删除选中的 ${selectedRowKeys.length} 个销售系列吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加销售系列
            </Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={saleSeriesList} 
          loading={loading} 
          rowKey="saleSeriesId"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />
      </Card>

      <Modal
        title={editingSeries ? '编辑销售系列' : '添加销售系列'}
        open={isModalVisible}
        onOk={currentStep === 0 && !editingSeries ? handleNextStep : handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText={currentStep === 0 && !editingSeries ? '下一步' : '确定'}
      >
        {!editingSeries && (
          <Steps
            current={currentStep}
            items={[
              { title: '选择图鉴系列' },
              { title: '填写销售信息' },
            ]}
            style={{ marginBottom: 24 }}
          />
        )}

        {currentStep === 0 && !editingSeries ? (
          <div>
            <Input.Search
              placeholder="搜索图鉴系列"
              allowClear
              onSearch={handleSeriesSearch}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={seriesColumns}
              dataSource={seriesList}
              loading={seriesLoading}
              rowKey="seriesId"
              pagination={false}
              size="small"
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedSeries ? [selectedSeries.seriesId] : [],
                onChange: (selectedRowKeys, selectedRows) => {
                  setSelectedSeries(selectedRows[0]);
                },
              }}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedSeries(record);
                },
              })}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Pagination
                current={seriesPage}
                pageSize={8}
                total={seriesTotal}
                onChange={handleSeriesPageChange}
                showSizeChanger={false}
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
            {selectedSeries && (
              <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <Space>
                  <span>已选择: <strong>{selectedSeries.seriesName}</strong></span>
                  <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNextStep}>
                    下一步
                  </Button>
                </Space>
              </div>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item name="seriesId" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name="saleTitle"
              label="销售标题"
              rules={[{ required: true, message: '请输入销售标题' }]}
            >
              <Input placeholder="请输入销售标题" />
            </Form.Item>
            <Form.Item
              name="saleDescription"
              label="销售描述"
            >
              <TextArea rows={4} placeholder="请输入销售描述" />
            </Form.Item>
            <Form.Item
              name="saleCoverImage"
              label="封面图片"
            >
              <Input placeholder="请输入封面图片URL" />
            </Form.Item>
            <Form.Item
              name="saleStatus"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="ACTIVE">上架</Option>
                <Option value="INACTIVE">下架</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default SaleSeries;
