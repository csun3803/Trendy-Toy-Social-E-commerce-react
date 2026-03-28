import React from 'react';
import { Card, Button, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const Products: React.FC = () => {
  // 模拟产品数据
  const products = [
    {
      key: '1',
      name: '玩具车',
      price: 99,
      stock: 100,
      status: '上架',
    },
    {
      key: '2',
      name: '洋娃娃',
      price: 199,
      stock: 50,
      status: '上架',
    },
    {
      key: '3',
      name: '积木',
      price: 299,
      stock: 200,
      status: '下架',
    },
  ];

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <div>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small">删除</Button>
        </div>
      ),
    },
  ];

  const handleAddProduct = () => {
    message.info('添加产品功能');
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="产品管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
            添加产品
          </Button>
        }
      >
        <Table columns={columns} dataSource={products} />
      </Card>
    </div>
  );
};

export default Products;