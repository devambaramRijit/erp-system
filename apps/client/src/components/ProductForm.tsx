import React from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Space, Button } from 'antd';

const { Option } = Select;

interface ProductFormProps {
  form: any;
  onFinish: (values: any) => void;
  onCancel: () => void;
  isEditing: boolean;
  productCategories: string[];
}

const ProductForm: React.FC<ProductFormProps> = ({ form, onFinish, onCancel, isEditing, productCategories }) => {
  const productType = Form.useWatch('productType', form);
  const productCategory = Form.useWatch('productCategory', form);

  const isPieceBasedDisabled = productType === 'Manufactured' && ['Laddu Gopal Base', 'RK Base', 'Mata Rani Base', 'Ganesh Lakshmi Base', 'Shyam Baba Base'].includes(productCategory);
  const isInchBasedDisabled = productType === 'Traded' || (productType === 'Manufactured' && productCategory === 'Laddu Gopal Mukut');

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ productType: 'Traded' }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Product Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Product Type" name="productType" rules={[{ required: true }]}>
            <Select>
              <Option value="Traded">Traded</Option>
              <Option value="Manufactured">Manufactured</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Product Category" name="productCategory" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select or type a new category">
              <Option value="Mata Rani Base">Mata Rani Base</Option>
              <Option value="Laddu Gopal Base">Laddu Gopal Base</Option>
              <Option value="Laddu Gopal Mukut">Laddu Gopal Mukut</Option>
              <Option value="Laddu Gopal Accessories">Laddu Gopal Accessories</Option>
              <Option value="Ganesh Lakhsmi Base">Ganesh Lakhsmi Base</Option>
              <Option value="Booti">Booti</Option>
              <Option value="Others">Others</Option>
              <Option value="Laces">Laces</Option>
              <Option value="Fabric">Fabric</Option>
              {productCategories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Quantity" name="quantity">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Cost Price per Piece" name="costPricePerPiece">
            <InputNumber style={{ width: '100%' }} prefix="₹" disabled={isPieceBasedDisabled} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Rate per Piece" name="ratePerPiece">
            <InputNumber style={{ width: '100%' }} prefix="₹" disabled={isPieceBasedDisabled} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Cost Price per Inch" name="costPricePerInch">
            <InputNumber style={{ width: '100%' }} prefix="₹" disabled={isInchBasedDisabled} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Rate per Inch" name="ratePerInch">
            <InputNumber style={{ width: '100%' }} prefix="₹" disabled={isInchBasedDisabled} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Size" name="size">
            <Input style={{ width: '100%' }} placeholder="e.g., S, M, L, or numeric value" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Unit" name="unit" initialValue="pcs">
            <Select>
              <Option value="pcs">Pieces</Option>
              <Option value="kg">Kilogram</Option>
              <Option value="g">Gram</Option>
              <Option value="l">Liter</Option>
              <Option value="ml">Milliliter</Option>
              <Option value="m">Meter</Option>
              <Option value="cm">Centimeter</Option>
              <Option value="set">Set</Option>
              <Option value="dozen">Dozen</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item className="flex justify-end mt-4 mb-0">
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            {isEditing ? 'Update Product' : 'Add Product'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;