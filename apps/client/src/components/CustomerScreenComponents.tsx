import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Form, Select, Row, Col, Typography, Alert } from 'antd';
import { PlusOutlined, DownloadOutlined, UserSwitchOutlined, SearchOutlined, CloseOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { CustomerData } from '../CustomerScreen';
import { FormInstance } from 'antd/lib/form';

// --- Page Header ---
interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => (
  <div className="mb-8 pb-4 border-b border-gray-200">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-600">{subtitle}</p>
  </div>
);

// --- Control Panel ---
interface ControlPanelProps {
  showAddForm: boolean;
  onAddClick: () => void;
  onUpdateClick: () => void;
  onDebugClick: () => void; // Add this
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  showAddForm,
  onAddClick,
  onUpdateClick,
  onDebugClick, // Add this
  searchTerm,
  onSearchChange,
}) => (
  <div className="mb-8">
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      {/* Search Bar takes available space on the left */}
      <div className="w-full md:w-auto md:flex-grow">
        <Input.Search
          placeholder="Search for customers..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
      
      {/* Action Buttons group on the right */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddClick}
          size="large"
          className="shadow-md"
          style={{
            border: 'none',
            background: 'linear-gradient(45deg, #1890ff, #40a9ff)',
          }}
        >
          {showAddForm ? 'Hide Form' : 'Add Customer'}
        </Button>

        <Button
          icon={<UserSwitchOutlined />}
          onClick={onUpdateClick}
          size="large"
          style={{
            backgroundColor: '#fff',
            color: '#faad14',
            borderColor: '#faad14',
            borderWidth: '1px',
          }}
        >
          Update
        </Button>

        <a href="/customer_import_template.xlsx" download="customer_import_template.xlsx">
          <Button
            ghost
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
          >
            Template
          </Button>
        </a>

        <Button
          danger
          onClick={onDebugClick}
          size="large"
        >
          Debug: Show LocalStorage
        </Button>
      </div>
    </div>
  </div>
);

// --- Customer Form ---
interface CustomerFormProps {
  form: FormInstance;
  editingCustomer: CustomerData | null;
  isSaving: boolean;
  saveError: string | null;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  form,
  editingCustomer,
  isSaving,
  saveError,
  onFinish,
  onCancel,
}) => {
  const [pincodeData, setPincodeData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/pincodes.json')
      .then((response) => response.json())
      .then((data) => setPincodeData(data))
      .catch((error) => console.error('Error loading pincode data:', error));
  }, []);

  const getPincodeDetails = (pincode: string) => {
    if (!pincodeData || pincodeData.length === 0) {
      return null;
    }
    // Convert pincode to number for matching, as it is a number in pincodes.json
    return pincodeData.filter((item) => item.pincode === Number(pincode));
  };

  const handlePincodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    console.log(`Pincode blurred: ${pincode}`);
    if (pincode && pincode.length === 6) {
      const details = getPincodeDetails(pincode);
      console.log('Pincode details:', details);
      if (details && details.length > 0) {
        const location = details[0];
        console.log('Location found:', location);
        if (location) {
          form.setFieldsValue({
            city: location.name,
            district: location.district,
            state: location.state,
          });
          console.log('Form values set');
        }
      }
    }
  };

  return (
    <Card
      className="mb-6 bg-gray-50 border border-gray-200"
      title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      extra={editingCustomer && (
        <Button
          icon={<CloseOutlined />}
          onClick={onCancel}
        >
          Cancel Edit
        </Button>
      )}
    >
      <Typography.Paragraph type="secondary">
        {editingCustomer ? 'Update customer information' : 'Fill in the customer details below'}
      </Typography.Paragraph>

      {saveError && (
        <Alert
          message={saveError}
          type="error"
          className="mb-4"
          showIcon
          closable
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="customer-form"
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Customer Name"
              name="name"
              rules={[{ required: true, message: 'Please input customer name!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter customer name"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Mobile Number 1"
              name="phone"
              rules={[{ required: true, message: 'Please input mobile number!' }]}
            >
              <Input
                type="tel"
                placeholder="Enter primary mobile number"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Mobile Number 2" name="mobileNumber2">
              <Input
                type="tel"
                placeholder="Enter secondary mobile number"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Source" name="source">
              <Input
                placeholder="Enter source"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="House/Flat/Street No." name="address">
              <Input
                placeholder="Enter house/flat/street number"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="City/Town/Village" name="city">
              <Input
                placeholder="Enter city/town/village"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="P.O/District" name="district">
              <Input
                placeholder="Enter district"
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item label="PIN Code" name="postalCode">
              <Input
                type="text"
                placeholder="Enter PIN code"
                onBlur={handlePincodeBlur}
                maxLength={6}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="State" name="state">
              <Select
                placeholder="Select a state"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                <Select.Option value="">Select a state</Select.Option>
                <Select.Option value="Andhra Pradesh">Andhra Pradesh</Select.Option>
                <Select.Option value="Arunachal Pradesh">Arunachal Pradesh</Select.Option>
                <Select.Option value="Assam">Assam</Select.Option>
                <Select.Option value="Bihar">Bihar</Select.Option>
                <Select.Option value="Chhattisgarh">Chhattisgarh</Select.Option>
                <Select.Option value="Goa">Goa</Select.Option>
                <Select.Option value="Gujarat">Gujarat</Select.Option>
                <Select.Option value="Haryana">Haryana</Select.Option>
                <Select.Option value="Himachal Pradesh">Himachal Pradesh</Select.Option>
                <Select.Option value="Jharkhand">Jharkhand</Select.Option>
                <Select.Option value="Karnataka">Karnataka</Select.Option>
                <Select.Option value="Kerala">Kerala</Select.Option>
                <Select.Option value="Madhya Pradesh">Madhya Pradesh</Select.Option>
                <Select.Option value="Maharashtra">Maharashtra</Select.Option>
                <Select.Option value="Manipur">Manipur</Select.Option>
                <Select.Option value="Meghalaya">Meghalaya</Select.Option>
                <Select.Option value="Mizoram">Mizoram</Select.Option>
                <Select.Option value="Nagaland">Nagaland</Select.Option>
                <Select.Option value="Odisha">Odisha</Select.Option>
                <Select.Option value="Punjab">Punjab</Select.Option>
                <Select.Option value="Rajasthan">Rajasthan</Select.Option>
                <Select.Option value="Sikkim">Sikkim</Select.Option>
                <Select.Option value="Tamil Nadu">Tamil Nadu</Select.Option>
                <Select.Option value="Telangana">Telangana</Select.Option>
                <Select.Option value="Tripura">Tripura</Select.Option>
                <Select.Option value="Uttar Pradesh">Uttar Pradesh</Select.Option>
                <Select.Option value="Uttarakhand">Uttarakhand</Select.Option>
                <Select.Option value="West Bengal">West Bengal</Select.Option>
                <Select.Option value="Delhi">Delhi</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Landmark" name="landmark">
              <Input
                placeholder="Enter landmark"
              />
            </Form.Item>
          </Col>
        </Row>

        <div className="mt-4 flex justify-end space-x-3">
          <Button onClick={onCancel}>
            Clear
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Add Customer')}
          </Button>
        </div>
      </Form>
    </Card>
  );
};