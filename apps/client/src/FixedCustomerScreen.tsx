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
      message.error(`Failed to save customer: ${error.response?.data?.message || error.message || 'Unknown error'}`);
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
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
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
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showModal}
            >
              Add Customer
            </Button>
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
                name="openingBalance"
                label="Opening Balance"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="creditPeriod"
                label="Credit Period (days)"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="creditLimit"
                label="Credit Limit"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item
                name="gstNumber"
                label="GST Number"
              >
                <Input />
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
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isLoading}>
                {editingCustomer ? 'Update' : 'Add'} Customer
              </Button>
              <Button onClick={handleCancel} icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerScreen;