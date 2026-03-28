import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Tree,
  Table,
  Button,
  Space,
  App,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Image,
  Descriptions,
  Divider,
  Row,
  Col,
  Empty,
  Spin,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  GiftOutlined,
  SearchOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { request } from '@umijs/max';
import type { DataNode, TreeProps } from 'antd/es/tree';
import type { UploadProps, UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Option } = Select;

const API_BASE_URL = 'http://localhost:8080';

interface Album {
  id: string;
  name: string;
  img: string;
  shortDescription: string;
  copyrightOwner: string;
  creator: string;
  countryOrigin: string;
  isHotIp: boolean;
  creationTime: string;
}

interface AlbumDetail {
  albumId: string;
  ipName: string;
  shortDescription: string;
  copyrightOwner: string;
  logo: string;
  creationTime: string;
  creator: string;
  countryOrigin: string;
  isHotIp: boolean;
  auditStatus: string;
  seriesCount: number;
  totalVariants: number;
}

interface Series {
  seriesId: string;
  seriesName: string;
  totalVariants: number;
  hiddenVariants: number;
  regularVariants: number;
  coverImage: string;
  status: string;
}

interface SeriesDetail {
  seriesId: string;
  seriesName: string;
  ipAlbumId: string;
  ipName: string;
  theme: string;
  description: string;
  coverImage: string;
  regularVariants: number;
  hiddenVariants: number;
  totalVariants: number;
  isLimited: boolean;
  status: string;
  minPrice: number;
  fullsetPrice: number;
}

interface Product {
  productId: string;
  productName: string;
  price: number;
  stock: number;
  variantType: string;
  rarity: string;
  productImages: string;
  status: string;
  sortOrder: number;
}

const getFullImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/60x60?text=No+Image';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const AlbumList: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedType, setSelectedType] = useState<'album' | 'series' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [albumDetail, setAlbumDetail] = useState<AlbumDetail | null>(null);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seriesDetail, setSeriesDetail] = useState<SeriesDetail | null>(null);
  const [productList, setProductList] = useState<Product[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const [albumModalVisible, setAlbumModalVisible] = useState(false);
  const [seriesModalVisible, setSeriesModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumDetail | null>(null);
  const [editingSeries, setEditingSeries] = useState<SeriesDetail | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [albumForm] = Form.useForm();
  const [seriesForm] = Form.useForm();
  const [productForm] = Form.useForm();

  const { message, modal } = App.useApp();

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request('/api/admin/album/list');
      if (response.code === 200 || response.message === 'success') {
        setAlbums(response.data || []);
        buildTreeData(response.data || []);
      } else {
        message.error('获取IP列表失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('获取IP列表失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  const buildTreeData = useCallback(async (albumList: Album[]) => {
    const tree: DataNode[] = await Promise.all(
      albumList.map(async (album) => {
        let seriesData: Series[] = [];
        try {
          const response = await request(`/api/admin/album/${album.id}/series`);
          if (response.code === 200 || response.message === 'success') {
            seriesData = response.data || [];
          }
        } catch (e) {
          console.error('获取系列失败', e);
        }

        return {
          key: `album_${album.id}`,
          title: album.name,
          icon: <AppstoreOutlined />,
          children: seriesData.map((series) => ({
            key: `series_${series.seriesId}`,
            title: series.seriesName,
            icon: <GiftOutlined />,
            isLeaf: true,
          })),
        };
      })
    );

    const filteredTree = searchKeyword
      ? tree.filter((node) =>
          (node.title as string).toLowerCase().includes(searchKeyword.toLowerCase())
        )
      : tree;

    setTreeData(filteredTree);
  }, [searchKeyword]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleSelect: TreeProps['onSelect'] = async (selectedKeys) => {
    if (selectedKeys.length === 0) {
      setSelectedType(null);
      setSelectedId(null);
      setAlbumDetail(null);
      setSeriesList([]);
      setSeriesDetail(null);
      setProductList([]);
      return;
    }

    const key = selectedKeys[0] as string;
    const underscoreIndex = key.indexOf('_');
    const type = key.substring(0, underscoreIndex);
    const id = key.substring(underscoreIndex + 1);
    setSelectedType(type as 'album' | 'series');
    setSelectedId(id);

    setDetailLoading(true);
    try {
      if (type === 'album') {
        const [detailRes, seriesRes] = await Promise.all([
          request(`/api/admin/album/detail/${id}`),
          request(`/api/admin/album/${id}/series`),
        ]);

        if (detailRes.code === 200 || detailRes.message === 'success') {
          setAlbumDetail(detailRes.data);
        }
        if (seriesRes.code === 200 || seriesRes.message === 'success') {
          setSeriesList(seriesRes.data || []);
        }
        setSeriesDetail(null);
        setProductList([]);
      } else if (type === 'series') {
        const [detailRes, productsRes] = await Promise.all([
          request(`/api/admin/album/series/detail/${id}`),
          request(`/api/admin/album/series/${id}/products`),
        ]);

        if (detailRes.code === 200 || detailRes.message === 'success') {
          setSeriesDetail(detailRes.data);
          const albumId = detailRes.data?.ipAlbumId;
          if (albumId) {
            const albumDetailRes = await request(`/api/admin/album/detail/${albumId}`);
            if (albumDetailRes.code === 200 || albumDetailRes.message === 'success') {
              setAlbumDetail(albumDetailRes.data);
            }
          }
        }
        if (productsRes.code === 200 || productsRes.message === 'success') {
          setProductList(productsRes.data || []);
        }
        setSeriesList([]);
      }
    } catch (error) {
      message.error('获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = () => {
    buildTreeData(albums);
  };

  const handleRefresh = () => {
    setSearchKeyword('');
    fetchAlbums();
  };

  const handleAddAlbum = () => {
    setEditingAlbum(null);
    albumForm.resetFields();
    setAlbumModalVisible(true);
  };

  const handleEditAlbum = () => {
    if (albumDetail) {
      setEditingAlbum(albumDetail);
      albumForm.setFieldsValue(albumDetail);
      setAlbumModalVisible(true);
    }
  };

  const handleDeleteAlbum = () => {
    if (!albumDetail) return;
    modal.confirm({
      title: '确认删除',
      content: `确定要删除IP "${albumDetail.ipName}" 吗？`,
      onOk: async () => {
        try {
          const response = await request(`/api/admin/album/${albumDetail.albumId}`, {
            method: 'DELETE',
          });
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            setSelectedType(null);
            setSelectedId(null);
            setAlbumDetail(null);
            fetchAlbums();
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleAddSeries = () => {
    if (!albumDetail) {
      message.warning('请先选择一个IP');
      return;
    }
    setEditingSeries(null);
    seriesForm.resetFields();
    seriesForm.setFieldsValue({ ipAlbumId: albumDetail.albumId });
    setSeriesModalVisible(true);
  };

  const handleEditSeries = (series: Series) => {
    setEditingSeries({
      seriesId: series.seriesId,
      seriesName: series.seriesName,
      ipAlbumId: albumDetail?.albumId || '',
      ipName: albumDetail?.ipName || '',
      theme: '',
      description: '',
      coverImage: series.coverImage,
      regularVariants: series.regularVariants,
      hiddenVariants: series.hiddenVariants,
      totalVariants: series.totalVariants,
      isLimited: false,
      status: series.status,
      minPrice: 0,
      fullsetPrice: 0,
    });
    seriesForm.setFieldsValue({
      seriesId: series.seriesId,
      seriesName: series.seriesName,
      coverImage: series.coverImage,
      regularVariants: series.regularVariants,
      hiddenVariants: series.hiddenVariants,
      totalVariants: series.totalVariants,
      status: series.status,
    });
    setSeriesModalVisible(true);
  };

  const handleDeleteSeries = (series: Series) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除系列 "${series.seriesName}" 吗？`,
      onOk: async () => {
        try {
          const response = await request(`/api/admin/album/series/${series.seriesId}`, {
            method: 'DELETE',
          });
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            if (albumDetail) {
              const seriesRes = await request(`/api/admin/album/${albumDetail.albumId}/series`);
              if (seriesRes.code === 200 || seriesRes.message === 'success') {
                setSeriesList(seriesRes.data || []);
              }
            }
            fetchAlbums();
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleAddProduct = () => {
    if (!seriesDetail) {
      message.warning('请先选择一个系列');
      return;
    }
    setEditingProduct(null);
    productForm.resetFields();
    productForm.setFieldsValue({ seriesId: seriesDetail.seriesId });
    setProductModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.setFieldsValue(product);
    setProductModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除款式 "${product.productName}" 吗？`,
      onOk: async () => {
        try {
          const response = await request(`/api/admin/album/product/${product.productId}`, {
            method: 'DELETE',
          });
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            if (seriesDetail) {
              const productsRes = await request(
                `/api/admin/album/series/${seriesDetail.seriesId}/products`
              );
              if (productsRes.code === 200 || productsRes.message === 'success') {
                setProductList(productsRes.data || []);
              }
            }
          } else {
            message.error('删除失败: ' + (response.message || '未知错误'));
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleAlbumModalOk = async () => {
    try {
      const values = await albumForm.validateFields();
      let response;
      if (editingAlbum) {
        response = await request(`/api/admin/album/${editingAlbum.albumId}`, {
          method: 'PUT',
          data: values,
        });
      } else {
        response = await request('/api/admin/album', {
          method: 'POST',
          data: values,
        });
      }
      if (response.code === 200 || response.message === 'success') {
        message.success(editingAlbum ? '更新成功' : '创建成功');
        setAlbumModalVisible(false);
        fetchAlbums();
        if (editingAlbum && albumDetail) {
          const albumDetailRes = await request(`/api/admin/album/detail/${albumDetail.albumId}`);
          if (albumDetailRes.code === 200 || albumDetailRes.message === 'success') {
            setAlbumDetail(albumDetailRes.data);
          }
        }
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSeriesModalOk = async () => {
    try {
      const values = await seriesForm.validateFields();
      let response;
      if (editingSeries) {
        response = await request(`/api/admin/album/series/${editingSeries.seriesId}`, {
          method: 'PUT',
          data: values,
        });
      } else {
        response = await request(`/api/admin/album/${albumDetail?.albumId}/series`, {
          method: 'POST',
          data: values,
        });
      }
      if (response.code === 200 || response.message === 'success') {
        message.success(editingSeries ? '更新成功' : '创建成功');
        setSeriesModalVisible(false);
        if (albumDetail) {
          const seriesRes = await request(`/api/admin/album/${albumDetail.albumId}/series`);
          if (seriesRes.code === 200 || seriesRes.message === 'success') {
            setSeriesList(seriesRes.data || []);
          }
        }
        if (editingSeries && seriesDetail) {
          const detailRes = await request(`/api/admin/album/series/detail/${seriesDetail.seriesId}`);
          if (detailRes.code === 200 || detailRes.message === 'success') {
            setSeriesDetail(detailRes.data);
          }
        }
        fetchAlbums();
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleProductModalOk = async () => {
    try {
      const values = await productForm.validateFields();
      let response;
      if (editingProduct) {
        response = await request(`/api/admin/album/product/${editingProduct.productId}`, {
          method: 'PUT',
          data: values,
        });
      } else {
        response = await request(`/api/admin/album/series/${seriesDetail?.seriesId}/product`, {
          method: 'POST',
          data: values,
        });
      }
      if (response.code === 200 || response.message === 'success') {
        message.success(editingProduct ? '更新成功' : '创建成功');
        setProductModalVisible(false);
        if (seriesDetail) {
          const productsRes = await request(
            `/api/admin/album/series/${seriesDetail.seriesId}/products`
          );
          if (productsRes.code === 200 || productsRes.message === 'success') {
            setProductList(productsRes.data || []);
          }
        }
      } else {
        message.error('操作失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const seriesColumns = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 80,
      render: (img: string) => (
        <Image
          width={50}
          height={50}
          src={getFullImageUrl(img)}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://via.placeholder.com/50x50?text=No+Image"
        />
      ),
    },
    {
      title: '系列名称',
      dataIndex: 'seriesName',
      key: 'seriesName',
    },
    {
      title: '款式数',
      dataIndex: 'totalVariants',
      key: 'totalVariants',
      width: 80,
    },
    {
      title: '隐藏款',
      dataIndex: 'hiddenVariants',
      key: 'hiddenVariants',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>
          {status === 'ACTIVE' ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Series) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSeries(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSeries(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const productColumns = [
    {
      title: '图片',
      dataIndex: 'productImages',
      key: 'productImages',
      width: 80,
      render: (img: string) => (
        <Image
          width={50}
          height={50}
          src={getFullImageUrl(img)}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://via.placeholder.com/50x50?text=No+Image"
        />
      ),
    },
    {
      title: '款式名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${price || 0}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'variantType',
      key: 'variantType',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'hidden' ? 'red' : 'blue'}>
          {type === 'hidden' ? '隐藏款' : '常规款'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>
          {status === 'ACTIVE' ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Product) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditProduct(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProduct(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderAlbumDetail = () => (
    <Spin spinning={detailLoading}>
      {albumDetail ? (
        <>
          <Descriptions 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>IP详情</span>
                <Space>
                  <Button type="primary" icon={<EditOutlined />} onClick={handleEditAlbum}>
                    编辑IP
                  </Button>
                  <Button danger icon={<DeleteOutlined />} onClick={handleDeleteAlbum}>
                    删除IP
                  </Button>
                </Space>
              </div>
            }
            bordered 
            column={2} 
          >
            <Descriptions.Item label="Logo">
              {albumDetail.logo ? (
                <Image
                  src={getFullImageUrl(albumDetail.logo)}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                  placeholder
                />
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="IP名称">{albumDetail.ipName}</Descriptions.Item>
            <Descriptions.Item label="版权方">{albumDetail.copyrightOwner}</Descriptions.Item>
            <Descriptions.Item label="系列数量">{albumDetail.seriesCount}</Descriptions.Item>
            <Descriptions.Item label="款式总数">{albumDetail.totalVariants}</Descriptions.Item>
            <Descriptions.Item label="简介" span={2}>
              {albumDetail.shortDescription}
            </Descriptions.Item>
          </Descriptions>
          <Divider orientation="left" style={{ margin: '16px 0' }}>
            系列列表
          </Divider>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSeries}>
              新增系列
            </Button>
          </div>
          <Table
            columns={seriesColumns}
            dataSource={seriesList}
            rowKey="seriesId"
            size="small"
            pagination={false}
            locale={{ emptyText: '暂无系列' }}
          />
        </>
      ) : (
        <Empty description="请从左侧选择一个IP" />
      )}
    </Spin>
  );

  const renderSeriesDetail = () => (
    <Spin spinning={detailLoading}>
      {seriesDetail ? (
        <>
          <Descriptions 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>系列详情</span>
                <Space>
                  <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditSeries({
                    seriesId: seriesDetail.seriesId,
                    seriesName: seriesDetail.seriesName,
                    totalVariants: seriesDetail.totalVariants,
                    hiddenVariants: seriesDetail.hiddenVariants,
                    regularVariants: seriesDetail.regularVariants,
                    coverImage: seriesDetail.coverImage,
                    status: seriesDetail.status,
                  })}>
                    编辑系列
                  </Button>
                  <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteSeries({
                    seriesId: seriesDetail.seriesId,
                    seriesName: seriesDetail.seriesName,
                    totalVariants: seriesDetail.totalVariants,
                    hiddenVariants: seriesDetail.hiddenVariants,
                    regularVariants: seriesDetail.regularVariants,
                    coverImage: seriesDetail.coverImage,
                    status: seriesDetail.status,
                  })}>
                    删除系列
                  </Button>
                </Space>
              </div>
            }
            bordered 
            column={2} 
          >
            <Descriptions.Item label="封面">
              {seriesDetail.coverImage ? (
                <Image
                  src={getFullImageUrl(seriesDetail.coverImage)}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                  placeholder
                />
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="系列名称">{seriesDetail.seriesName}</Descriptions.Item>
            <Descriptions.Item label="所属IP">{seriesDetail.ipName}</Descriptions.Item>
            <Descriptions.Item label="款式总数">
              {seriesDetail.totalVariants}（常规{seriesDetail.regularVariants}，隐藏
              {seriesDetail.hiddenVariants}）
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={seriesDetail.status === 'ACTIVE' ? 'green' : 'orange'}>
                {seriesDetail.status === 'ACTIVE' ? '上架' : '下架'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="主题">{seriesDetail.theme || '-'}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {seriesDetail.description || '-'}
            </Descriptions.Item>
          </Descriptions>
          <Divider orientation="left" style={{ margin: '16px 0' }}>
            款式列表
          </Divider>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
              新增款式
            </Button>
          </div>
          <Table
            columns={productColumns}
            dataSource={productList}
            rowKey="productId"
            size="small"
            pagination={false}
            locale={{ emptyText: '暂无款式' }}
          />
        </>
      ) : (
        <Empty description="请从左侧选择一个系列" />
      )}
    </Spin>
  );

  return (
    <div style={{ padding: 6 }}>
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>图鉴管理</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAlbum}>
              新增IP
            </Button>
          </div>
        }
        style={{ marginBottom: 16 }} 
        styles={{ body: { display: 'none' } }}
      />

      <Row gutter={16}>
        <Col span={6}>
          <Card
            title="图鉴树"
            size="small"
            extra={
              <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh} />
            }
          >
            <Input
              placeholder="搜索IP"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              onBlur={handleSearch}
              style={{ marginBottom: 8 }}
            />
            <Spin spinning={loading}>
              <Tree
                treeData={treeData}
                onSelect={handleSelect}
                defaultExpandAll
                style={{ minHeight: 500, maxHeight: 700, overflow: 'auto' }}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={18}>
          <Card size="small">
            {selectedType === 'album' && renderAlbumDetail()}
            {selectedType === 'series' && renderSeriesDetail()}
            {!selectedType && (
              <Empty description="请从左侧选择IP或系列" style={{ minHeight: 500, paddingTop: 150 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingAlbum ? '编辑IP' : '新增IP'}
        open={albumModalVisible}
        onOk={handleAlbumModalOk}
        onCancel={() => setAlbumModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Form form={albumForm} layout="vertical">
          <Form.Item name="albumId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="ipName"
            label="IP名称"
            rules={[{ required: true, message: '请输入IP名称' }]}
          >
            <Input placeholder="请输入IP名称" />
          </Form.Item>
          <Form.Item name="shortDescription" label="简介">
            <TextArea rows={3} placeholder="请输入简介" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="copyrightOwner" label="版权方">
                <Input placeholder="请输入版权方" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="creator" label="创作者">
                <Input placeholder="请输入创作者" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="countryOrigin" label="原产国">
                <Input placeholder="请输入原产国" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="auditStatus" label="审核状态">
                <Select placeholder="请选择审核状态">
                  <Option value="已通过">已通过</Option>
                  <Option value="待审核">待审核</Option>
                  <Option value="已拒绝">已拒绝</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isHotIp" label="是否热门IP" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item 
            name="logo" 
            label="Logo图片"
          >
            <Upload
              name="file"
              action={`${API_BASE_URL}/api/upload/image?type=album`}
              listType="picture-card"
              maxCount={1}
              headers={{
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              }}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  const url = info.file.response?.data?.url;
                  if (url) {
                    albumForm.setFieldValue('logo', url);
                  }
                } else if (info.file.status === 'error') {
                  message.error('上传失败');
                }
              }}
              onRemove={() => {
                albumForm.setFieldValue('logo', undefined);
              }}
            >
              {albumForm.getFieldValue('logo') ? (
                <Image 
                  src={getFullImageUrl(albumForm.getFieldValue('logo'))} 
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
        </Form>
      </Modal>

      <Modal
        title={editingSeries ? '编辑系列' : '新增系列'}
        open={seriesModalVisible}
        onOk={handleSeriesModalOk}
        onCancel={() => setSeriesModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Form form={seriesForm} layout="vertical">
          <Form.Item name="seriesId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="ipAlbumId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="seriesName"
            label="系列名称"
            rules={[{ required: true, message: '请输入系列名称' }]}
          >
            <Input placeholder="请输入系列名称" />
          </Form.Item>
          <Form.Item name="theme" label="主题">
            <Input placeholder="请输入主题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item 
            name="coverImage" 
            label="封面图片"
          >
            <Upload
              name="file"
              action={`${API_BASE_URL}/api/upload/image?type=series`}
              listType="picture-card"
              maxCount={1}
              headers={{
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              }}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  const url = info.file.response?.data?.url;
                  if (url) {
                    seriesForm.setFieldValue('coverImage', url);
                  }
                } else if (info.file.status === 'error') {
                  message.error('上传失败');
                }
              }}
              onRemove={() => {
                seriesForm.setFieldValue('coverImage', undefined);
              }}
            >
              {seriesForm.getFieldValue('coverImage') ? (
                <Image 
                  src={getFullImageUrl(seriesForm.getFieldValue('coverImage'))} 
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
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="regularVariants" label="常规款数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="hiddenVariants" label="隐藏款数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="totalVariants" label="总款式数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minPrice" label="最低价格">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fullsetPrice" label="整套价格">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isLimited" label="是否限量" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              <Option value="ACTIVE">上架</Option>
              <Option value="INACTIVE">下架</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingProduct ? '编辑款式' : '新增款式'}
        open={productModalVisible}
        onOk={handleProductModalOk}
        onCancel={() => setProductModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Form form={productForm} layout="vertical">
          <Form.Item name="productId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="seriesId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="款式名称"
            rules={[{ required: true, message: '请输入款式名称' }]}
          >
            <Input placeholder="请输入款式名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="价格" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock" label="库存">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item 
            name="imageUrl" 
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
                    productForm.setFieldValue('imageUrl', url);
                  }
                } else if (info.file.status === 'error') {
                  message.error('上传失败');
                }
              }}
              onRemove={() => {
                productForm.setFieldValue('imageUrl', undefined);
              }}
            >
              {productForm.getFieldValue('imageUrl') ? (
                <Image 
                  src={getFullImageUrl(productForm.getFieldValue('imageUrl'))} 
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hiddenVariant" label="是否隐藏款" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="seriesOrder" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              <Option value="ACTIVE">上架</Option>
              <Option value="INACTIVE">下架</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlbumList;
