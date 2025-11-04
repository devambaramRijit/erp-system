import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
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
const { confirm } = Modal;
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
import { importService } from './services/importService';
import { apiService } from './services/apiService';

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
  const [apiError, setApiError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      setIsOnline(true);
      setApiError(null);
      // Refresh data when coming back online
      fetchCustomers();
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      setIsOnline(false);
      setApiStatus('offline');
      setApiError('Network connection lost. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Function to check API status
  const checkApiStatus = async (): Promise<boolean> => {
    try {
      setApiStatus('checking');
      const isHealthy = await apiService.healthCheck();

      if (isHealthy) {
        setApiStatus('online');
        setApiError(null);
        return true;
      }
      setApiStatus('offline');
      return false;
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus('offline');
      setApiError('Unable to connect to the server. Please check your connection.');
      return false;
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);

      // First check if API is available
      const isApiAvailable = await checkApiStatus();

      if (isApiAvailable) {
        // Try to fetch from API first
        try {
          console.log('Fetching customers from API...');
          const response = await apiService.get('/api/customers');

          let customerData = [];

          // Handle different response formats
          if (Array.isArray(response)) {
            customerData = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            customerData = response.data;
          } else if (response && typeof response === 'object') {
            // Try to extract array from the response object
            const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              customerData = possibleArrays[0];
            }
          }

          if (customerData.length > 0) {
            // Remove duplicate customers if any
            const uniqueCustomersMap = new Map();
            customerData.forEach(customer => {
              const key = customer.customerName + customer.mobileNumber1;
              if (!uniqueCustomersMap.has(key)) {
                uniqueCustomersMap.set(key, customer);
              }
            });

            // Convert map back to array
            customerData = Array.from(uniqueCustomersMap.values());

            console.log(`Successfully fetched ${customerData.length} customers from API`);
            setCustomers(customerData);
            setFilteredCustomers(customerData);

            // Update localStorage as backup
            localStorage.setItem('customers', JSON.stringify(customerData));
            return;
          }
        } catch (apiError) {
          console.error('API fetch failed:', apiError);
          // Continue to localStorage fallback
        }
      }

      // If API is not available or failed, try localStorage as fallback
      console.log('Using localStorage as fallback...');
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        try {
          const localData = JSON.parse(storedCustomers);
          if (Array.isArray(localData) && localData.length > 0) {
            console.log(`Using ${localData.length} customers from localStorage`);
            setCustomers(localData);
            setFilteredCustomers(localData);
            return;
          }
        } catch (parseErr) {
          console.error('Error parsing localStorage data:', parseErr);
        }
      }

      // If we get here, neither API nor localStorage had data
      console.log('No customer data available');
      setCustomers([]);
      setFilteredCustomers([]);

    } catch (err) {
      console.error('Unexpected error in fetchCustomers:', err);
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to initialize with sample data
  const initializeWithSampleData = () => {
    console.log('Initializing with sample data');
    const sampleCustomers = [
      {
        id: '1',
        customerName: 'John Doe',
        mobileNumber1: '1234567890',
        email: 'john.doe@example.com',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'State 1',
        country: 'USA',
        postalCode: '10001',
        gstNumber: 'GST12345',
        openingBalance: 1000,
        creditPeriod: 30,
        creditLimit: 5000,
        customerType: 'Regular',
        notes: 'Sample customer'
      },
      {
        id: '2',
        customerName: 'Jane Smith',
        mobileNumber1: '9876543210',
        email: 'jane.smith@example.com',
        addressLine1: '456 Park Ave',
        city: 'Los Angeles',
        state: 'State 2',
        country: 'USA',
        postalCode: '90001',
        gstNumber: 'GST67890',
        openingBalance: 2000,
        creditPeriod: 45,
        creditLimit: 10000,
        customerType: 'Premium',
        notes: 'Sample customer'
      },
      {
        id: '3',
        customerName: 'Robert Johnson',
        mobileNumber1: '5551234567',
        email: 'robert.j@example.com',
        addressLine1: '789 Oak St',
        city: 'Chicago',
        state: 'State 3',
        country: 'USA',
        postalCode: '60001',
        gstNumber: 'GST24680',
        openingBalance: 1500,
        creditPeriod: 60,
        creditLimit: 7500,
        customerType: 'VIP',
        notes: 'Sample customer'
      }
    ];

    try {
      localStorage.setItem('customers', JSON.stringify(sampleCustomers));
      console.log('Sample data added to localStorage');
      console.log('Setting customers state with:', sampleCustomers);
      setCustomers(sampleCustomers);
      setFilteredCustomers(sampleCustomers);

      // Verify data was set correctly
      setTimeout(() => {
        console.log('Verification - customers length:', customers.length);
        console.log('Verification - filteredCustomers length:', filteredCustomers.length);
      }, 100);

      return sampleCustomers;
    } catch (error) {
      console.error('Error in initializeWithSampleData:', error);
      return [];
    }
  };

  // Initialize component - fetch customers
  useEffect(() => {
    // Check if there are any customers in localStorage
    const storedCustomers = localStorage.getItem('customers');
    console.log('Stored customers from localStorage:', storedCustomers);

    if (!storedCustomers || JSON.parse(storedCustomers).length === 0) {
      console.log('No customers found, adding sample data');
      initializeWithSampleData();
    } else {
      // Try to parse and set the data from localStorage immediately
      try {
        const parsedData = JSON.parse(storedCustomers);
        console.log('Setting customers from localStorage:', parsedData);
        setCustomers(parsedData);
        setFilteredCustomers(parsedData);
      } catch (err) {
        console.error('Error parsing stored customers:', err);
        initializeWithSampleData();
      }
    }

    // Try to fetch from backend
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

      if (apiStatus === 'online') {
        try {
          if (editingCustomer) {
            // Update existing customer
            await apiService.put(`/api/customers/${editingCustomer.id}`, customerData);
            message.success('Customer updated successfully');
          } else {
            // Add new customer
            const response = await apiService.post('/api/customers', customerData);
            message.success('Customer added successfully');

            // If the API returned the created customer with an ID, update our local state
            if (response && response.id) {
              customerData.id = response.id;
            }
          }
        } catch (apiError) {
          console.error('API save failed, saving to localStorage only:', apiError);
          // If API fails, save to localStorage only
          if (editingCustomer) {
            const updatedCustomers = customers.map(c => 
              c.id === editingCustomer.id ? { ...c, ...customerData } : c
            );
            setCustomers(updatedCustomers);
            setFilteredCustomers(updatedCustomers);
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));
            message.warning('Customer saved locally only. Server sync failed.');
          } else {
            // Generate a temporary ID for new customers
            const tempId = `temp-${Date.now()}`;
            const newCustomer = { ...customerData, id: tempId };
            const updatedCustomers = [...customers, newCustomer];
            setCustomers(updatedCustomers);
            setFilteredCustomers(updatedCustomers);
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));
            message.warning('Customer saved locally only. Server sync failed.');
          }
        }
      } else {
        // If API is offline, save to localStorage only
        if (editingCustomer) {
          const updatedCustomers = customers.map(c => 
            c.id === editingCustomer.id ? { ...c, ...customerData } : c
          );
          setCustomers(updatedCustomers);
          setFilteredCustomers(updatedCustomers);
          localStorage.setItem('customers', JSON.stringify(updatedCustomers));
          message.warning('Customer saved locally only. Server is offline.');
        } else {
          // Generate a temporary ID for new customers
          const tempId = `temp-${Date.now()}`;
          const newCustomer = { ...customerData, id: tempId };
          const updatedCustomers = [...customers, newCustomer];
          setCustomers(updatedCustomers);
          setFilteredCustomers(updatedCustomers);
          localStorage.setItem('customers', JSON.stringify(updatedCustomers));
          message.warning('Customer saved locally only. Server is offline.');
        }
      }

      // Reset form and close modal
      form.resetFields();
      setIsModalVisible(false);
      setEditingCustomer(null);

      // Refresh customer list
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setSaveError(error.message || 'Failed to save customer');
      message.error('Failed to save customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    confirm({
      title: 'Are you sure you want to delete this customer?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          if (apiStatus === 'online') {
            try {
              await apiService.delete(`/api/customers/${id}`);
              message.success('Customer deleted successfully');
            } catch (apiError) {
              console.error('API delete failed, deleting from localStorage only:', apiError);
              // If API fails, delete from localStorage only
              const updatedCustomers = customers.filter(c => c.id !== id);
              setCustomers(updatedCustomers);
              setFilteredCustomers(updatedCustomers);
              localStorage.setItem('customers', JSON.stringify(updatedCustomers));
              message.warning('Customer deleted locally only. Server sync failed.');
            }
          } else {
            // If API is offline, delete from localStorage only
            const updatedCustomers = customers.filter(c => c.id !== id);
            setCustomers(updatedCustomers);
            setFilteredCustomers(updatedCustomers);
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));
            message.warning('Customer deleted locally only. Server is offline.');
          }

          // Refresh customer list
          fetchCustomers();
        } catch (error: any) {
          console.error('Error deleting customer:', error);
          message.error('Failed to delete customer');
        }
      },
    });
  };

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setIsModalVisible(true);

    // Set form values
    form.setFieldsValue({
      customerName: customer.customerName,
      mobileNumber1: customer.mobileNumber1,
      email: customer.email,
      addressLine1: customer.addressLine1,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: customer.country,
      gstNumber: customer.gstNumber,
      openingBalance: customer.openingBalance,
      creditPeriod: customer.creditPeriod,
      creditLimit: customer.creditLimit,
      customerType: customer.customerType,
      notes: customer.notes,
    });
  };

  const showModal = () => {
    setEditingCustomer(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
    setSaveError(null);
  };

  const testCustomerEndpoints = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const testResults = {
        healthCheck: false,
        getCustomers: false,
        createCustomer: false,
        updateCustomer: false,
        deleteCustomer: false,
        importCustomers: false
      };

      // Test health check
      try {
        const isHealthy = await apiService.healthCheck();
        if (isHealthy) {
          testResults.healthCheck = true;
          console.log('Health check test passed');
        }
      } catch (error) {
        console.error('Health check test failed:', error);
      }

      // Test get customers
      try {
        await apiService.get('/api/customers');
        testResults.getCustomers = true;
        console.log('Get customers test passed');
      } catch (error) {
        console.error('Get customers test failed:', error);
      }

      // Test create customer
      try {
        const newCustomer = {
          customerName: 'Test Customer',
          mobileNumber1: '1234567890',
          email: 'test@example.com',
          city: 'Test City',
          state: 'Test State',
          addressLine1: '123 Test St',
          country: 'Test Country',
          postalCode: '12345',
          company: 'Test Company',
          gstNumber: 'TEST123',
          notes: 'Test customer for endpoint testing'
        };

        const createResponse = await apiService.post('/api/customers', newCustomer);
        if (createResponse) {
          testResults.createCustomer = true;
          console.log('Create customer test passed');

          // Test update customer
          const createdCustomerId = createResponse.id;
          const updatedCustomer = { ...newCustomer, customerName: 'Updated Test Customer' };

          try {
            await apiService.put(`/api/customers/${createdCustomerId}`, updatedCustomer);
            testResults.updateCustomer = true;
            console.log('Update customer test passed');

            // Test delete customer
            try {
              await apiService.delete(`/api/customers/${createdCustomerId}`);
              testResults.deleteCustomer = true;
              console.log('Delete customer test passed');
            } catch (error) {
              console.error('Delete customer test failed:', error);
            }
          } catch (error) {
            console.error('Update customer test failed:', error);
          }
        }
      } catch (error) {
        console.error('Create customer test failed:', error);
      }

      // Test import customers (just check if endpoint exists)
      try {
        // We can't actually test the import without a file, but we can check if the endpoint exists
        await apiService.get('/api/customers/import-excel');
        testResults.importCustomers = true;
        console.log('Import customers endpoint test passed');
      } catch (error) {
        console.error('Import customers endpoint test failed:', error);
      }

      // Display test results
      const allTestsPassed = Object.values(testResults).every(result => result === true);

      if (allTestsPassed) {
        message.success('All customer endpoint tests passed!');
        setApiStatus('online');
      } else {
        const failedTests = Object.entries(testResults)
          .filter(([_, passed]) => !passed)
          .map(([test, _]) => test)
          .join(', ');

        setApiError(`Some tests failed: ${failedTests}`);
        message.warning(`Some tests failed: ${failedTests}`);
        setApiStatus('offline');
      }

      console.log('Test results:', testResults);
    } catch (error) {
      console.error('Endpoint testing failed:', error);
      setApiError('Failed to test endpoints. Please check your connection.');
      setApiStatus('offline');
      message.error('Failed to test endpoints');
    } finally {
      setIsLoading(false);
      // Refresh customer list after testing
      fetchCustomers();
    }
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
      const selectedFile = fileList[0];

      // Use our import service to process the Excel file
      const importResult = await importService.processExcelFile(selectedFile);

      if (!importResult.success) {
        setImportError(importResult.message || 'Failed to process Excel file');
        return;
      }

      const customersToImport = importResult.customers || [];

      if (customersToImport.length === 0) {
        setImportError('No valid customer data found in the file');
        return;
      }

      // Try to send to API if online
      if (apiStatus === 'online') {
        try {
          // Use our API service to import customers
          const response = await apiService.importCustomers(selectedFile);
          setImportSuccess(response.message || 'Customers imported successfully');

          // Refresh data after successful import
          fetchCustomers();
        } catch (apiError) {
          console.error('API import failed, using local processing:', apiError);
          // Fall back to local processing
          throw apiError;
        }
      } else {
        // If API is offline, use local processing only
        throw new Error('API is offline, using local processing');
      }
    } catch (error) {
      console.error('Error importing customers:', error);

      // Local processing as fallback
      try {
        // Get the current customers from localStorage to ensure we have the latest data
        const storedCustomers = localStorage.getItem('customers');
        const currentCustomers = storedCustomers ? JSON.parse(storedCustomers) : customers;

        // If we have customers from the import service, use them
        const importedCustomers = importResult?.customers || [];

        // Add the imported customers to the current list
        const updatedCustomers = [...currentCustomers, ...importedCustomers];

        // Update state and localStorage
        setCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));

        setImportSuccess(`Successfully processed ${fileList[0].name} locally and added ${importedCustomers.length} customers`);
      } catch (localErr) {
        console.error('Local processing failed:', localErr);
        setImportError('Error processing file: ' + (localErr instanceof Error ? localErr.message : 'Unknown error'));
      }
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
      render: (text: string, record: CustomerData) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
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
      render: (text: string) => text || '-',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: (text: string) => {
        // Map city values to display names
        const cityMap: Record<string, string> = {
          '1': 'City 1',
          '2': 'City 2',
          '3': 'City 3',
          '4': 'City 4',
          '5': 'City 5',
        };
        return cityMap[text] || text || '-';
      },
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      render: (text: string) => {
        // Map state values to display names
        const stateMap: Record<string, string> = {
          '1': 'State 1',
          '2': 'State 2',
          '3': 'State 3',
          '4': 'State 4',
          '5': 'State 5',
        };
        return stateMap[text] || text || '-';
      },
    },
    {
      title: 'Type',
      dataIndex: 'customerType',
      key: 'customerType',
      render: (text: string) => {
        let color = 'blue';
        if (text === 'VIP') color = 'gold';
        else if (text === 'Premium') color = 'green';

        return (
          <Tag color={color}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: CustomerData) => (
        <Space size="middle">
          <Tooltip title="Edit Customer">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Customer">
            <Button
              type="primary"
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
        <Col>
          <Title level={2}>Customer Management</Title>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showModal}
            >
              Add Customer
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={showImportModal}
            >
              Import
            </Button>
            <Button
              onClick={testCustomerEndpoints}
              loading={isLoading}
            >
              Test API
            </Button>
          </Space>
        </Col>
      </Row>

      {apiError && (
        <Alert
          message="API Connection Error"
          description={apiError}
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
          action={
            <Button size="small" onClick={fetchCustomers}>
              Retry
            </Button>
          }
        />
      )}

      <Card>
        <Row justify="space-between" style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Input
              placeholder="Search customers..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Space>
              <Tag color={apiStatus === 'online' ? 'green' : apiStatus === 'checking' ? 'blue' : 'red'}>
                {apiStatus === 'online' ? 'Online' : apiStatus === 'checking' ? 'Checking...' : 'Offline'}
              </Tag>
              <span>{customers.length} customers</span>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
          }}
        />
      </Card>

      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isLoading}
            onClick={() => form.submit()}
            icon={<SaveOutlined />}
          >
            {editingCustomer ? 'Update' : 'Save'}
          </Button>,
        ]}
        width={800}
      >
        {saveError && (
          <Alert
            message="Error"
            description={saveError}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            country: 'USA',
            openingBalance: 0,
            creditPeriod: 30,
            creditLimit: 0,
            customerType: 'Regular',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please input customer name!' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mobileNumber1"
                label="Phone Number"
                rules={[{ required: true, message: 'Please input phone number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Please input a valid email!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
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
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="addressLine1"
                label="Address"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="state"
                label="State"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="postalCode"
                label="Postal Code"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
              >
                <Input />
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
            <Col span={24}>
              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Import Customers from Excel"
        visible={importModalVisible}
        onCancel={handleImportCancel}
        footer={[
          <Button key="cancel" onClick={handleImportCancel}>
            Cancel
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importLoading}
            onClick={handleImport}
            icon={<ImportOutlined />}
          >
            Import
          </Button>,
        ]}
        width={600}
      >
        {importError && (
          <Alert
            message="Import Error"
            description={importError}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        {importSuccess && (
          <Alert
            message="Import Success"
            description={importSuccess}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for CSV or Excel files only. Maximum file size is 5MB.
          </p>
        </Dragger>
        <Divider />
        <Typography.Paragraph>
          <Typography.Text strong>Expected columns in Excel file:</Typography.Text>
        </Typography.Paragraph>
        <ul>
          <li>Customer Name (required)</li>
          <li>Phone Number (required)</li>
          <li>Email</li>
          <li>Address</li>
          <li>City</li>
          <li>State</li>
          <li>Postal Code</li>
          <li>Country</li>
          <li>GST Number</li>
          <li>Opening Balance</li>
          <li>Credit Period</li>
          <li>Credit Limit</li>
          <li>Customer Type</li>
          <li>Notes</li>
        </ul>
      </Modal>
    </div>
  );
};

export default CustomerScreen;
