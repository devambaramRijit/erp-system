import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface Product {
  id: string;
  sku: string;
  name: string;
  productType: string;
  productCategory: string;
  quantity: number;
  price: number;
  costPricePerPiece?: number;
  ratePerPiece?: number;
  costPricePerInch?: number;
  ratePerInch?: number;
}

interface ProductFormProps {
  onProductAdded: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onProductAdded, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState('Traded');
  const [productCategory, setProductCategory] = useState('Other');

  // Handle product type change
  const handleProductTypeChange = (value: string) => {
    setProductType(value);
    
    // If product type is Traded, disable inch-based pricing
    if (value === 'Traded') {
      form.setFieldsValue({
        costPricePerInch: undefined,
        ratePerInch: undefined
      });
    }
  };

  // Handle product category change
  const handleProductCategoryChange = (value: string) => {
    setProductCategory(value);
    
    // If product is Laddu Gopal Base and type is Manufactured, disable piece-based pricing
    if (value === 'Laddu Gopal Base' && productType === 'Manufactured') {
      form.setFieldsValue({
        costPricePerPiece: undefined,
        ratePerPiece: undefined
      });
    }
    
    // If product is Laddu Gopal Mukut and type is Manufactured, disable inch-based pricing
    if (value === 'Laddu Gopal Mukut' && productType === 'Manufactured') {
      form.setFieldsValue({
        costPricePerInch: undefined,
        ratePerInch: undefined
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Create a new product object
      const newProduct: Product = {
        id: 'prod-' + Date.now() + Math.random(),
        sku: values.sku,
        name: values.name,
        productType: values.productType,
        productCategory: values.productCategory,
        quantity: values.quantity || 0,
        price: values.price || 0,
        costPricePerPiece: values.costPricePerPiece,
        ratePerPiece: values.ratePerPiece,
        costPricePerInch: values.costPricePerInch,
        ratePerInch: values.ratePerInch,
      };

      // Call the onProductAdded callback
      onProductAdded(newProduct);
      message.success('Product added successfully!');

      // Reset the form
      form.resetFields();
    } catch (error) {
      console.error('Error adding product:', error);
      message.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        productType: 'Traded',
        productCategory: 'Other',
        quantity: 0,
        price: 0,
      }}
    >
      <Form.Item
        name="sku"
        label="SKU"
        rules={[{ required: true, message: 'Please input SKU!' }]}
      >
        <Input placeholder="Enter SKU" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Product Name"
        rules={[{ required: true, message: 'Please input product name!' }]}
      >
        <Input placeholder="Enter product name" />
      </Form.Item>

      <Form.Item
        name="productType"
        label="Product Type"
        rules={[{ required: true, message: 'Please select product type!' }]}
      >
        <Select placeholder="Select product type" onChange={handleProductTypeChange}>
          <Select.Option value="Traded">Traded</Select.Option>
          <Select.Option value="Manufactured">Manufactured</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="productCategory"
        label="Product Category"
        rules={[{ required: true, message: 'Please select product category!' }]}
      >
        <Select placeholder="Select product category" onChange={handleProductCategoryChange}>
          <Select.Option value="Laddu Gopal Base">Laddu Gopal Base</Select.Option>
          <Select.Option value="Laddu Gopal Dress">Laddu Gopal Dress</Select.Option>
          <Select.Option value="Laddu Gopal Mukut">Laddu Gopal Mukut</Select.Option>
          <Select.Option value="Other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="quantity"
        label="Quantity"
        rules={[{ required: true, message: 'Please input quantity!' }]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="price"
        label="Price"
        rules={[{ required: true, message: 'Please input price!' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
        />
      </Form.Item>

      <Form.Item
        name="costPricePerPiece"
        label="Cost Price per Piece"
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
          disabled={productType === 'Manufactured' && productCategory === 'Laddu Gopal Base'}
        />
      </Form.Item>

      <Form.Item
        name="ratePerPiece"
        label="Rate per Piece"
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
          disabled={productType === 'Manufactured' && productCategory === 'Laddu Gopal Base'}
        />
      </Form.Item>

      <Form.Item
        name="costPricePerInch"
        label="Cost Price per Inch"
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
          disabled={productType === 'Traded' || (productType === 'Manufactured' && productCategory === 'Laddu Gopal Mukut')}
        />
      </Form.Item>

      <Form.Item
        name="ratePerInch"
        label="Rate per Inch"
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
          disabled={productType === 'Traded' || (productType === 'Manufactured' && productCategory === 'Laddu Gopal Mukut')}
        />
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            Add Product
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;
