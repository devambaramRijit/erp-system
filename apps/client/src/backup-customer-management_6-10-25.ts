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
  DownloadOutlined
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
  houseNumber: '',
  city: '',
  district: '',
  state: '',
  pinCode: '',
  landmark: '',
  mobileNumber1: '',
  mobileNumber2: '',
  source: ''
};

const CustomerScreen = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<CustomerData, 'id'>>(initialFormData);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();

    const handleAuthError = () => {
      window.dispatchEvent(new CustomEvent('authRefresh'));
    };

    const handleCustomersUpdated = () => {
      fetchCustomers();
    };

    window.addEventListener('authError', handleAuthError);
    window.addEventListener('customersUpdated', handleCustomersUpdated);

    return () => {
      window.removeEventListener('authError', handleAuthError);
      window.removeEventListener('customersUpdated', handleCustomersUpdated);
    };
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = customers.filter(customer => 
        (customer.customerName && customer.customerName.toLowerCase().includes(term)) ||
        (customer.mobileNumber1 && customer.mobileNumber1.includes(term)) ||
        (customer.city && customer.city.toLowerCase().includes(term)) ||
        (customer.state && customer.state.toLowerCase().includes(term))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      try {
        const response = await axios.get('/api/customers', { withCredentials: true });
        const customerData = Array.isArray(response.data) ? response.data : [];
        
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

        const uniqueCustomers = Array.from(uniqueCustomersMap.values());
        
        if (duplicatesRemoved.length > 0) {
          console.log(`Removed ${duplicatesRemoved.length} duplicate customer entries`);
          localStorage.setItem('customers', JSON.stringify(uniqueCustomers));
          
          setTimeout(() => {
            alert(`Removed ${duplicatesRemoved.length} duplicate customer entries to ensure data integrity.`);
          }, 500);
        }
        
        setCustomers(uniqueCustomers);
        setFilteredCustomers(uniqueCustomers);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (values: any) => {
    setSaveError(null);
    setIsSaving(true);

    try {
      console.log('Saving customer data:', values);
      
      const normalizedData = {
        ...values,
        state: standardizeState(values.state)
      };
      
      let updatedCustomers;
      
      if (editingCustomer) {
        console.log(`Updating customer with ID: ${editingCustomer.id}`);

        try {
          await axios.put(`/api/customers/${editingCustomer.id}`, normalizedData, {
            withCredentials: true
          });
          console.log('Backend update successful');
        } catch (backendErr) {
          console.error('Backend update failed, falling back to mock API:', backendErr);
          await mockCustomerApi.updateCustomer(editingCustomer.id, normalizedData);
          console.log('Mock API update successful');
        }
        
        updatedCustomers = customers.map(customer => 
          customer.id === editingCustomer.id ? { ...normalizedData, id: editingCustomer.id } : customer
        );
      } else {
        console.log('Creating new customer');
        
        const isDuplicate = customers.some(customer => {
          return (
            customer.customerName.toLowerCase() === normalizedData.customerName.toLowerCase() &&
            customer.mobileNumber1 === normalizedData.mobileNumber1
          );
        });
        
        if (isDuplicate) {
          alert('A customer with this name and mobile number already exists!');
          setIsSaving(false);
          return;
        }
        
        let newCustomer;
        try {
          const response = await axios.post('/api/customers', normalizedData, {
            withCredentials: true
          });
          newCustomer = response.data;
          console.log('Backend create successful');
        } catch (backendErr) {
          console.error('Backend create failed, falling back to mock API:', backendErr);
          newCustomer = await mockCustomerApi.createCustomer(normalizedData);
          console.log('Mock API create successful');
        }
        
        updatedCustomers = [...customers, newCustomer];
      }
      
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));

      window.dispatchEvent(new CustomEvent('customersUpdated'));

      resetForm();

      try {
        const response = await axios.get('/api/customers', { withCredentials: true });
        if (response.data) {
          setCustomers(response.data);
          setFilteredCustomers(response.data);
          localStorage.setItem('customers', JSON.stringify(response.data));
        }
      } catch (err) {
        console.error('Error refreshing customers from backend:', err);
        setCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers);
      }
    } catch (err: any) {
      console.error('Error saving customer:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save customer. Please try again.';
      setSaveError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    const values = {
      customerName: customer.customerName,
      houseNumber: customer.houseNumber,
      city: customer.city,
      district: customer.district,
      state: standardizeState(customer.state),
      pinCode: customer.pinCode,
      landmark: customer.landmark,
      mobileNumber1: customer.mobileNumber1,
      mobileNumber2: customer.mobileNumber2,
      source: customer.source
    };
    setFormData(values);
    form.setFieldsValue(values);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      let updatedCustomers;
      try {
        try {
          await axios.delete(`/api/customers/${id}`, {
            withCredentials: true
          });
          console.log('Backend delete successful');
        } catch (backendErr) {
          console.error('Backend delete failed, falling back to mock API:', backendErr);
          await mockCustomerApi.deleteCustomer(id);
          console.log('Mock API delete successful');
        }
        
        try {
          const response = await axios.get('/api/customers', { withCredentials: true });
          if (response.data) {
            const freshCustomers = response.data;
            setCustomers(freshCustomers);
            setFilteredCustomers(freshCustomers.filter(customer => 
              (customer.customerName && customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (customer.mobileNumber1 && customer.mobileNumber1.includes(searchTerm)) ||
              (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (customer.state && customer.state.toLowerCase().includes(searchTerm.toLowerCase()))
            ));
            localStorage.setItem('customers', JSON.stringify(freshCustomers));
          }
        } catch (err) {
          console.error('Error refreshing customers from backend:', err);
          updatedCustomers = customers.filter(customer => customer.id !== id);
          localStorage.setItem('customers', JSON.stringify(updatedCustomers));
          setCustomers(updatedCustomers);
          setFilteredCustomers(updatedCustomers.filter(customer => 
            (customer.customerName && customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.mobileNumber1 && customer.mobileNumber1.includes(searchTerm)) ||
            (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.state && customer.state.toLowerCase().includes(searchTerm.toLowerCase()))
          ));
        }

        window.dispatchEvent(new CustomEvent('customersUpdated'));
        
        setCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers.filter(customer => 
          (customer.customerName && customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.mobileNumber1 && customer.mobileNumber1.includes(searchTerm)) ||
          (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.state && customer.state.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
      } catch (err) {
        console.error('Error deleting customer:', err);
        alert(`Error deleting customer: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCustomer(null);
    setShowAddForm(false);
    form.resetFields();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
  };

  const handleImportFile = async () => {
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }

    console.log('Importing file:', selectedFile.name);

    try {
      console.log('Starting import process');

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await axios.post('/api/customers/import', formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Backend import successful', response.data);
        alert(`Import successful: ${response.data.message || 'Customers imported successfully'}`);

        try {
          const response = await axios.get('/api/customers', { withCredentials: true });
          if (response.data) {
            setCustomers(response.data);
            setFilteredCustomers(response.data);
            localStorage.setItem('customers', JSON.stringify(response.data));
          }
        } catch (err) {
          console.error('Error refreshing customers from backend:', err);
          fetchCustomers();
        }
        setShowImportModal(false);
        setSelectedFile(null);
        return;
      } catch (backendErr) {
        console.error('Backend import failed:', backendErr);
        alert(`Import failed: ${backendErr.response?.data?.message || backendErr.message || 'Unknown error'}`);
        setShowImportModal(false);
        setSelectedFile(null);
      }
    } catch (err: any) {
      console.error('Error importing customers:', err);
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // =================================================================
  // == THIS IS THE CORRECTED FUNCTION ==
  // It now generates the template with headers that match the backend validation logic.
  // =================================================================
  const handleDownloadTemplate = () => {
    // Import XLSX library dynamically
    import('xlsx').then(XLSX => {
      // Create a workbook with a worksheet
      const wb = XLSX.utils.book_new();
      
      // Create template data with headers that match backend expectations
      const templateData = [
        // Headers - using the exact field names that backend recognizes
        [
          'customerName',  // Backend maps this to CUSTOMER NAME
          'addressLine1',  // Backend maps this to HOUSE NO./ FLAT NO./ STREET NO.
          'city',         // Backend maps this to CITY/TOWN/VILLAGE
          'district',     // Backend maps this to P.O/DISTRICT
          'state',        // Backend maps this to STATE
          'postalCode',   // Backend maps this to PIN CODE
          'notes',        // Backend maps this to LANDMARK
          'mobileNumber1',// Backend maps this to MOBILE NO.
          'mobileNumber2',// Backend maps this to MOBILE NO. 2
          'email',        // Backend maps this to EMAIL
          'source'        // Backend maps this to SOURCE
        ],
        // Sample data
        [
          'John Doe',
          '123, Main Street',
          'Mumbai',
          'Mumbai',
          'Maharashtra',
          '400001',
          'Near Police Station',
          '9876543210',
          '',
          'john@example.com',
          'Website'
        ],
        [
          'Jane Smith',
          '456, Park Avenue',
          'Delhi',
          'New Delhi',
          'Delhi',
          '110001',
          'Opposite Market',
          '8765432109',
          '9876543211',
          'jane@example.com',
          'Reference'
        ]
      ];
      
      // Create worksheet from template data
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      
      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 20 },  // CUSTOMER NAME
        { wch: 25 },  // HOUSE NO./ FLAT NO./ STREET NO.
        { wch: 18 },  // CITY/TOWN/VILLAGE
        { wch: 15 },  // P.O/DISTRICT
        { wch: 15 },  // STATE
        { wch: 10 },  // PIN CODE
        { wch: 20 },  // LANDMARK
        { wch: 15 },  // MOBILE NO.
        { wch: 15 },  // MOBILE NO. 2
        { wch: 20 },  // EMAIL
        { wch: 15 }   // SOURCE
      ];
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Customer Template");
      
      // Add a second sheet with instructions
      const instructionsData = [
        ['Customer Import Instructions'],
        [''],
        ['1. Fill in the customer details in the "Customer Template" sheet'],
        ['2. Do not modify the column headers (use the exact field names provided)'],
        ['3. Required fields: customerName and mobileNumber1'],
        ['4. mobileNumber1 is mandatory and should be a 10-digit number'],
        ['5. state should be in proper format (e.g., Maharashtra, Delhi)'],
        ['6. postalCode should be a 6-digit number'],
        ['7. Valid source values: Website, Reference, Social Media, Walk-in, Other'],
        ['8. email should be in valid format if provided'],
        ['9. Save the file as Excel (.xlsx) format before importing']
      ];
      
      const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
      instructionsWs['!cols'] = [{ wch: 50 }]; // Set column width for instructions
      XLSX.utils.book_append_sheet(wb, instructionsWs, "Instructions");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, "customer_import_template.xlsx");
    }).catch(err => {
      console.error('Error loading XLSX library:', err);
      alert('Error downloading template. Please try again.');
    });
  };
  
  // =================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        
        {/* Action Buttons updated with the new button */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowAddForm(!showAddForm)}
            size="large"
          >
            {showAddForm ? 'Hide Form' : 'Add New Customer'}
          </Button>
          <Space>
            <Button 
              type="default" 
              icon={<ImportOutlined />} 
              onClick={() => setShowImportModal(true)}
              size="large"
              style={{ backgroundColor: '#52c41a', color: 'white' }}
            >
              Import from Excel
            </Button>
            <Button 
              type="default" 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadTemplate}
              size="large"
            >
              Download Template
            </Button>
          </Space>
        </div>

        {/* Add/Edit Customer Form */}
        {showAddForm && (
          <Card 
            className="mb-6" 
            title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            extra={editingCustomer && (
              <Button 
                icon={<CloseOutlined />} 
                onClick={resetForm}
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
            onFinish={handleSubmit}
            className="customer-form"
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="Customer Name" 
                  name="customerName"
                  rules={[{ required: true, message: 'Please input customer name!' }]}
                >
                  <Input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    prefix={<UserOutlined />}
                    placeholder="Enter customer name"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item 
                  label="Mobile Number 1" 
                  name="mobileNumber1"
                  rules={[{ required: true, message: 'Please input mobile number!' }]}
                >
                  <Input
                    type="tel"
                    name="mobileNumber1"
                    value={formData.mobileNumber1}
                    onChange={handleInputChange}
                    placeholder="Enter primary mobile number"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Mobile Number 2" name="mobileNumber2">
                  <Input
                    type="tel"
                    name="mobileNumber2"
                    value={formData.mobileNumber2}
                    onChange={handleInputChange}
                    placeholder="Enter secondary mobile number"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Source" name="source">
                  <Input
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    placeholder="Enter source"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="House/Flat/Street No." name="houseNumber">
                  <Input
                    name="houseNumber"
                    value={formData.houseNumber}
                    onChange={handleInputChange}
                    placeholder="Enter house/flat/street number"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="City/Town/Village" name="city">
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city/town/village"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="P.O/District" name="district">
                  <Input
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Enter district"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="State" name="state">
                  <Select
                    name="state"
                    value={formData.state}
                    onChange={(value) => handleInputChange({ target: { name: 'state', value } } as any)}
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
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Puducherry">Puducherry</option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="PIN Code" name="pinCode">
                  <Input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    placeholder="Enter PIN code"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Landmark" name="landmark">
                  <Input
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="Enter landmark"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="mt-4 flex justify-end space-x-3">
              <Button
                onClick={resetForm}
              >
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
        )}

        {/* Search Bar */}
        <div className="mb-6">
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
                title: 'SL NO', // Added SL NO
                key: 'slNo',
                render: (text, record, index) => index + 1,
              },
              {
                title: 'CUSTOMER NAME',
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
                title: 'HOUSE NO./ FLAT NO./ STREET NO.',
                dataIndex: 'houseNumber',
                key: 'houseNumber',
              },
              {
                title: 'CITY/TOWN/VILLAGE',
                dataIndex: 'city',
                key: 'city',
              },
              {
                title: 'P.O/DISTRICT',
                dataIndex: 'district',
                key: 'district',
              },
              {
                title: 'STATE',
                dataIndex: 'state',
                key: 'state',
                render: (text) => standardizeState(text), // Ensure state is standardized for display
              },
              {
                title: 'PIN CODE',
                dataIndex: 'pinCode',
                key: 'pinCode',
              },
              {
                title: 'LANDMARK',
                dataIndex: 'landmark',
                key: 'landmark',
              },
              {
                title: 'MOBILE NO.', // Primary Mobile Number
                dataIndex: 'mobileNumber1',
                key: 'mobileNumber1',
              },
              {
                title: 'MOBILE NO. 2', // Secondary Mobile Number
                dataIndex: 'mobileNumber2',
                key: 'mobileNumber2',
              },
              {
                title: 'SOURCE',
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

        {/* Import Modal */}
        <Modal
          title="Import Customers from Excel"
          open={showImportModal}
          onCancel={() => setShowImportModal(false)}
          footer={null}
          width={600}
        >

            {/* Updated modal instructions */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">
                Upload an Excel or CSV file to bulk-import customers.
              </p>
              <Alert
                message="Please use the template to ensure correct formatting."
                description="The first row of your file must contain the exact headers provided in the template file."
                type="info"
                showIcon
                className="mb-4"
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <InboxOutlined className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="excelFileInput"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        {/* Updated accept attribute */}
                        <input id="excelFileInput" name="excelFileInput" type="file" className="sr-only" onChange={handleFileUpload} accept=".xlsx, .xls, .csv" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">XLS, XLSX, CSV up to 10MB</p>
                    {selectedFile && (
                      <p className="text-sm text-green-600 mt-2">Selected file: {selectedFile.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportFile}
                disabled={!selectedFile}
                className={`px-4 py-2 rounded-md ${selectedFile ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Import Customers
              </button>
            </div>
          </Modal>
      </div>
    </div>
  );
};

export default CustomerScreen;