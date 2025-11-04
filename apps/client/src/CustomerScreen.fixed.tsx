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
            message.warning('Customer updated locally only. Server sync failed.');
          } else {
            // Generate a temporary ID for local storage
            const newCustomer = {
              ...customerData,
              id: `local-${Date.now()}`
            };
            const updatedCustomers = [...customers, newCustomer];
            setCustomers(updatedCustomers);
            setFilteredCustomers(updatedCustomers);
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));
            message.warning('Customer added locally only. Server sync failed.');
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
          message.warning('API is offline. Customer updated locally only.');
        } else {
          // Generate a temporary ID for local storage
          const newCustomer = {
            ...customerData,
            id: `local-${Date.now()}`
          };
          const updatedCustomers = [...customers, newCustomer];
          setCustomers(updatedCustomers);
          setFilteredCustomers(updatedCustomers);
          localStorage.setItem('customers', JSON.stringify(updatedCustomers));
          message.warning('API is offline. Customer added locally only.');
        }
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
            message.warning('API is offline. Customer deleted locally only.');
          }

          fetchCustomers(); // Refresh the list
        } catch (error: any) {
          console.error('Error deleting customer:', error);
          message.error(`Failed to delete customer: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
      },
    });
  };

  const clearApiError = () => {
    setApiError(null);
  };

  // Function to check database health
  const checkDatabaseHealth = async () => {
    try {
      console.log('Checking database health...');
      const response = await apiService.get('/api/health');

      console.log('Database health check result:', response);

      // Check if response is HTML (indicating wrong endpoint or server not running)
      if (typeof response === 'string' && response.includes('<!doctype html>')) {
        console.warn('Received HTML instead of JSON. The server might not be running or the health endpoint is not configured.');
        setApiError('Server is not responding correctly. Please make sure the server is running on port 3000.');
        return false;
      }

      // Check if response has the expected structure
      if (!response || !response.database) {
        console.warn('Invalid response structure from health endpoint');
        setApiError('Invalid response from server. Please check server configuration.');
        return false;
      }

      // Check if customer data is healthy
      if (response.database.customerData && response.database.customerData.healthy) {
        console.log(`Customer data is healthy: ${response.database.customerData.count} customers found`);
        return true;
      } else {
        console.warn('Customer data is not healthy');
        setApiError('Customer data is not available. Please try again later.');
        return false;
      }
    } catch (error) {
      console.error('Database health check failed:', error);

      // Provide more specific error messages based on the error type
      if (error.code === 'ECONNABORTED') {
        setApiError('Database health check timed out. The server might be overloaded or not responding.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setApiError(`Server responded with error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        setApiError('No response from server. Please make sure the server is running on port 3000.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setApiError('Failed to connect to the database. Please check your connection.');
      }

      return false;
    }
  };

  const showModal = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
    setSaveError(null);
    clearApiError();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
    setSaveError(null);
  };

  // Function to test all customer-related endpoints
  const testCustomerEndpoints = async () => {
    setIsLoading(true);
    clearApiError();

    const testResults = {
      healthCheck: false,
      getCustomers: false,
      createCustomer: false,
      updateCustomer: false,
      deleteCustomer: false,
      importCustomers: false
    };

    try {
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
        const importResult = error && typeof error === 'object' && 'customers' in error 
          ? (error as any).customers || [] 
          : [];

        // Add the imported customers to the current list
        const updatedCustomers = [...currentCustomers, ...importResult];

        // Update state and localStorage
        setCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));

        setImportSuccess(`Successfully processed ${fileList[0].name} locally and added ${importResult.length} customers`);
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
      render: (text: string) => {
        // If the name is just "Customer X", format it nicely
        if (text && text.startsWith('Customer ')) {
          return <a><span style={{ fontWeight: 'bold' }}>{text}</span></a>;
        }
        return <a>{text}</a>;
      }
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
      render: (text: string) => {
        // Map city values to display names
        const cityMap: Record<string, string> = {
          '1': 'City 1',
          '2': 'City 2',
          '3': 'City 3',
          '4': 'City 4',
          '5': 'City 5',
          '6': 'City 6',
          '7': 'City 7',
          '8': 'City 8',
          '9': 'City 9',
          '10': 'City 10',
        };
        return cityMap[text] || text;
      }
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
        return stateMap[text] || text;
      }
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

      {/* API Error Alert */}
      {apiError && (
        <Alert
          message="API Error"
          description={apiError}
          type="error"
          showIcon
          closable
          onClose={clearApiError}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Connection Status Indicator */}
      <div style={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: isOnline ? '#52c41a' : '#ff4d4f',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer'
      }}
        onClick={() => {
          if (!isOnline) {
            setApiError('Network connection lost. Please check your internet connection.');
          } else {
            setApiError(null);
            fetchCustomers(); // Refresh data when clicked
          }
        }}
      >
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'white',
          marginRight: '8px',
          animation: isOnline ? 'none' : 'pulse 1.5s infinite'
        }} />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

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
                type="default" 
                onClick={() => {
                  console.log('Force refresh button clicked');
                  initializeWithSampleData();
                }}
              >
                Load Sample Data
              </Button>
              <Button 
                type="default" 
                onClick={() => {
                  console.log('Refresh data button clicked');
                  fetchCustomers();
                }}
                loading={isLoading}
              >
                Refresh Data
              </Button>
              <Button 
                type="default" 
                danger
                onClick={() => {
                  confirm({
                    title: 'Are you sure you want to delete all customers?',
                    content: 'This action cannot be undone.',
                    okText: 'Yes, delete all',
                    okType: 'danger',
                    cancelText: 'No, cancel',
                    onOk() {
                      console.log('Delete all customers confirmed');
                      // Clear localStorage
                      localStorage.removeItem('customers');
                      // Clear state
                      setCustomers([]);
                      setFilteredCustomers([]);
                      message.success('All customers have been deleted');
                    },
                    onCancel() {
                      console.log('Delete all customers canceled');
                    },
                  });
                }}
              >
                Delete All Customers
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showModal}
                size="large"
                style={{ fontWeight: 'bold' }}
              >
                Add Customer
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <p>Debug: Customers count: {customers.length}, Filtered count: {filteredCustomers.length}</p>
          <p>Debug: isLoading: {isLoading.toString()}, API Status: {apiStatus}</p>
          {!isLoading && customers.length > 0 && apiStatus === 'offline' && (
            <Alert 
              message="Using Local Data" 
              description="Currently displaying data from local storage. Server data may not be available due to authentication issues." 
              type="info" 
              showIcon 
              style={{ marginBottom: 16 }}
            />
          )}
        </div>
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
        {saveError && <Alert message={saveError} type="error" style={{ marginBottom: 16 }} />}
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
                <Select placeholder="Select a state">
                  <Option value="State 1">State 1</Option>
                  <Option value="State 2">State 2</Option>
                  <Option value="State 3">State 3</Option>
                </Select>
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
                name="gstNumber"
                label="GST Number"
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

      {/* Import Modal */}
      <Modal
        title="Import Customers from Excel"
        open={importModalVisible}
        onCancel={handleImportCancel}
        footer={null}
        width={600}
      >
        {importError && <Alert message={importError} type="error" style={{ marginBottom: 16 }} />}
        {importSuccess && <Alert message={importSuccess} type="success" style={{ marginBottom: 16 }} />}

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for CSV and Excel files only. Maximum file size is 5MB.
          </p>
        </Dragger>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleImportCancel}>Cancel</Button>
            <Button 
              type="primary" 
              onClick={handleImport} 
              loading={importLoading}
              disabled={fileList.length === 0}
            >
              Import
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerScreen;
