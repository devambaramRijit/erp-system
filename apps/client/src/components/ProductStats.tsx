import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { Package, Boxes, Wallet } from 'lucide-react';

interface ProductStatsProps {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
}

const ProductStats: React.FC<ProductStatsProps> = ({ totalProducts, totalStock, totalValue }) => {
  return (
    <Row gutter={16} className="mb-6">
      <Col xs={24} sm={12} md={8}>
        <Card bordered={false}>
          <Statistic
            title="Total Products"
            value={totalProducts}
            prefix={<Package className="text-gray-500" />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card bordered={false}>
          <Statistic
            title="Total Stock Quantity"
            value={totalStock}
            prefix={<Boxes className="text-gray-500" />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card bordered={false}>
          <Statistic
            title="Total Inventory Value"
            value={totalValue}
            prefix="₹"
            precision={2}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProductStats;