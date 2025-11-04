
import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Breadcrumb,
  Statistic,
  Progress
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
  SaveOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  FileOutlined,
  HomeOutlined,
  UserAddOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { mockCustomerApi, CustomerData } from './services/mockApi';
import type { UploadFile } from 'antd/es/upload/interface';
import { colors, spacing, borderRadius, shadows } from './styles/DesignSystem';

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

const CustomerScreenEnhanced = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    direct: 0,
    referral: 0,
    website: 0,
    socialMedia: 0,
    advertisement: 0,
    other: 0
  });

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

        // Calculate statistics
        const newStats = {
          total: customerData.length,
          direct: customerData.filter(c => c.source === 'Direct').length,
          referral: customerData.filter(c => c.source === 'Referral').length,
          website: customerData.filter(c => c.source === 'Website').length,
          socialMedia: customerData.filter(c => c.source === 'Social Media').length,
          advertisement: customerData.filter(c => c.source === 'Advertisement').length,
          other: customerData.filter(c => c.source === 'Other').length
        };
        setStats(newStats);

        // Update localStorage with fresh data
        localStorage.setItem('customers', JSON.stringify(customerData));
      } catch (backendErr) {
        console.error('Error fetching customers from backend:', backendErr);
        message.error(`Error fetching customers: ${backendErr.response?.data?.message || backendErr.message || 'Unknown error'}`);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      message.error(`Error fetching customers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load customers when component mounts
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Apply filters when customers, searchTerm, filterSource, or filterState changes
  useEffect(() => {
    let result = customers;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        customer =>
          customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.mobileNumber1.includes(searchTerm) ||
          (customer.mobileNumber2 && customer.mobileNumber2.includes(searchTerm)) ||
          (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.state && customer.state.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply source filter
    if (filterSource !== 'all') {
      result = result.filter(customer => customer.source === filterSource);
    }

    // Apply state filter
    if (filterState !== 'all') {
      result = result.filter(customer => customer.state === filterState);
    }

    setFilteredCustomers(result);
  }, [customers, searchTerm, filterSource, filterState]);

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
        console.log('Update response:', response.data);
        message.success('Customer updated successfully!');
      } else {
        // Add new customer
        response = await axios.post('/api/customers', standardizedValues, { withCredentials: true });
        console.log('Create response:', response.data);
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
      if (err.response) {
        console.error('Error response:', err.response);
        console.error('Error response data:', err.response.data);
      }
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

  const handleFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      setSelectedFile(info.fileList[0].originFileObj);
    } else {
      setSelectedFile(null);
    }
  };

  const processLocalImport = async (file: File) => {
    try {
      console.log('Processing file locally:', file.name);

      // Read the file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Parsed Excel data:', jsonData);

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        message.error('No valid customer data found in the file');
        return;
      }

      console.log(`Found ${jsonData.length} rows in Excel file`);

      // Process the data
      console.log('Processing Excel data...');

      // Get headers to help with debugging
      const headers = Object.keys(jsonData[0] || {});
      console.log('Available headers in Excel:', headers);

      const importedCustomers = jsonData.map((row: any, index: number) => {
        console.log(`Processing row ${index + 1}:`, row);

        // Find the column names dynamically
        const nameKey = 'Name';
        const phoneKey = 'Phone';
        const altPhoneKey = 'Alternate Phone';
        const houseNumberKey = 'House Number';
        const cityKey = 'City';
        const districtKey = 'District';
        const stateKey = 'State';
        const pinCodeKey = 'PIN Code';
        const sourceKey = 'Source';
        const notesKey = 'Notes';

        console.log(`Column mapping for row ${index + 1}:`, {
          nameKey,
          phoneKey,
          cityKey,
          stateKey
        });

        // Extract values with fallbacks
        const customerName = String(row[nameKey] || `Customer ${index + 1}`).trim();
        const mobileNumber1 = String(row[phoneKey] || '').trim();
        const mobileNumber2 = String(row[altPhoneKey] || '').trim();
        const houseNumber = String(row[houseNumberKey] || '').trim();
        const city = String(row[cityKey] || '').trim();
        const district = String(row[districtKey] || '').trim();
        const state = String(row[stateKey] || '').trim();
        const pinCode = String(row[pinCodeKey] || '').trim();
        const source = String(row[sourceKey] || 'Direct').trim();
        const notes = String(row[notesKey] || '').trim();

        console.log(`Extracted values for row ${index + 1}:`, {
          customerName,
          mobileNumber1,
          city,
          state
        });

        // Validate required fields
        if (!customerName) {
          console.log(`Skipping row ${index + 1}: Missing customer name`);
          return null;
        }

        if (!mobileNumber1) {
          console.log(`Skipping row ${index + 1}: Missing mobile number`);
          return null;
        }

        // Create customer object with proper typing
        const customer: any = {
          id: `imported-${Date.now()}-${index}`,
          Name: customerName, // Use "Name" to match backend expectations
          mobileNumber1,
          source: source, // Use the extracted source value
        };

        // Add optional fields if they exist
        if (mobileNumber2) customer.mobileNumber2 = mobileNumber2;
        if (houseNumber) customer.houseNumber = houseNumber;
        if (city) customer.city = city;
        if (district) customer.district = district;
        if (state) customer.state = state;
        if (pinCode) customer.pinCode = pinCode;
        if (notes) customer.notes = notes;

        console.log(`Created customer object for row ${index + 1}:`, customer);
        return customer;
      }).filter(Boolean); // Remove null entries

      console.log(`Successfully processed ${importedCustomers.length} customers from Excel`);

      if (importedCustomers.length === 0) {
        message.error('No valid customer data found in the Excel file');
        return;
      }

      // Try to save each customer to the backend
      let successCount = 0;
      let failCount = 0;

      for (const customer of importedCustomers) {
        try {
          // Standardize the state name
          const standardizedCustomer = {
            ...customer,
            state: standardizeState(customer.state || '')
          };

          // Remove the temporary id before sending to backend
          delete standardizedCustomer.id;

          // Send to backend
          const response = await axios.post('/api/customers', standardizedCustomer, { withCredentials: true });
          console.log('Customer created:', response.data);
          successCount++;
        } catch (err: any) {
          console.error('Error saving customer to backend:', err);
          failCount++;
        }
      }

      // Refresh the customer list from backend
      fetchCustomers();

      // Show summary message
      if (successCount > 0) {
        message.success(`Successfully imported ${successCount} customers${failCount > 0 ? `, ${failCount} failed` : ''}`);
      } else {
        message.error('Failed to import any customers to the backend');
      }

      // Close modal and reset state
      setShowImportModal(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error processing file locally:', error);
      message.error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      message.error('Please select a file to import');
      return;
    }

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Send the file to the backend API endpoint
      let response;
      try {
        response = await axios.post('/api/customers/import-excel', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        });
      } catch (error) {
        console.error('Error importing Excel file:', error);
        if (error.response) {
          console.error('Error response:', error.response);
          console.error('Error response data:', error.response.data);
        }
        message.error(`Error importing file: ${error.message}`);
        return;
      }

      // Log the response for debugging
      console.log('API response:', response);
      console.log('Response data:', response.data);

      // Check if response has data about imported customers
      if (response.data.success) {
        const importedCustomers = response.data?.customers || [];
        const importedCount = importedCustomers.length;
        const skippedCount = response.data?.skippedRows?.length || 0;

        // Log the imported customers
        console.log('Imported customers:', importedCustomers);
        console.log('Imported count:', importedCount);

        if (importedCount > 0) {
          message.success(
            `Import completed. Added ${importedCount} customers. ` +
            `${skippedCount > 0 ? `Skipped ${skippedCount} rows.` : ''}`
          );
        } else {
          message.warning(`Import completed, but no customers were imported. Skipped ${skippedCount} rows.`);
        }

        // Reset form and refresh customer list
        setShowImportModal(false);
        setSelectedFile(null);
        fetchCustomers();
      }
    } catch (err: any) {
      console.error('Error importing customers:', err);

      // If the API fails, try to process locally
      console.log('API import failed, attempting local processing');
      try {
        await processLocalImport(selectedFile);
      } catch (localError: any) {
        message.error(`Failed to import customers: ${localError.message || 'Unknown error'}`);
      }
    }
  };

  // Get unique states for filter dropdown
  const uniqueStates = Array.from(new Set(customers.map(c => c.state).filter(Boolean))).sort();

  // Get source counts for visualization
  const sourceData = [
    { name: 'Direct', value: stats.direct, color: colors.primary[500] },
    { name: 'Referral', value: stats.referral, color: colors.success[500] },
    { name: 'Website', value: stats.website, color: colors.info[500] },
    { name: 'Social Media', value: stats.socialMedia, color: colors.warning[500] },
    { name: 'Advertisement', value: stats.advertisement, color: colors.error[500] },
    { name: 'Other', value: stats.other, color: colors.secondary[500] },
  ].filter(item => item.value > 0);

  return (
    <div className="customer-screen" style={{ padding: spacing[0] }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: spacing[4] }}>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
          <span>Dashboard</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <UserOutlined />
          <span>Customer Management</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div style={{ marginBottom: spacing[6] }}>
        <Title level={2} style={{ margin: 0 }}>Customer Management</Title>
        <Text type="secondary">Manage your customer database and track interactions</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: spacing[6] }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: borderRadius.lg, boxShadow: shadows.sm }}>
            <Statistic 
              title="Total Customers" 
              value={stats.total} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: colors.primary[600] }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: borderRadius.lg, boxShadow: shadows.sm }}>
            <Statistic 
              title="Direct Customers" 
              value={stats.direct} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: colors.success[600] }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: borderRadius.lg, boxShadow: shadows.sm }}>
            <Statistic 
              title="Referral Customers" 
              value={stats.referral} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: colors.info[600] }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: borderRadius.lg, boxShadow: shadows.sm }}>
            <Statistic 
              title="Other Sources" 
              value={stats.other + stats.website + stats.socialMedia + stats.advertisement} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: colors.warning[600] }}
            />
          </Card>
        </Col>
      </Row>

      {/* Source Distribution */}
      {sourceData.length > 0 && (
        <Card title="Customer Sources" style={{ marginBottom: spacing[6], borderRadius: borderRadius.lg, boxShadow: shadows.sm }}>
          <Row gutter={[16, 16]}>
            {sourceData.map((source, index) => (
              <Col xs={24} sm={12} md={8} lg={4} key={index}>
                <div style={{ textAlign: 'center' }}>
                  <Progress 
                    type="circle" 
                    percent={Math.round((source.value / stats.total) * 100)} 
                    size={80}
                    strokeColor={source.color}
                  />
                  <div style={{ marginTop: spacing[2] }}>
                    <Text strong>{source.name}</Text>
                    <div><Text type="secondary">{source.value} customers</Text></div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Controls */}
      <Card style={{ marginBottom: spacing[6], borderRadius: borderRadius.lg, boxShadow: shadows.sm }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search customers..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ borderRadius: borderRadius.md }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by source"
              value={filterSource}
              onChange={setFilterSource}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="all">All Sources</Option>
              <Option value="Direct">Direct</Option>
              <Option value="Referral">Referral</Option>
              <Option value="Website">Website</Option>
              <Option value="Social Media">Social Media</Option>
              <Option value="Advertisement">Advertisement</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by state"
              value={filterState}
              onChange={setFilterState}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="all">All States</Option>
              {uniqueStates.map(state => (
                <Option key={state} value={state}>{state}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setFormData(initialFormData);
                  setEditingCustomer(null);
                  setShowAddForm(true);
                }}
                style={{ borderRadius: borderRadius.md }}
              >
                Add Customer
              </Button>
            </Space>
          </Col>
        </Row>
        <Row style={{ marginTop: spacing[4] }}>
          <Col>
            <Text type="secondary">
              Showing {filteredCustomers.length} of {customers.length} customers
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Customer Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <div className="mt-4">Loading customers...</div>
        </div>
      ) : (
        <Card style={{ borderRadius: borderRadius.lg, boxShadow: shadows.sm }}>
          <Table
            dataSource={filteredCustomers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
              style: { marginTop: spacing[4] },
            }}
            scroll={{ x: 800 }}
            rowClassName={(record) => record.id === editingCustomer?.id ? 'row-highlight' : ''}
          >
            <Table.Column
              title="Name"
              dataIndex="customerName"
              key="customerName"
              render={(text: string) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    backgroundColor: colors.primary[100], 
                    padding: spacing[2], 
                    borderRadius: borderRadius.full, 
                    marginRight: spacing[3] 
                  }}>
                    <UserOutlined style={{ color: colors.primary[600] }} />
                  </div>
                  <span style={{ fontWeight: 'bold' }}>{text}</span>
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
              render={(source: string) => {
                let color = 'default';
                if (source === 'Direct') color = 'green';
                else if (source === 'Referral') color = 'blue';
                else if (source === 'Website') color = 'purple';
                else if (source === 'Social Media') color = 'orange';
                else if (source === 'Advertisement') color = 'red';
                return <Tag color={color}>{source}</Tag>;
              }}
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
                      onClick={() => handleEdit(record)}
                      style={{ borderRadius: borderRadius.md }}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(record.id)}
                      style={{ borderRadius: borderRadius.md }}
                    />
                  </Tooltip>
                </Space>
              )}
            />
          </Table>
        </Card>
      )}

      {/* Add/Edit Customer Modal */}
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        open={showAddForm}
        onCancel={() => {
          setShowAddForm(false);
          setEditingCustomer(null);
          setFormData(initialFormData);
          setSaveError(null);
        }}
        footer={null}
        width={700}
        style={{ borderRadius: borderRadius.lg }}
      >
        {saveError && (
          <Alert
            message="Error"
            description={saveError}
            type="error"
            showIcon
            style={{ marginBottom: spacing[4] }}
            closable
            onClose={() => setSaveError(null)}
          />
        )}
        <Form
          layout="vertical"
          initialValues={formData}
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Customer Name"
                name="customerName"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input placeholder="Enter customer name" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mobile Number 1"
                name="mobileNumber1"
                rules={[{ required: true, message: 'Please enter mobile number' }]}
              >
                <Input placeholder="Enter mobile number" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mobile Number 2"
                name="mobileNumber2"
              >
                <Input placeholder="Enter alternate mobile number" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Source"
                name="source"
              >
                <Select placeholder="Select source" style={{ borderRadius: borderRadius.md }}>
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

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="House Number"
                name="houseNumber"
              >
                <Input placeholder="Enter house number" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="City"
                name="city"
              >
                <Input placeholder="Enter city" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="District"
                name="district"
              >
                <Input placeholder="Enter district" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="State"
                name="state"
              >
                <Input placeholder="Enter state" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="PIN Code"
                name="pinCode"
              >
                <Input placeholder="Enter PIN code" style={{ borderRadius: borderRadius.md }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea rows={3} placeholder="Enter any additional notes" style={{ borderRadius: borderRadius.md }} />
          </Form.Item>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2] }}>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setEditingCustomer(null);
                setFormData(initialFormData);
                setSaveError(null);
              }}
              style={{ borderRadius: borderRadius.md }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSaving}
              icon={<SaveOutlined />}
              style={{ borderRadius: borderRadius.md }}
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
            style={{ borderRadius: borderRadius.md }}
          >
            Cancel
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            disabled={!selectedFile}
            icon={<ImportOutlined />}
            style={{ borderRadius: borderRadius.md }}
          >
            Import
          </Button>,
        ]}
        style={{ borderRadius: borderRadius.lg }}
      >
        <Dragger
          beforeUpload={() => false}
          onChange={handleFileChange}
          multiple={false}
          accept=".xlsx, .xls"
          style={{ borderRadius: borderRadius.md }}
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
          <div style={{ 
            marginTop: spacing[4], 
            padding: spacing[3], 
            backgroundColor: colors.primary[50], 
            borderRadius: borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FileOutlined style={{ color: colors.primary[500], marginRight: spacing[2] }} />
              <span>{selectedFile.name}</span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setSelectedFile(null)}
              style={{ borderRadius: borderRadius.full }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerScreenEnhanced;
