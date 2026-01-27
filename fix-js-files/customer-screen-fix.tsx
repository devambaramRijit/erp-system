import React, { useState, useEffect, useRef } from 'react';
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
  InboxOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { mockCustomerApi, CustomerData } from './services/mockApi';
import type { UploadFile } from 'antd/es/upload/interface';

// Helper function to standardize state names
const standardizeState = (state: string) => {
  if (!state) return '';
  return state
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Initial form data
const initialFormData: Omit<CustomerData, 'id'> = {
  customerName: '',
  mobileNumber1: '',
  mobileNumber2: '',
  houseNumber: '',
  city: '',
  district: '',
  state: '',
  pinCode: '',
  source: 'Direct',
  notes: '',
};

// Type for form data
type FormData = Omit<CustomerData, 'id'>;

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const CustomerScreen = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch customers from the backend
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);

      // Always try to fetch fresh data from backend
      try {
        const response = await axios.get('/api/customers', { withCredentials: true });
        const customerData = Array.isArray(response.data) ? response.data : [];
        setCustomers(customerData);
        setFilteredCustomers(customerData);
        // Update localStorage with fresh data
        localStorage.setItem('customers', JSON.stringify(customerData));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (values: any) => {
    setSaveError(null);
    setIsSaving(true);

    try {
      console.log('Saving customer data:', values);

      // Standardize the state name
      const standardizedValues = {
        ...values,
        state: standardizeState(values.state)
      };

      let response;
      if (editingCustomer) {
        // Update existing customer
        response = await axios.put(`/api/customers/${editingCustomer.id}`, standardizedValues, { withCredentials: true });
        message.success('Customer updated successfully!');
      } else {
        // Add new customer
        response = await axios.post('/api/customers', standardizedValues, { withCredentials: true });
        message.success('Customer added successfully!');
      }

      // Refresh the customer list
      fetchCustomers();

      // Reset form and close modal
      setFormData(initialFormData);
      setEditingCustomer(null);
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error saving customer:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setSaveError(errorMessage);
      message.error(`Failed to save customer: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      mobileNumber1: customer.mobileNumber1,
      mobileNumber2: customer.mobileNumber2 || '',
      houseNumber: customer.houseNumber || '',
      city: customer.city || '',
      district: customer.district || '',
      state: customer.state || '',
      pinCode: customer.pinCode || '',
      source: customer.source,
      notes: customer.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this customer?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/customers/${id}`, { withCredentials: true });
          message.success('Customer deleted successfully!');
          fetchCustomers();
        } catch (err: any) {
          console.error('Error deleting customer:', err);
          message.error(`Failed to delete customer: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        }
      },
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        customer =>
          customer.customerName.toLowerCase().includes(term) ||
          customer.mobileNumber1.includes(term) ||
          (customer.mobileNumber2 && customer.mobileNumber2.includes(term)) ||
          (customer.city && customer.city.toLowerCase().includes(term)) ||
          (customer.state && customer.state.toLowerCase().includes(term))
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      setSelectedFile(info.fileList[0].originFileObj);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      message.error('Please select a file to import');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      message.success(`Successfully imported ${response.data.importedCount} customers`);
      setShowImportModal(false);
      setSelectedFile(null);
      fetchCustomers();
    } catch (err: any) {
      console.error('Error importing customers:', err);
      message.error(`Failed to import customers: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFile) {
      message.error('Please select a file to update');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      message.success(`Successfully updated ${response.data.importedCount} customers`);
      setShowUpdateModal(false);
      setSelectedFile(null);
      fetchCustomers();
    } catch (err: any) {
      console.error('Error updating customers:', err);
      message.error(`Failed to update customers: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers when search term changes
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        customer =>
          customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.mobileNumber1.includes(searchTerm) ||
          (customer.mobileNumber2 && customer.mobileNumber2.includes(searchTerm)) ||
          (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.state && customer.state.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const formRef = useRef<any>();

  return (
    <div className="customer-screen p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Title level={2} className="text-2xl font-bold text-gray-800 mb-2">
            Customer Management
          </Title>
          <Text className="text-gray-600">
            Manage your customer database, add new customers, and import customer data from Excel files.
          </Text>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCustomer(null);
                setFormData(initialFormData);
                setShowAddForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Customer
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setShowImportModal(true)}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Import from Excel
            </Button>
            <Button
              icon={<UserSwitchOutlined />}
              onClick={() => setShowUpdateModal(true)}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Update Customers
            </Button>
          </div>

          <div className="w-full sm:w-auto">
            <Input.Search
              placeholder="Search customers..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
          </div>
        </div>

        {/* Customer List */}
        {isLoading ? (
          <Card className="text-center py-12">
            <Spin size="large" tip="Loading customers..." />
          </Card>
        ) : (
          <Card
            className="customer-list-card"
            title={`Customer List (${filteredCustomers.length})`}
            bordered={false}
          >
          <Table
            dataSource={filteredCustomers}
            rowKey="id"
            locale={{
              emptyText: 'No customers found'
            }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            columns={[
              {
                title: 'Customer',
                dataIndex: 'customerName',
                key: 'customerName',
                render: (text, record) => (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                      <UserOutlined className="text-gray-500" style={{ fontSize: '20px' }} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{text}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Contact',
                key: 'contact',
                render: (text, record) => (
                  <div>
                    <div className="text-sm text-gray-900">{record.mobileNumber1}</div>
                    {record.mobileNumber2 && (
                      <div className="text-sm text-gray-500">{record.mobileNumber2}</div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Address',
                key: 'address',
                render: (text, record) => (
                  <div className="text-sm text-gray-900">
                    {record.houseNumber && <div>{record.houseNumber}</div>}
                    {record.city && <div>{record.city}</div>}
                    {record.district && <div>{record.district}</div>}
                    {record.state && <div>{record.state}</div>}
                    {record.pinCode && <div>{record.pinCode}</div>}
                  </div>
                ),
              },
              {
                title: 'Source',
                dataIndex: 'source',
                key: 'source',
                render: (text) => <Tag color="blue">{text}</Tag>,
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (text, record) => (
                  <Space>
                    <Tooltip title="Edit customer">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      />
                    </Tooltip>
                    <Tooltip title="Delete customer">
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      />
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
          />
          </Card>
        )}

        {/* Add/Edit Customer Modal */}
        <Modal
          title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          open={showAddForm}
          onCancel={() => {
            setShowAddForm(false);
            setEditingCustomer(null);
            setFormData(initialFormData);
          }}
          footer={null}
          width={800}
          className="customer-form-modal"
        >
          <Form
            ref={formRef}
            layout="vertical"
            initialValues={formData}
            onFinish={handleSubmit}
            className="mt-4"
          >
            {saveError && (
              <Alert
                message="Error"
                description={saveError}
                type="error"
                showIcon
                className="mb-4"
              />
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customerName"
                  label="Customer Name"
                  rules={[{ required: true, message: 'Please enter customer name' }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="mobileNumber1"
                  label="Primary Mobile Number"
                  rules={[
                    { required: true, message: 'Please enter mobile number' },
                    { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit mobile number' }
                  ]}
                >
                  <Input placeholder="Enter mobile number" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="mobileNumber2"
                  label="Secondary Mobile Number"
                  rules={[
                    { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit mobile number' }
                  ]}
                >
                  <Input placeholder="Enter secondary mobile number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="source"
                  label="Source"
                  rules={[{ required: true, message: 'Please select source' }]}
                >
                  <Select placeholder="Select source">
                    <Option value="Direct">Direct</Option>
                    <Option value="Referral">Referral</Option>
                    <Option value="Website">Website</Option>
                    <Option value="Social Media">Social Media</Option>
                    <Option value="Advertisement">Advertisement</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="houseNumber" label="House Number">
                  <Input placeholder="Enter house number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="city" label="City">
                  <Input placeholder="Enter city" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="district" label="District">
                  <Input placeholder="Enter district" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="state" label="State">
                  <Input placeholder="Enter state" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pinCode"
                  label="PIN Code"
                  rules={[
                    { pattern: /^[0-9]{6}$/, message: 'Please enter a valid 6-digit PIN code' }
                  ]}
                >
                  <Input placeholder="Enter PIN code" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="notes" label="Notes">
                  <TextArea rows={1} placeholder="Enter any additional notes" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCustomer(null);
                  setFormData(initialFormData);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Import Modal */}
        <Modal
          title="Import Customers from Excel"
          open={showImportModal}
          onCancel={() => {
            setShowImportModal(false);
            setSelectedFile(null);
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setShowImportModal(false);
              setSelectedFile(null);
            }}>
              Cancel
            </Button>,
            <Button
              key="import"
              type="primary"
              icon={<ImportOutlined />}
              onClick={handleImport}
              disabled={!selectedFile}
              className="bg-green-600 hover:bg-green-700"
            >
              Import Customers
            </Button>,
          ]}
        >
          <div className="mt-4">
            <Alert
              message="Import Instructions"
              description="Please upload an Excel or CSV file with customer data. The file should include columns for customer name, mobile number, and other relevant information."
              type="info"
              showIcon
              className="mb-4"
            />

            <Dragger
              name="file"
              multiple={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for Excel (.xlsx, .xls) and CSV files only.
              </p>
            </Dragger>

            {selectedFile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <Text strong>Selected file:</Text> {selectedFile.name}
              </div>
            )}
          </div>
        </Modal>

        {/* Update Modal */}
        <Modal
          title="Update Customers from Excel"
          open={showUpdateModal}
          onCancel={() => {
            setShowUpdateModal(false);
            setSelectedFile(null);
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setShowUpdateModal(false);
              setSelectedFile(null);
            }}>
              Cancel
            </Button>,
            <Button
              key="update"
              type="primary"
              icon={<ImportOutlined />}
              onClick={handleUpdate}
              disabled={!selectedFile}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Update Customers
            </Button>,
          ]}
        >
          <div className="mt-4">
            <Alert
              message="Update Instructions"
              description="Please upload an Excel or CSV file with customer data. The file should include columns for customer name, mobile number, and other relevant information. Existing customers will be updated based on their mobile number."
              type="info"
              showIcon
              className="mb-4"
            />

            <Dragger
              name="file"
              multiple={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for Excel (.xlsx, .xls) and CSV files only.
              </p>
            </Dragger>

            {selectedFile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <Text strong>Selected file:</Text> {selectedFile.name}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CustomerScreen;
