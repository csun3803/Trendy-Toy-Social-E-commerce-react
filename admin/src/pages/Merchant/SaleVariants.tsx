import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Tag, Space, App, Modal, Form, Input, Select, InputNumber, Image, Steps, Pagination, Checkbox, Divider, Popconfirm, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, ArrowRightOutlined, UploadOutlined } from '@ant-design/icons';
import { request, history, useParams } from '@umijs/max';

const { TextArea } = Input;
const { Option } = Select;

const API_BASE_URL = 'http://localhost:8080';

interface SaleVariant {
  saleVariantId: string;
  saleSeriesId: string;
  variantId: string;
  skuCode: string;
  salePrice: number;
  stockQuantity: number;
  saleStatus: string;
  customDescription: string;
  customImages: string;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SaleSeries {
  saleSeriesId: string;
  saleTitle: string;
  saleDescription: string;
  seriesId: string;
}

interface Product {
  productId: string;
  productName: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  productImages: string;
  variantType: string;
  rarity: string;
  status: string;
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

const parseImages = (imagesStr: string | null | undefined): string[] => {
  if (!imagesStr) return [];
  try {
    const parsed = JSON.parse(imagesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return imagesStr ? [imagesStr] : [];
  }
};

const SaleVariants: React.FC = () => {
  const { saleSeriesId } = useParams<{ saleSeriesId: string }>();
  const [variantList, setVariantList] = useState<SaleVariant[]>([]);
  const [saleSeries, setSaleSeries] = useState<SaleSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<SaleVariant | null>(null);
  const [shopId, setShopId] = useState<string>('');
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [productList, setProductList] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [existingVariantIds, setExistingVariantIds] = useState<Set<string>>(new Set());
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchSaleSeries = async () => {
    try {
      const token = localStorage.getItem('token');
      const merchantResponse = await request('/api/merchant/info/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (merchantResponse.code === 200 || merchantResponse.message === 'success') {
        setShopId(merchantResponse.data.shopId);
      }
      
      const response = await request(`/api/sale-series/${saleSeriesId}`);
      if (response.code === 200 || response.message === 'success') {
        setSaleSeries(response.data);
      }
    } catch (error) {
      console.error('Error fetching sale series:', error);
    }
  };

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await request(`/api/sale-variants/sale-series/${saleSeriesId}`);
      if (response.code === 200 || response.message === 'success') {
        setVariantList(response.data);
        const variantIds = new Set(response.data.map((v: SaleVariant) => v.variantId));
        setExistingVariantIds(variantIds);
      } else {
        message.error('获取销售款式失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      message.error('获取销售款式列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!saleSeries?.seriesId) return;
    
    setProductsLoading(true);
    try {
      const response = await request(`/api/series/${saleSeries.seriesId}`);
      if (response.code === 200 || response.message === 'success') {
        const products = response.data.products || [];
        const filteredProducts = products.filter(
          (p: Product) => !existingVariantIds.has(p.productId)
        );
        setProductList(filteredProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('获取图鉴款式失败');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (saleSeriesId) {
      fetchSaleSeries();
      fetchVariants();
    }
  }, [saleSeriesId]);

  useEffect(() => {
    if (isModalVisible && currentStep === 0 && saleSeries?.seriesId) {
      fetchProducts();
    }
  }, [isModalVisible, currentStep, saleSeries?.seriesId]);


  const columns = [
    {
      title: '图片',
      dataIndex: 'customImages',
      key: 'customImages',
      width: 60,
      render: (customImages: string) => {
        const images = parseImages(customImages);
        const firstImage = images.length > 0 ? images[0] : null;
        return (
          <Image
            width={36}
            height={36}
            src={getFullImageUrl(firstImage)}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60"
          />
        );
      },
    },
    {
      title: '款式名称',
      dataIndex: 'skuCode',
      key: 'skuCode',
    },
    {
      title: '价格',
      dataIndex: 'salePrice',
      key: 'salePrice',
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '¥0.00',
    },
    {
      title: '库存',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      render: (stock: number) => stock || 0,
    },
    {
      title: '销量',
      dataIndex: 'salesCount',
      key: 'salesCount',
      render: (salesCount: number) => salesCount || 0,
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
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: SaleVariant) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.saleVariantId)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const productColumns = [
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 60,
      render: (imageUrl: string, record: Product) => {
        const images = parseImages(record.productImages);
        const displayImage = images.length > 0 ? images[0] : imageUrl;
        return (
          <Image
            width={36}
            height={36}
            src={getFullImageUrl(displayImage)}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60"
          />
        );
      },
    },
    {
      title: '款式名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '类型',
      dataIndex: 'variantType',
      key: 'variantType',
      render: (type: string) => {
        const text = type === 'hidden' ? '隐藏款' : '常规款';
        const color = type === 'hidden' ? 'purple' : 'blue';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      key: 'rarity',
      render: (rarity: string) => {
        if (!rarity) return '-';
        const colorMap: Record<string, string> = {
          common: 'default',
          rare: 'blue',
          secret: 'gold',
        };
        const textMap: Record<string, string> = {
          common: '普通',
          rare: '稀有',
          secret: '隐藏',
        };
        return <Tag color={colorMap[rarity] || 'default'}>{textMap[rarity] || rarity}</Tag>;
      },
    },
    {
      title: '参考价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'ACTIVE' ? 'green' : 'default';
        return <Tag color={color}>{status === 'ACTIVE' ? '在售' : status}</Tag>;
      },
    },
  ];

  const handleSelectProduct = (product: Product, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, product]);
    } else {
      setSelectedProducts(selectedProducts.filter(p => p.productId !== product.productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts([...productList]);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleNextStep = () => {
    if (selectedProducts.length === 0) {
      message.warning('请至少选择一个款式');
      return;
    }
    setCurrentStep(1);
  };

  const handleAdd = () => {
    setEditingVariant(null);
    setSelectedProducts([]);
    setCurrentStep(0);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: SaleVariant) => {
    setEditingVariant(record);
    setCurrentStep(1);
    let customImages = '';
    try {
      const images = JSON.parse(record.customImages);
      customImages = images && images.length > 0 ? images[0] : '';
    } catch (error) {
      customImages = '';
    }
    form.setFieldsValue({
      ...record,
      skuCode: record.skuCode,
      customDescription: record.customDescription || '',
      customImages: customImages,
      salePrice: record.salePrice,
      stockQuantity: record.stockQuantity,
      saleStatus: record.saleStatus
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (variantId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个销售款式吗？',
      onOk: async () => {
        try {
          const response = await request(`/api/sale-variants/${variantId}`, { method: 'DELETE' });
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchVariants();
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
      message.warning('请先选择要删除的销售款式');
      return;
    }
    
    Modal.confirm({
      title: '确认批量删除',
      content: `您确定要删除选中的 ${selectedRowKeys.length} 个销售款式吗？`,
      onOk: async () => {
        try {
          const deletePromises = selectedRowKeys.map(id => 
            request(`/api/sale-variants/${id}`, { method: 'DELETE' })
          );
          const results = await Promise.all(deletePromises);
          const failedCount = results.filter(r => r.code !== 200 && r.message !== 'success').length;
          
          if (failedCount === 0) {
            message.success(`成功删除 ${selectedRowKeys.length} 个销售款式`);
          } else {
            message.warning(`删除完成，${failedCount} 个失败`);
          }
          setSelectedRowKeys([]);
          fetchVariants();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      if (editingVariant) {
        const values = await form.validateFields();
        const data = {
          ...values,
          saleSeriesId,
          shopId,
          salePrice: values.salePrice,
          stockQuantity: values.stockQuantity,
          saleStatus: values.saleStatus,
          customImages: JSON.stringify([values.customImages])
        };
        const response = await request(`/api/sale-variants/${editingVariant.saleVariantId}`, {
          method: 'PUT',
          data,
        });
        if (response.code === 200 || response.message === 'success') {
          message.success('更新成功');
          setIsModalVisible(false);
          fetchVariants();
        } else {
          message.error('操作失败: ' + (response.message || '未知错误'));
        }
      } else {
        const values = await form.validateFields();
        const createPromises = selectedProducts.map(async (product, index) => {
          const variantData = {
            saleSeriesId,
            shopId,
            variantId: product.productId,
            skuCode: product.productName,
            salePrice: values[`salePrice_${index}`] || product.price || 0,
            stockQuantity: values[`stockQuantity_${index}`] || 0,
            saleStatus: values[`saleStatus_${index}`] || 'INACTIVE',
            customDescription: values[`customDescription_${index}`] || product.description || '',
            customImages: JSON.stringify([values[`customImages_${index}`] || product.imageUrl || '']),
          };
          return request('/api/sale-variants', {
            method: 'POST',
            data: variantData,
          });
        });

        const results = await Promise.all(createPromises);
        const failedCount = results.filter(r => r.code !== 200 && r.message !== 'success').length;
        
        if (failedCount === 0) {
          message.success(`成功添加 ${selectedProducts.length} 个销售款式`);
          setIsModalVisible(false);
          fetchVariants();
        } else {
          message.warning(`添加完成，${failedCount} 个失败`);
          setIsModalVisible(false);
          fetchVariants();
        }
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/merchant/products/list')}>
              返回
            </Button>
            <span>{saleSeries?.saleTitle || '销售款式管理'}</span>
          </Space>
        }
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定删除选中的 ${selectedRowKeys.length} 个销售款式吗？`}
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
              添加销售款式
            </Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={variantList} 
          loading={loading} 
          rowKey="saleVariantId"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />
      </Card>

      <Modal
        title={editingVariant ? '编辑销售款式' : '添加销售款式'}
        open={isModalVisible}
        onOk={currentStep === 0 && !editingVariant ? handleNextStep : handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={900}
        okText={currentStep === 0 && !editingVariant ? '下一步' : '确定'}
      >
        {!editingVariant && (
          <Steps
            current={currentStep}
            items={[
              { title: '选择图鉴款式' },
              { title: '设置销售信息' },
            ]}
            style={{ marginBottom: 24 }}
          />
        )}

        {currentStep === 0 && !editingVariant ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={selectedProducts.length === productList.length && productList.length > 0}
                indeterminate={selectedProducts.length > 0 && selectedProducts.length < productList.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选 ({selectedProducts.length}/{productList.length})
              </Checkbox>
            </div>
            <Table
              columns={[
                {
                  title: '选择',
                  key: 'select',
                  width: 60,
                  render: (_: any, record: Product) => (
                    <Checkbox
                      checked={selectedProducts.some(p => p.productId === record.productId)}
                      onChange={(e) => handleSelectProduct(record, e.target.checked)}
                    />
                  ),
                },
                ...productColumns,
              ]}
              dataSource={productList}
              loading={productsLoading}
              rowKey="productId"
              pagination={false}
              size="middle"
              onRow={(record) => ({
                onClick: () => {
                  const isSelected = selectedProducts.some(p => p.productId === record.productId);
                  handleSelectProduct(record, !isSelected);
                },
              })}
            />
            {selectedProducts.length > 0 && (
              <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <Space>
                  <span>已选择 <strong>{selectedProducts.length}</strong> 个款式</span>
                  <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNextStep}>
                    下一步
                  </Button>
                </Space>
              </div>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            {editingVariant ? (
              <>
                <Form.Item
                  name="skuCode"
                  label="款式名称"
                  rules={[{ required: true, message: '请输入款式名称' }]}
                >
                  <Input placeholder="请输入款式名称" />
                </Form.Item>
                <Form.Item
                  name="customDescription"
                  label="款式描述"
                >
                  <TextArea rows={4} placeholder="请输入款式描述" />
                </Form.Item>
                <Form.Item
                  name="customImages"
                  label="款式图片"
                >
                  <Upload
                    name="file"
                    action={`${API_BASE_URL}/api/upload/image?type=product`}
                    listType="picture-card"
                    maxCount={1}
                    headers={{
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    }}
                    onChange={(info) => {
                      if (info.file.status === 'done') {
                        const url = info.file.response?.data?.url;
                        if (url) {
                          form.setFieldValue('customImages', url);
                        }
                      } else if (info.file.status === 'error') {
                        message.error('上传失败');
                      }
                    }}
                    onRemove={() => {
                      form.setFieldValue('customImages', undefined);
                    }}
                  >
                    {form.getFieldValue('customImages') ? (
                      <Image
                        src={getFullImageUrl(form.getFieldValue('customImages'))}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        preview={false}
                      />
                    ) : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>上传</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
                <Form.Item
                  name="salePrice"
                  label="价格"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    placeholder="请输入价格"
                    prefix="¥"
                  />
                </Form.Item>
                <Form.Item
                  name="stockQuantity"
                  label="库存"
                  rules={[{ required: true, message: '请输入库存' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={0}
                    placeholder="请输入库存"
                  />
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
              </>
            ) : (
              <>
                {selectedProducts.map((product, index) => (
                  <div key={product.productId} style={{ marginBottom: 24, padding: 16, border: '1px solid #d9d9d9', borderRadius: 8 }}>
                    <div style={{ marginBottom: 12, fontWeight: 'bold', fontSize: 16 }}>
                      {index + 1}. {product.productName}
                      <Tag color={product.variantType === 'hidden' ? 'purple' : 'blue'} style={{ marginLeft: 8 }}>
                        {product.variantType === 'hidden' ? '隐藏款' : '常规款'}
                      </Tag>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Form.Item
                        name={`salePrice_${index}`}
                        label="售价"
                        initialValue={product.price}
                        rules={[{ required: true, message: '请输入价格' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder="请输入价格"
                          prefix="¥"
                        />
                      </Form.Item>
                      <Form.Item
                        name={`stockQuantity_${index}`}
                        label="库存"
                        initialValue={0}
                        rules={[{ required: true, message: '请输入库存' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={0}
                          placeholder="请输入库存"
                        />
                      </Form.Item>
                      <Form.Item
                        name={`customImages_${index}`}
                        label="图片"
                        initialValue={(() => {
                          const images = parseImages(product.productImages);
                          return images.length > 0 ? images[0] : product.imageUrl || '';
                        })()}
                      >
                        <Upload
                          name="file"
                          action={`${API_BASE_URL}/api/upload/image?type=product`}
                          listType="picture-card"
                          maxCount={1}
                          headers={{
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                          }}
                          onChange={(info) => {
                            if (info.file.status === 'done') {
                              const url = info.file.response?.data?.url;
                              if (url) {
                                form.setFieldValue(`customImages_${index}`, url);
                              }
                            } else if (info.file.status === 'error') {
                              message.error('上传失败');
                            }
                          }}
                          onRemove={() => {
                            form.setFieldValue(`customImages_${index}`, undefined);
                          }}
                        >
                          {form.getFieldValue(`customImages_${index}`) ? (
                            <Image
                              src={getFullImageUrl(form.getFieldValue(`customImages_${index}`))}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              preview={false}
                            />
                          ) : (
                            <div>
                              <UploadOutlined />
                              <div style={{ marginTop: 8 }}>上传</div>
                            </div>
                          )}
                        </Upload>
                      </Form.Item>
                      <Form.Item
                        name={`saleStatus_${index}`}
                        label="状态"
                        initialValue="INACTIVE"
                        rules={[{ required: true, message: '请选择状态' }]}
                      >
                        <Select placeholder="请选择状态">
                          <Option value="ACTIVE">上架</Option>
                          <Option value="INACTIVE">下架</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name={`customDescription_${index}`}
                        label="描述"
                        initialValue={product.description || ''}
                        style={{ gridColumn: 'span 2' }}
                      >
                        <TextArea rows={2} placeholder="请输入款式描述" />
                      </Form.Item>
                    </div>
                  </div>
                ))}
              </>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default SaleVariants;
