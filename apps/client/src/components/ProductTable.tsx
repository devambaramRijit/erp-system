import React, { useState } from 'react';
import { Table, Space, Tooltip, Button } from 'antd';
import { EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { Product } from '../types/product'; // Assuming you have a product type definition

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onSelectionChange: (selectedRowKeys: React.Key[]) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete, onDuplicate, onSelectionChange }) => {
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const columns = [
    {
      title: 'S.No.',
      key: 'sno',
      render: (_: any, record: Product, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      sorter: (a: Product, b: Product) => (a.sku || '').localeCompare(b.sku || ''),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Product, b: Product) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Category',
      dataIndex: 'productCategory',
      key: 'productCategory',
      sorter: (a: Product, b: Product) => (a.productCategory || '').localeCompare(b.productCategory || ''),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      sorter: (a: Product, b: Product) => (a.size || '').localeCompare(b.size || ''),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      sorter: (a: Product, b: Product) => (a.unit || '').localeCompare(b.unit || ''),
    },
    {
      title: 'Type',
      dataIndex: 'productType',
      key: 'productType',
      sorter: (a: Product, b: Product) => (a.productType || '').localeCompare(b.productType || ''),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: Product, b: Product) => (a.quantity || 0) - (b.quantity || 0),
    },
    {
      title: 'Cost Price/Piece',
      dataIndex: 'costPricePerPiece',
      key: 'costPricePerPiece',
      render: (price?: number) => (price != null && price > 0) ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.costPricePerPiece || 0) - (b.costPricePerPiece || 0),
    },
    {
      title: 'Rate/Piece',
      dataIndex: 'ratePerPiece',
      key: 'ratePerPiece',
      render: (price?: number) => (price != null && price > 0) ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.ratePerPiece || 0) - (b.ratePerPiece || 0),
    },
    {
      title: 'Cost Price/Inch',
      dataIndex: 'costPricePerInch',
      key: 'costPricePerInch',
      render: (price?: number) => (price != null && price > 0) ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.costPricePerInch || 0) - (b.costPricePerInch || 0),
    },
    {
      title: 'Rate/Inch',
      dataIndex: 'ratePerInch',
      key: 'ratePerInch',
      render: (price?: number) => (price != null && price > 0) ? `₹${price.toFixed(2)}` : '-',
      sorter: (a: Product, b: Product) => (a.ratePerInch || 0) - (b.ratePerInch || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => onDuplicate(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[]) => {
      onSelectionChange(selectedRowKeys);
    },
  };

  return (
    <Table
      rowSelection={rowSelection}
      dataSource={products}
      columns={columns}
      rowKey="id"
      rowClassName="cursor-pointer hover:bg-gray-50"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        onChange: (page, size) => {
          setCurrentPage(page);
          if (size) {
            setPageSize(size);
          }
        },
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
        pageSizeOptions: ['20', '50', '100', '500', '1000', '1500', '2000', '3000']
      }}
      scroll={{ x: 1000 }}
    />
  );
};

export default ProductTable;