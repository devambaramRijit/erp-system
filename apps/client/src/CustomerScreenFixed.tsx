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
  InboxOutlined
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
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  gstNumber: '',
  openingBalance: 0,
  creditPeriod: 0,
  creditLimit: 0,
  customerType: 'Regular',
  notes: ''
};

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

  // Rest of the component would be here...
  // This is just a partial file with the fixed fetchCustomers function

  return (
    <div>
      <Title level={2}>Customer Management</Title>
      <p>Fixed version of CustomerScreen with corrected fetchCustomers function</p>
    </div>
  );
};

export default CustomerScreen;