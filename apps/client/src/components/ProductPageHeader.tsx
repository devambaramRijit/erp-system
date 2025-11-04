import React from 'react';
import { Button, Space, Typography, Input, Tooltip } from 'antd';
import { PlusOutlined, DownloadOutlined, UploadOutlined, SearchOutlined, FileExcelOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ProductPageHeaderProps {
  onAddProduct: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  isImporting: boolean;
  searchTerm: string;
  onSearch: (value: string) => void;
}

const ProductPageHeader: React.FC<ProductPageHeaderProps> = ({
  onAddProduct,
  onImport,
  onDownloadTemplate,
  isImporting,
  searchTerm,
  onSearch,
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <Title level={3} className="mb-1">Product List</Title>
          <Text type="secondary">Manage your product inventory</Text>
        </div>
        <Space>
          <Tooltip title="Download Excel template for importing products">
            <Button onClick={onDownloadTemplate} icon={<FileExcelOutlined />} type="default" className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:text-green-800 hover:border-green-400">
              Download Template
            </Button>
          </Tooltip>
          <Tooltip title="Import products from Excel or CSV file">
            <Button onClick={onImport} loading={isImporting} icon={<UploadOutlined />} type="default" className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-400">
              {isImporting ? 'Importing...' : 'Import Products'}
            </Button>
          </Tooltip>
          <Button type="primary" onClick={onAddProduct} icon={<PlusOutlined />}>Add Product</Button>
        </Space>
      </div>
      <Input
        placeholder="Search by SKU, Name, or Category..."
        prefix={<SearchOutlined className="text-gray-400" />}
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        allowClear
        className="mb-6"
      />
    </>
  );
};

export default ProductPageHeader;