// components/CustomerScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Button,
  Card,
  Input,
  Table,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tag,
  Tooltip,
  Modal,
  Upload,
  Spin,
  Alert,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ImportOutlined,
  DownloadOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useCustomerForm } from '../hooks/useCustomerForm';
import { CustomerData } from '../types/customer';
import { api } from '../lib/api';
import CustomerForm from './CustomerForm'; // Import the new reusable form

const { Title, Text } = Typography;
const { Dragger } = Upload;

const CustomerScreen = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshCustomers();
  }, []);

  const refreshCustomers = async () => {
    setIsLoading(true);
    
    // Force clear localStorage to ensure fresh data
    localStorage.removeItem('customers');
    console.log('[DEBUG] Cleared customers from localStorage');
    
    try {
      console.log('[DEBUG] Attempting to fetch customers from API...');
      
      // Add cache-busting timestamp to force fresh response
      const timestamp = new Date().getTime();
      const response = await api.get(`/customers?t=${timestamp}`);
      console.log('[DEBUG] API response:', response);
      
      if (Array.isArray(response)) {
        console.log('[DEBUG] API returned customers array with length:', response.length);
        
        // Force empty array for testing
        console.log('[DEBUG] Forcing empty customers array for testing');
        setCustomers([]);
        
        // Don't save to localStorage to test if data persists
        // localStorage.setItem('customers', JSON.stringify(response));
        console.log('[DEBUG] Not saving customers to localStorage (testing)');
      } else {
        console.log('[DEBUG] API did not return an array, response:', response);
        setCustomers([]);
      }
    } catch (error) {
      console.error("[DEBUG] Failed to refresh customers from API, setting empty array.", error);
      
      // Don't use localStorage even if API fails
      setCustomers([]);
      console.log('[DEBUG] Ignoring localStorage data and setting empty array');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomers();
  }, []);

  const {
    formData,
    editingCustomer,
    showForm,
    saveError,
    setSaveError,
    setIsSaving,
    setShowForm,
    resetForm,
    startEdit,
    isSaving,
    validateForm
  } = useCustomerForm();

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (values: any) => {
    setSaveError(null);
    setIsSaving(true);

    try {
      let result: CustomerData;

      if (editingCustomer) {
        result = await api.put(`/customers/${editingCustomer.id}`, values);
        message.success('Customer updated successfully!');
      } else {
        result = await api.post('/customers', values);
        message.success('Customer added successfully!');
      }

      refreshCustomers();
      resetForm();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      let errorMessage = 'Unknown error occurred';

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message || 'Unknown error occurred';
      }

      setSaveError(errorMessage);
      message.error(`Failed to save customer: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
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
          await api.delete(`/customers/${id}`);
          message.success('Customer deleted successfully!');
          refreshCustomers();
        } catch (err: any) {
          message.error(`Failed to delete customer: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        }
      },
    });
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

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const result = await api.post('/customers/import', formData, true);

      if (result.success) {
        message.success(
          `Import completed. Added ${result.importedCount || 0} customers. ` +
          `${result.skippedCount > 0 ? `Skipped ${result.skippedCount} rows.` : ''}`
        );
      } else {
        message.warning(`Import completed, but no customers were imported. Skipped ${result.skippedCount || 0} rows.`);
      }

      setShowImportModal(false);
      setSelectedFile(null);
      refreshCustomers();
    } catch (err: any) {
      message.error(`Failed to import customers: ${err.message || 'Unknown error'}`);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Name: "John Doe",
        Phone: "9876543210",
        "Alternate Phone": "8765432109",
        "House Number": "123",
        City: "Mumbai",
        District: "Andheri",
        State: "Maharashtra",
        "PIN Code": "400001",
        Country: "India",
        Source: "Direct",
        Notes: "Sample customer",
        Landmark: "Near City Mall"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "customer_template.xlsx");
    message.success("Template downloaded successfully");
  };

  const exportCustomers = () => {
    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers.xlsx");
    message.success("Customer data exported successfully");
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(c => 
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobileNumber1?.includes(searchTerm) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  return (
    <div className="customer-screen p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="mb-2">Customer Management</Title>
            <Text type="secondary">Manage your customer database</Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowForm(true)}
            >
              Add Customer
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setShowImportModal(true)}
            >
              Import
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
            >
              Download Template
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportCustomers}
            >
              Export
            </Button>
          </Space>
        </div>

        <Card className="mb-6">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Text type="secondary">
                Showing {customers.length} of {customers.length} customers
              </Text>
            </Col>
          </Row>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <Spin size="large" />
            <div className="mt-4">Loading customers...</div>
          </div>
        ) : (
          <Card>
            <Table
              dataSource={filteredCustomers}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
              }}
              scroll={{ x: 800 }}
            >
              <Table.Column
                title="Name"
                dataIndex="customerName"
                key="customerName"
                render={(text: string, record: CustomerData) => (
                  <div className="flex items-center">
                    <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }} className="mr-3">
                      {record.customerName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Avatar>
                    <span className="font-medium">{record.customerName}</span>
                  </div>
                )}
              />
              <Table.Column
                title="Phone"
                dataIndex="mobileNumber1"
                key="mobileNumber1"
              />
              <Table.Column
                title="City"
                dataIndex="city"
                key="city"
              />
              <Table.Column
                title="State"
                dataIndex="state"
                key="state"
                render={(state: string) => (
                  <Tag color="blue">{state}</Tag>
                )}
              />
              <Table.Column
                title="Source"
                dataIndex="source"
                key="source"
                render={(source: string) => (
                  <Tag color={source === 'Direct' ? 'green' : 'orange'}>{source}</Tag>
                )}
              />
              <Table.Column
                title="Actions"
                key="actions"
                render={(_, record: CustomerData) => (
                  <Space size="middle">
                    <Tooltip title="Edit">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => startEdit(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Delete">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                      />
                    </Tooltip>
                  </Space>
                )}
              />
            </Table>
          </Card>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        open={showForm}
        onCancel={resetForm}
        footer={null}
        width={700}
      >
        {saveError && (
          <Alert
            message="Error"
            description={saveError}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={() => setSaveError(null)}
          />
        )}
        <CustomerForm
          onFinish={handleSubmit}
          onCancel={resetForm}
          initialValues={formData}
          isSaving={isSaving}
          isEditing={!!editingCustomer}
        />
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Customers"
        open={showImportModal}
        onCancel={() => {
          setShowImportModal(false);
          setSelectedFile(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowImportModal(false);
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            disabled={!selectedFile}
            icon={<ImportOutlined />}
          >
            Import
          </Button>,
        ]}
      >
        <Dragger
          beforeUpload={() => false}
          onChange={handleFileChange}
          multiple={false}
          accept=".xlsx, .xls"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for Excel files (.xlsx, .xls) only. The file should contain customer data with columns for name, phone, etc.
          </p>
        </Dragger>
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <FileOutlined className="text-blue-500 mr-2" />
              <span>{selectedFile.name}</span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setSelectedFile(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerScreen;
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="District"
                name="district">
                <Input placeholder="Enter district" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="State"
                name="state">
                <Input placeholder="Enter state" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="PIN Code"
                name="pinCode">
                <Input placeholder="Enter PIN code" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Notes"
            name="notes">
            <TextArea rows={3} placeholder="Enter any additional notes" />
          </Form.Item>
          <Divider />
          <div className="flex justify-end space-x-2">
            <Button onClick={resetForm}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSaving}
              icon={<SaveOutlined />}
            >
              {editingCustomer ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Customers"
        open={showImportModal}
        onCancel={() => {
          setShowImportModal(false);
          setSelectedFile(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowImportModal(false);
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            disabled={!selectedFile}
            icon={<ImportOutlined />}
          >
            Import
          </Button>,
        ]}
      >
        <Dragger
          beforeUpload={() => false}
          onChange={handleFileChange}
          multiple={false}
          accept=".xlsx, .xls"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for Excel files (.xlsx, .xls) only. The file should contain customer data with columns for name, phone, etc.
          </p>
        </Dragger>
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <FileOutlined className="text-blue-500 mr-2" />
              <span>{selectedFile.name}</span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setSelectedFile(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerScreen;
