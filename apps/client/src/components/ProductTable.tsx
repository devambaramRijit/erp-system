import React, { useState } from 'react';
import { Table, Space, Tooltip, Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Product } from '../types/product'; // Assuming you have a product type definition

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete }) => {
  const [pageSize, setPageSize] = useState(10);
  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      sorter: (a: Product, b: Product) => a.sku.localeCompare(b.sku),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
    },
    {
      title: 'Category',
      dataIndex: 'productCategory',
      key: 'productCategory',
      sorter: (a: Product, b: Product) => a.productCategory.localeCompare(b.productCategory),
    },
    {
      title: 'Type',
      dataIndex: 'productType',
      key: 'productType',
      sorter: (a: Product, b: Product) => a.productType.localeCompare(b.productType),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: Product, b: Product) => a.quantity - b.quantity,
    },
    {
      title: 'Cost Price/Piece',
      dataIndex: 'costPricePerPiece',
      key: 'costPricePerPiece',
      render: (price?: number) => price != null ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.costPricePerPiece || 0) - (b.costPricePerPiece || 0),
    },
    {
      title: 'Rate/Piece',
      dataIndex: 'ratePerPiece',
      key: 'ratePerPiece',
      render: (price?: number) => price != null ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.ratePerPiece || 0) - (b.ratePerPiece || 0),
    },
    {
      title: 'Cost Price/Inch',
      dataIndex: 'costPricePerInch',
      key: 'costPricePerInch',
      render: (price?: number) => price != null ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.costPricePerInch || 0) - (b.costPricePerInch || 0),
    },
    {
      title: 'Rate/Inch',
      dataIndex: 'ratePerInch',
      key: 'ratePerInch',
      render: (price?: number) => price != null ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.ratePerInch || 0) - (b.ratePerInch || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={products}
      columns={columns}
      rowKey="id"
      rowClassName="cursor-pointer hover:bg-gray-50"
      pagination={{
        pageSize: pageSize,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
        onShowSizeChange: (current, size) => {
          setPageSize(size);
        },
        pageSizeOptions: ['10', '20', '50', '100']
      }}
      scroll={{ x: 1000 }}
    />
  );
};

export default ProductTable;