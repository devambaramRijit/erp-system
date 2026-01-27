import React, { useEffect, useState, useMemo } from 'react';
import { Button, Form, Select, Input, InputNumber, Modal, message, Card, Row, Col, AutoComplete } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { localStorageService } from '../../services/localStorageService';
import ProductForm from '../ProductForm';

interface Product {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  productType: string;
  category: string;
  ratePerPiece?: number;
  ratePerInch?: number;
  costPricePerInch?: number;
  costPricePerPiece?: number;
  size?: number | string;
  unit?: string;
}

interface AddItemButtonProps {
  onAdd: (item: any) => void;
  products?: Product[];
}

const AddItemButton: React.FC<AddItemButtonProps> = ({ onAdd, products: initialProducts }) => {
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const [visible, setVisible] = React.useState(false);
  const [isAddProductModalVisible, setIsAddProductModalVisible] = useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  
  const [isRatePerInchDisabled, setIsRatePerInchDisabled] = React.useState(false);
  const [isRatePerPieceDisabled, setIsRatePerPieceDisabled] = React.useState(false);
  const [isSizeDisabled, setIsSizeDisabled] = React.useState(false);
  const [unitLabel, setUnitLabel] = useState('Rate per Piece');

  const [products, setProducts] = useState<Product[]>(initialProducts || []);

  const productCategories = useMemo(() => {
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(categories) as string[];
  }, [products]);

  const loadProducts = () => {
    try {
      const items = localStorageService.getItems('erp_inventory');
      console.log(`Found ${items.length} items in erp_inventory`);
      
      const transformedProducts = items.map((item: any) => ({
        id: item.id,
        sku: item.sku || item.code || '',
        name: item.name || '',
        size: item.size || '',
        unit: item.unit || 'pcs',
        quantity: Number(item.quantity) || 0,
        price: item.price || item.ratePerPiece || 0,
        productType: item.productType || (item.category && (item.category.toUpperCase().includes('MANUFACTURED') || item.category.toUpperCase().includes('LADDU GOPAL')) ? 'Manufactured' : 'Traded'),
        category: item.productCategory || item.category || 'General',
        costPricePerInch: item.costPricePerInch,
        ratePerInch: item.ratePerInch,
        costPricePerPiece: item.costPricePerPiece,
        ratePerPiece: item.ratePerPiece || item.price
      }));
      
      console.log('Transformed products:', transformedProducts);
      setProducts(transformedProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showModal = () => {
    setVisible(true);
    form.resetFields();
    setSelectedProduct(null);
    setIsRatePerInchDisabled(false);
    setIsRatePerPieceDisabled(false);
    setIsSizeDisabled(false);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);

    if (product) {
      console.log("Product Selected:", product);
      console.log("DEBUG: Full selected product data:", JSON.stringify(product, null, 2));
      const productType = product.productType;
      const productCategory = product.category || '';
      const productName = product.name || '';
      const isMukut = productCategory.toUpperCase().includes('LADDU GOPAL MUKUT') || productName.toLowerCase().includes('mukut');

      const shouldLockRatePerInch = productType === 'Traded' || isMukut;
      setIsRatePerInchDisabled(shouldLockRatePerInch);
      setIsRatePerPieceDisabled(productType === 'Manufactured' && !isMukut);
      setIsSizeDisabled(false); // Assuming size is generally editable

      let ratePerPiece = product.ratePerPiece || product.price || 0;
      let ratePerInch = product.ratePerInch || 0;
      let size = product.size || '';

      if (productType === 'Manufactured' && !isMukut) {
        ratePerPiece = (ratePerInch || 0) * (parseFloat(String(size)) || 0);
      }
      
      if(shouldLockRatePerInch) {
        if(productType === 'Traded') {
            ratePerInch = 1;
        }
        if(isMukut && productType === 'Manufactured'){
            ratePerInch = 1;
        }
      }

      form.setFieldsValue({
        ratePerPiece: ratePerPiece,
        ratePerInch: ratePerInch,
        size: size,
        quantity: 1, // Default quantity
        unit: product.unit || 'pcs',
        total: ratePerPiece, // Initial total
      });

      if (product.unit) {
        setUnitLabel(`Rate per ${product.unit}`);
      } else {
        setUnitLabel('Rate per Piece');
      }
    }
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.unit) {
      if (allValues.unit) {
        setUnitLabel(`Rate per ${allValues.unit}`);
      } else {
        setUnitLabel('Rate per Piece');
      }
    }

    if (!selectedProduct) return;

    const productType = selectedProduct.productType;
    const productCategory = selectedProduct.category || '';
    const productName = selectedProduct.name || '';
    const isMukut = productCategory.toUpperCase().includes('LADDU GOPAL MUKUT') || productName.toLowerCase().includes('mukut');

    let { ratePerPiece, ratePerInch, size, quantity } = allValues;
    let newRatePerPiece = ratePerPiece;

    console.log("Values Changed:", { changedValues, allValues });

    if (productType === 'Manufactured') {
      if (isMukut) {
        // Ensure ratePerInch stays at 1 for manufactured laddu gopal mukut products
        if (changedValues.ratePerInch !== undefined && changedValues.ratePerInch !== 1) {
          form.setFieldsValue({ ratePerInch: 1 });
        }
        newRatePerPiece = selectedProduct.ratePerPiece || selectedProduct.price || 0;
        console.log("Debug (Mukut): Rate per piece is fixed.", { newRatePerPiece });
      } else {
        newRatePerPiece = (ratePerInch || 0) * (parseFloat(String(size)) || 0);
        console.log("Debug (Manufactured): Calculating rate per piece.", { ratePerInch, size, newRatePerPiece });
        form.setFieldsValue({ ratePerPiece: newRatePerPiece });
      }
    } else if (productType === 'Traded') {
      console.log("Debug (Traded): Rate per piece is user-defined.", { ratePerPiece });
    }

    const total = (newRatePerPiece || 0) * (quantity || 0);
    console.log("Debug: Calculating Total.", { newRatePerPiece, quantity, total });
    form.setFieldsValue({ total });
  };

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      console.log("Final values on OK:", values);

      const transformedItem = {
        ...values,
        productId: selectedProduct?.id,
        name: selectedProduct?.name || '',
        sku: selectedProduct?.sku || '',
        category: selectedProduct?.category || '',
        productType: selectedProduct?.productType || '',
        rate: values.ratePerPiece,
      };

      console.log("Item being added:", transformedItem);
      onAdd(values);
      setVisible(false);
      message.success('Item added successfully');
    } catch (error) {
      console.error('Failed to add item:', error);
      message.error('Failed to add item. Check all fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleAddNewProduct = async (values: any) => {
    try {
      const currentProducts = localStorageService.getItems('erp_inventory') || [];
      const newProduct = {
        ...values,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProducts = [...currentProducts, newProduct];
      localStorageService.saveItems('erp_inventory', updatedProducts);
      
      message.success('Product added successfully!');
      setIsAddProductModalVisible(false);
      productForm.resetFields();
      loadProducts(); // Reload products to include the new one
      window.dispatchEvent(new CustomEvent('inventory:updated'));
    } catch (error) {
      console.error('Error adding product:', error);
      message.error('Failed to add product.');
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
        Add Item
      </Button>
      <Modal
        title="Add New Item"
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={{ quantity: 1, size: '', ratePerInch: 1, ratePerPiece: 0, total: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Product">
                <Row gutter={8}>
                  <Col span={18}>
                    <Form.Item
                      name="productId"
                      noStyle
                      rules={[{ required: true, message: 'Please select a product' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select a product"
                        optionFilterProp="children"
                        filterOption={(input, option) => {
                          const product = products.find(p => p.id === option?.value);
                          return product?.name.toLowerCase().includes(input.toLowerCase()) ||
                                 product?.sku.toLowerCase().includes(input.toLowerCase());
                        }}
                        onChange={handleProductChange}
                        value={selectedProduct?.id}
                        optionLabelProp="label"
                      >
                        {products.map(product => (
                          <Select.Option key={product.id} value={product.id} label={product.name}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>SKU: {product.sku} | Size: {product.size || 'Not set'}</div>
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setIsAddProductModalVisible(true)}
                    >
                      New
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please input quantity' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="unit"
                label="Unit"
              >
                <AutoComplete
                  options={[
                    { value: 'pcs' },
                    { value: 'kg' },
                    { value: 'gm' },
                    { value: 'm' },
                    { value: 'Set' },
                    { value: 'Dozen' },
                  ]}
                  placeholder="Unit"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="ratePerInch"
                label="Rate Per Inch"
              >
                <InputNumber 
                  min={0} 
                  step={0.01} 
                  style={{ width: '100%' }} 
                  disabled={isRatePerInchDisabled} 
                  formatter={(value) => String(value)}
                  parser={value => value ? value.replace(/[^\d.]/g, '') : ''}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="size"
                label="Size"
              >
                <Input style={{ width: '100%' }} disabled={isSizeDisabled} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ratePerPiece"
                label={unitLabel}
                rules={[{ required: true, message: 'Please input rate' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled={isRatePerPieceDisabled} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="total"
                label="Total"
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled />
              </Form.Item>
            </Col>
            <Col span={16}>
              {selectedProduct && (
                <Card size="small" title="Product Details">
                  <p><strong>Category:</strong> {selectedProduct.category || 'Not set'} | <strong>Type:</strong> {selectedProduct.productType} | <strong>Is Mukut:</strong> {(selectedProduct.category?.toUpperCase().includes('LADDU GOPAL MUKUT') || selectedProduct.name?.toLowerCase().includes('mukut')) ? 'Yes' : 'No'}</p>
                </Card>
              )}
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Add New Product"
        visible={isAddProductModalVisible}
        onCancel={() => setIsAddProductModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ProductForm
          form={productForm}
          onFinish={handleAddNewProduct}
          onCancel={() => {
            setIsAddProductModalVisible(false);
            productForm.resetFields();
          }}
          isEditing={false}
          productCategories={productCategories}
        />
      </Modal>
    </>
  );
};

export default AddItemButton;
