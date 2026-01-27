import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Space, Button, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Option } = Select;

interface ProductFormProps {
  form: any;
  onFinish: (values: any) => void;
  onCancel: () => void;
  isEditing: boolean;
  productTypes: string[];
  initialValues?: any;
}

const ProductForm: React.FC<ProductFormProps> = ({ form, onFinish, onCancel, isEditing, productTypes, initialValues }) => {
  const productType = Form.useWatch('productType', form);
  const productCategory = Form.useWatch('productCategory', form);
  const productTypeUpper = (productType || '').toString().toUpperCase();
  const productCategoryUpper = (productCategory || '').toString().toUpperCase();
  const [customUnitModalVisible, setCustomUnitModalVisible] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (productTypeUpper === 'MANUFACTURED') {
      form.setFieldsValue({ quantity: 0 });
    }
  }, [productTypeUpper, form]);

  useEffect(() => {
    const fetchUnits = async () => {
      const defaultUnits = [
        { value: 'pcs', label: 'Pieces' },
        { value: 'kg', label: 'Kilogram' },
        { value: 'g', label: 'Gram' },
        { value: 'l', label: 'Liter' },
        { value: 'ml', label: 'Milliliter' },
        { value: 'm', label: 'Meter' },
        { value: 'cm', label: 'Centimeter' },
        { value: 'set', label: 'Set' },
        { value: 'dozen', label: 'Dozen' },
        { value: 'metre', label: 'Metre' },
        { value: 'inch', label: 'Inch' },
        { value: 'foot', label: 'Foot' }
      ];

      try {
        const response = await fetch('/inventory_template.xlsx');
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData && jsonData.length > 0) {
          const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
          const unitIndex = headers.indexOf('unit');

          if (unitIndex !== -1) {
            const unitsFromXLSX = jsonData.slice(1).map(row => row[unitIndex]).filter(Boolean);
            const uniqueUnits = [...new Set(unitsFromXLSX)] as string[];
            const xlsxOptions = uniqueUnits.map(unit => ({ value: String(unit).toLowerCase(), label: String(unit) }));

            const combinedUnits = [...defaultUnits];
            xlsxOptions.forEach(opt => {
              if (!combinedUnits.some(def => def.value === opt.value)) {
                combinedUnits.push(opt);
              }
            });
            setUnitOptions(combinedUnits);
          } else {
            setUnitOptions(defaultUnits);
          }
        } else {
          setUnitOptions(defaultUnits);
        }

      } catch (error) {
        console.error('Error fetching or parsing units from XLSX:', error);
        setUnitOptions(defaultUnits);
      }
    };

    fetchUnits();
  }, []);


  const isPieceBasedDisabled = productTypeUpper === 'MANUFACTURED' && ['LADDU GOPAL BASE', 'RK BASE', 'MATA RANI BASE', 'GANESH LAKSHMI BASE', 'SHYAM BABA BASE'].includes(productCategoryUpper);
  const isInchBasedDisabled = productTypeUpper === 'TRADED' || (productTypeUpper === 'MANUFACTURED' && productCategoryUpper.includes('MUKUT'));

  // Handle adding a custom unit
  const handleAddCustomUnit = () => {
    if (customUnit.trim()) {
      // Check if the unit already exists
      if (!unitOptions.some(option => option.value === customUnit.trim().toLowerCase())) {
        const newUnit = {
          value: customUnit.trim().toLowerCase(),
          label: customUnit.trim()
        };
        setUnitOptions([...unitOptions, newUnit]);
        form.setFieldsValue({ unit: newUnit.value });
      } else {
        // Unit already exists, just set it as the current value
        form.setFieldsValue({ unit: customUnit.trim().toLowerCase() });
      }
      setCustomUnit('');
      setCustomUnitModalVisible(false);
    }
  };

  return (
    <>
      {/* Main form content */}
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues || { productType: 'TRADED' }}>
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
                <Option value="TRADED">TRADED</Option>
                <Option value="MANUFACTURED">MANUFACTURED</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Product Category" name="productCategory" rules={[{ required: true }]}>
              <Select showSearch placeholder="Select or type a new category">
                {[...new Set([
                  "MATA RANI BASE",
                  "MATA RANI MUKUT",
                  "MATA RANI ACCESSORIES",
                  "LADDU GOPAL BASE",
                  "LADDU GOPAL MUKUT (W/O KILANGI)",
                  "LADDU GOPAL MUKUT (W/1 KILANGI)",
                  "LADDU GOPAL MUKUT (W/2 KILANGI)",
                  "LADDU GOPAL ACCESSORIES",
                  "GANESH LAKHSMI BASE",
                  "GANESH LAKSHMI MUKUT",
                  "GANESH LAKSHMI ACCESSORIES",
                  "SHYAM BABA BASE",
                  "SHYAM BABA MUKUT",
                  "SHYAM BABA ACCESSORIES",
                  "BOOTI",
                  "OTHERS",
                  "RK BASE",
                  ...productTypes
                ])].map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {productTypeUpper === 'TRADED' && (
            <Col span={12}>
              <Form.Item label="Quantity" name="quantity">
                <InputNumber
                  style={{ width: '100%' }}
                  onChange={(value) => form.setFieldsValue({ quantity: value })}
                />
              </Form.Item>
            </Col>
          )}
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
              <Select
                dropdownRender={menu => (
                  <>
                    {menu}
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setCustomUnitModalVisible(true)}
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      Add Custom Unit
                    </Button>
                  </>
                )}
              >
                {unitOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
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

      {/* Custom Unit Modal */}
      <Modal
        title="Add Custom Unit"
        open={customUnitModalVisible}
        onOk={handleAddCustomUnit}
        onCancel={() => {
          setCustomUnitModalVisible(false);
          setCustomUnit('');
        }}
      >
        <Input
          placeholder="Enter custom unit"
          value={customUnit}
          onChange={e => setCustomUnit(e.target.value)}
          onPressEnter={handleAddCustomUnit}
        />
      </Modal>
    </>
  );
};

export default ProductForm;