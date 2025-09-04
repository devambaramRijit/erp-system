import React from 'react';
import { Form } from 'antd';

interface Product {
  id: string;
  sku: string;
  name: string;
  size: string;
  unit: string;
  quantity: number;
  price: number;
  productType: string;
  category: string;
}

interface ProductDetailsSectionProps {
  products: Product[];
}

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({ products }) => {
  return (
    <div className="product-details" style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
      <h4>Product Details</h4>
      <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.productId !== currentValues.productId}>
        {({ getFieldValue }) => {
          const productId = getFieldValue('productId');
          if (!productId) return null;

          const product = products.find(p => p.id === productId);
          if (!product) return null;

          return (
            <div>
              <p><strong>SKU:</strong> {product.sku}</p>
              <p><strong>Available Quantity:</strong> {product.quantity} {product.unit}</p>
              <p><strong>Price:</strong> ₹{product.price.toFixed(2)}</p>
            </div>
          );
        }}
      </Form.Item>
    </div>
  );
};

export default ProductDetailsSection;
