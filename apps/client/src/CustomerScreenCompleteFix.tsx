import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Table,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Tag,
  Tooltip,
  Modal,
  Upload,
  Spin,
  Alert
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ImportOutlined,
  CloseOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { CustomerData } from './services/mockApi';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const CustomerScreen: React.FC = () => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.customerName && customer.customerName.toLowerCase().includes(term) ||
        customer.mobileNumber1 && customer.mobileNumber1.includes(term) ||
        customer.city && customer.city.toLowerCase().includes(term) ||
        customer.state && customer.state.toLowerCase().includes(term)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);

      // Always try to fetch fresh data from backend
      try {
        const response = await axios.get('/api/customers', { withCredentials: true });
        const customerData = Array.isArray(response.data) ? response.data : [];

        // Remove duplicate customers if any
        const uniqueCustomersMap = new Map();
        const duplicatesRemoved = [];

        customerData.forEach(customer => {
          const key = customer.customerName + customer.mobileNumber1;
          if (uniqueCustomersMap.has(key)) {
            duplicatesRemoved.push(customer);
          } else {
            uniqueCustomersMap.set(key, customer);
          }
        });

        // Convert map back to array
        const uniqueCustomers = Array.from(uniqueCustomersMap.values());

        // If duplicates were found and removed, update localStorage
        if (duplicatesRemoved.length > 0) {
          console.log(`Removed ${duplicatesRemoved.length} duplicate customer entries`);
          localStorage.setItem('customers', JSON.stringify(uniqueCustomers));

          // Show notification about duplicates removed
          setTimeout(() => {
            alert(`Removed ${duplicatesRemoved.length} duplicate customer entries to ensure data integrity.`);
          }, 500);
        }

        setCustomers(uniqueCustomers);
        setFilteredCustomers(uniqueCustomers);
        // Update localStorage with fresh data
        localStorage.setItem('customers', JSON.stringify(uniqueCustomers));
      } catch (backendErr) {
        console.error('Error fetching customers from backend:', backendErr);
        alert(`Error fetching customers: ${backendErr.response?.data?.message || backendErr.message || 'Unknown error'}`);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      alert(`Error fetching customers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize component - fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (values: any) => {
    setSaveError(null);
    try {
      setIsLoading(true);

      // Format the data for submission
      const customerData = {
        ...values,
        openingBalance: Number(values.openingBalance) || 0,
        creditPeriod: Number(values.creditPeriod) || 0,
        creditLimit: Number(values.creditLimit) || 0,
      };

      if (editingCustomer) {
        // Update existing customer
        await axios.put(`/api/customers/${editingCustomer.id}`, customerData, { withCredentials: true });
        message.success('Customer updated successfully');
      } else {
        // Add new customer
        await axios.post('/api/customers', customerData, { withCredentials: true });
        message.success('Customer added successfully');
      }

      setIsModalVisible(false);
      setEditingCustomer(null);
      form.resetFields();
      fetchCustomers(); // Refresh the list
    } catch (error: any) {
      console.error('Error saving customer:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      setSaveError(errorMessage);
      message.error(`Failed to save customer: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      openingBalance: customer.openingBalance || 0,
      creditPeriod: customer.creditPeriod || 0,
      creditLimit: customer.creditLimit || 0,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this customer?',
      icon: <ExclamationCircleOutlined />,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await axios.delete(`/api/customers/${id}`, { withCredentials: true });
          message.success('Customer deleted successfully');
          fetchCustomers(); // Refresh the list
        } catch (error: any) {
          console.error('Error deleting customer:', error);
          message.error(`Failed to delete customer: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
      },
    });
  };

  const showModal = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
    setSaveError(null);
  };

  const showImportModal = () => {
    setImportModalVisible(true);
    setFileList([]);
    setImportError(null);
    setImportSuccess(null);
  };

  const handleImportCancel = () => {
    setImportModalVisible(false);
    setFileList([]);
    setImportError(null);
    setImportSuccess(null);
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file: any) => {
      // Only accept CSV and Excel files
      const isCSVOrExcel = file.type === 'text/csv' || 
                          file.type === 'application/vnd.ms-excel' || 
                          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (!isCSVOrExcel) {
        message.error('You can only upload CSV or Excel files!');
        return false;
      }

      // Check file size (limit to 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('File must be smaller than 5MB!');
        return false;
      }

      setFileList([file]);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      setImportError('Please select a file to import');
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', fileList[0] as any);

      // First try the new API endpoint
      try {
        const response = await axios.post('/api/customers/import-excel', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        });

        setImportSuccess(response.data.message || 'Customers imported successfully');
        fetchCustomers(); // Refresh the list

        // Close modal after successful import
        setTimeout(() => {
          setImportModalVisible(false);
          setFileList([]);
        }, 2000);
      } catch (importErr) {
        console.error('Error with new import endpoint, trying fallback:', importErr);

        // Fallback to the old import method if the new one fails
        const fallbackResponse = await axios.post('/api/customers/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        });

        setImportSuccess(fallbackResponse.data.message || 'Customers imported successfully');
        fetchCustomers(); // Refresh the list

        // Close modal after successful import
        setTimeout(() => {
          setImportModalVisible(false);
          setFileList([]);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error importing customers:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      setImportError(`Failed to import customers: ${errorMessage}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Phone',
      dataIndex: 'mobileNumber1',
      key: 'mobileNumber1',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: any, record: CustomerData) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Customer Management</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Input
              placeholder="Search customers..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
            />
          </Col>
          <Col>
            <Space>
              <Button 
                type="default" 
                icon={<ImportOutlined />} 
                onClick={showImportModal}
              >
                Import from Excel
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showModal}
              >
                Add Customer
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table 
          columns={columns} 
          dataSource={filteredCustomers} 
          rowKey="id" 
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        {saveError && (
          <Alert
            message="Error"
            description={saveError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            openingBalance: 0,
            creditPeriod: 0,
            creditLimit: 0,
            customerType: 'Regular',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mobileNumber1"
                label="Primary Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mobileNumber2"
                label="Secondary Phone"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="addressLine1"
                label="Address Line 1"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="addressLine2"
                label="Address Line 2"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="state"
                label="State"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="country"
                label="Country"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="postalCode"
                label="Postal Code"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="gstNumber"
                label="GST Number"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="openingBalance"
                label="Opening Balance"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="customerType"
                label="Customer Type"
              >
                <Select>
                  <Option value="Regular">Regular</Option>
                  <Option value="Premium">Premium</Option>
                  <Option value="VIP">VIP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="creditPeriod"
                label="Credit Period (days)"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="creditLimit"
                label="Credit Limit"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading} icon={<SaveOutlined />}>
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
              <Button onClick={handleCancel} icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Import Customers from Excel"
        visible={importModalVisible}
        onCancel={handleImportCancel}
        footer={[
          <Button key="back" onClick={handleImportCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={importLoading} 
            onClick={handleImport}
            disabled={fileList.length === 0}
          >
            Import
          </Button>,
        ]}
      >
        {importError && (
          <Alert
            message="Error"
            description={importError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {importSuccess && (
          <Alert
            message="Success"
            description={importSuccess}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single upload. Only CSV and Excel files are accepted.
          </p>
        </Dragger>
      </Modal>
    </div>
  );
};

export default CustomerScreen;
