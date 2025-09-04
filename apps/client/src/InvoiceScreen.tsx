
import React, { useState, useRef } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { CustomerData } from './services/mockApi';
import ProductDetailsSection from './ProductDetailsSection';
import './InvoiceScreen.css';

// Add custom styles for the product dropdown
const productDropdownStyles = `
  /* Product dropdown in Add/Edit Item modal */
  .ant-modal .ant-select-dropdown {
    min-width: 550px !important;
    max-width: 650px !important;
  }
  
  .ant-modal .ant-select-item {
    height: auto !important;
    min-height: 100px !important;
    padding: 12px 15px !important;
    line-height: 1.5 !important;
    white-space: normal !important;
  }
  
  .ant-modal .ant-select-item-option-content {
    padding: 6px 0 !important;
  }
  
  .ant-modal .ant-select-item-option-content div {
    margin-bottom: 4px !important;
  }
  
  /* Ensure dropdown appears above modal */
  .ant-modal .ant-select-dropdown {
    z-index: 1050 !important;
  }
  
  /* Fix for the selected item display - show only product name */
  .ant-modal .ant-select-selection-item {
    height: auto !important;
    min-height: 32px !important;
    padding: 4px 8px !important;
    line-height: 1.4 !important;
    white-space: nowrap !important;
    text-overflow: ellipsis !important;
    overflow: hidden !important;
  }
`;

// Create style element and append to head
const styleElement = document.createElement('style');
styleElement.innerHTML = productDropdownStyles;
document.head.appendChild(styleElement);

const { Option } = Select;
const { TextArea } = Input;

interface Product {
  id: string;
  sku: string;
  name: string;
  size: string;
  unit: string;
  quantity: number;
  price: number;
  productType: string;
  category?: string;
}

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  productCategory?: string;
  pricePerInch?: number;
  size?: number;
  cpPerPc?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  invoiceType: 'manufactured' | 'traded';
  items: InvoiceItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  advancePayment: number;
  shippingCharges: number;
  packingCharges: number;
  total: number;
  notes?: string;
}

const InvoiceScreen: React.FC = () => {
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>(() => {
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    return savedProductTypes ? JSON.parse(savedProductTypes) : ['Standard', 'Premium', 'Custom'];
  });
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'decimal'>('percentage');
  const [visible, setVisible] = useState(false);
  const [itemVisible, setItemVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Load current invoice from localStorage on component mount
  React.useEffect(() => {
    const savedCurrentInvoice = localStorage.getItem('currentInvoice');
    if (savedCurrentInvoice) {
      try {
        const parsedInvoice = JSON.parse(savedCurrentInvoice);
        setCurrentInvoice(parsedInvoice);
        form.setFieldsValue(parsedInvoice);
      } catch (error) {
        console.error('Error parsing saved invoice:', error);
      }
    }

    // Load invoices from localStorage
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      try {
        const parsedInvoices = JSON.parse(savedInvoices);
        setInvoices(parsedInvoices);
      } catch (error) {
        console.error('Error parsing saved invoices:', error);
      }
    }
  }, []);

  // Save current invoice to localStorage whenever it changes
  React.useEffect(() => {
    if (currentInvoice) {
      localStorage.setItem('currentInvoice', JSON.stringify(currentInvoice));
    }
  }, [currentInvoice]);

  // Save invoices to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Sample data
  React.useEffect(() => {
    // Load customers from localStorage
    const savedCustomers = localStorage.getItem('mockCustomers');
    if (savedCustomers) {
      const customersData = JSON.parse(savedCustomers);
      setCustomers(customersData);
    } else {
      // Fallback to mock customers if no data in localStorage
      const mockCustomers: CustomerData[] = [
        {
          id: '1',
          customerName: 'John Doe',
          houseNumber: '123 Main St',
          city: 'City',
          district: 'District',
          state: 'State',
          pinCode: '12345',
          landmark: 'Near Landmark',
          mobileNumber1: '1234567890',
          mobileNumber2: '',
          source: 'Direct',
        },
        {
          id: '2',
          customerName: 'Jane Smith',
          houseNumber: '456 Oak Ave',
          city: 'Town',
          district: 'District',
          state: 'State',
          pinCode: '67890',
          landmark: 'Near Park',
          mobileNumber1: '9876543210',
          mobileNumber2: '',
          source: 'Referral',
        },
      ];
      setCustomers(mockCustomers);
    }

    // Load products and categories from API (same as SecondProductListTab)
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await api.get('/inventory');
        // Transform the data to match our Product interface
        const transformedProducts = productsResponse.map((item: any) => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          size: item.size || 0,
          unit: item.unit || 'pcs',
          quantity: item.quantity || 0,
          price: item.price || 0,
          productType: item.productType || 'Traded',
          category: item.category || 'General'
        }));
        setProducts(transformedProducts);
        
        // Extract unique categories from products
        const uniqueCategories = Array.from(new Set(transformedProducts.map(p => p.category).filter(Boolean))) as string[];
        if (uniqueCategories.length > 0) {
          setProductTypes(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to mock data if API fails
        const mockProducts: Product[] = [
          { id: '1', sku: 'SKU001', name: 'Product A', size: '0', unit: 'pcs', quantity: 100, price: 10.99, productType: 'Electronics' },
          { id: '2', sku: 'SKU002', name: 'Product B', size: '0', unit: 'kg', quantity: 50, price: 5.99, productType: 'Groceries' },
          { id: '3', sku: 'SKU003', name: 'Product C', size: '0', unit: 'ltr', quantity: 30, price: 7.99, productType: 'Beverages' },
        ];
        setProducts(mockProducts);
        
        // Set default categories
        setProductTypes(['Electronics', 'Groceries', 'Beverages']);
      }
    };
    
    fetchData();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: currentInvoice ? `Invoice_${currentInvoice.invoiceNumber}` : 'Invoice',
    onBeforeGetContent: () => {
      return Promise.resolve();
    },
    onPrintError: (errorLocation) => {
      console.error('Error printing:', errorLocation);
      message.error('Failed to print invoice');
    }
  });

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    const newInvoice = {
      id: '',
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      billingAddress: '',
      invoiceType: 'traded',
      items: [],
      subtotal: 0,
      discountRate: 0,
      discountAmount: 0,
      advancePayment: 0,
      shippingCharges: 0,
      packingCharges: 0,
      total: 0,
    };
    form.setFieldsValue(newInvoice);
    setCurrentInvoice(newInvoice);
    setVisible(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue(invoice);
    setCurrentInvoice(invoice);
    setVisible(true);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter(invoice => invoice.id !== id));
    message.success('Invoice deleted successfully');
  };

  const handleSaveInvoice = () => {
    form
      .validateFields()
      .then(values => {
        if (currentInvoice) {
          const updatedInvoice: Invoice = {
            ...currentInvoice,
            ...values,
            id: editingInvoice ? editingInvoice.id : Date.now().toString(),
          };

          if (editingInvoice) {
            const updatedInvoices = invoices.map(invoice => invoice.id === editingInvoice.id ? updatedInvoice : invoice);
            setInvoices(updatedInvoices);
            localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
            message.success('Invoice updated successfully');
          } else {
            const newInvoices = [...invoices, updatedInvoice];
            setInvoices(newInvoices);
            localStorage.setItem('invoices', JSON.stringify(newInvoices));
            message.success('Invoice added successfully');
          }

          setVisible(false);
          // Clear the current invoice from localStorage after saving
          localStorage.removeItem('currentInvoice');
        }
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleAddItem = () => {
    itemForm.resetFields();
    setSelectedProductType('');
    setFilteredProducts([]);
    setItemVisible(true);
  };

  const handleSaveItem = () => {
    itemForm
      .validateFields()
      .then(values => {
        if (currentInvoice) {
          const product = products.find(p => p.id === values.productId);
          if (product) {
            let newItem: InvoiceItem;
            
            if (currentInvoice.invoiceType === 'manufactured') {
              const pricePerInch = values.pricePerInch || 0;
              const size = values.size || 0;
              const cpPerPc = pricePerInch * size;
              const total = cpPerPc * values.quantity;
              
              newItem = {
                id: Date.now().toString(),
                productId: values.productId,
                name: product.name,
                unit: product.unit,
                quantity: values.quantity,
                price: product.price,
                total: total,
                productCategory: values.productCategory || product.productType || '',
                pricePerInch: pricePerInch,
                size: size,
                cpPerPc: cpPerPc,
              };
            } else {
              newItem = {
                id: Date.now().toString(),
                productId: values.productId,
                name: product.name,
                unit: product.unit,
                quantity: values.quantity,
                price: product.price,
                total: product.price * values.quantity,
                productCategory: values.productCategory || product.productType || '',
              };
            }

            const updatedItems = [...currentInvoice.items, newItem];
            const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
            const subtotalAfterAdvance = subtotal - (currentInvoice.advancePayment || 0);
            let discountAmount;
            
            if (discountType === 'percentage') {
              // Calculate discount as percentage of subtotal
              discountAmount = (subtotalAfterAdvance * currentInvoice.discountRate) / 100;
            } else {
              // Use discount as fixed decimal amount
              discountAmount = currentInvoice.discountRate;
            }
            const total = subtotalAfterAdvance - discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges;

            const updatedInvoice = {
              ...currentInvoice,
              items: updatedItems,
              subtotal,
              discountAmount,
              total,
            };
            setCurrentInvoice(updatedInvoice);
            localStorage.setItem('currentInvoice', JSON.stringify(updatedInvoice));

            setItemVisible(false);
          }
        }
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleDeleteItem = (id: string) => {
    if (currentInvoice) {
      const updatedItems = currentInvoice.items.filter(item => item.id !== id);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const subtotalAfterAdvance = subtotal - (currentInvoice.advancePayment || 0);
      let discountAmount;
      
      if (discountType === 'percentage') {
        // Calculate discount as percentage of subtotal
        discountAmount = (subtotalAfterAdvance * currentInvoice.discountRate) / 100;
      } else {
        // Use discount as fixed decimal amount
        discountAmount = currentInvoice.discountRate;
      }
      const total = subtotalAfterAdvance - discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges;

      const updatedInvoice = {
        ...currentInvoice,
        items: updatedItems,
        subtotal,
        discountAmount,
        total,
      };
      setCurrentInvoice(updatedInvoice);
      localStorage.setItem('currentInvoice', JSON.stringify(updatedInvoice));
    }
  };

  const handleEditItem = (item: InvoiceItem) => {
    if (currentInvoice) {
      // Find the product to get its details
      const product = products.find(p => p.id === item.productId);
      if (product) {
        // Set form values with current item data
        itemForm.setFieldsValue({
          productId: item.productId,
          productCategory: item.productCategory || product.productType || '',
          quantity: item.quantity,
          ...(currentInvoice.invoiceType === 'manufactured' && {
            pricePerInch: item.pricePerInch,
            size: item.size
          })
        });
        
        // Store the item ID being edited
        itemForm.setFieldsValue({ editingItemId: item.id });
        
        // Open the item modal
        setItemVisible(true);
      }
    }
  };

  const handleUpdateItem = () => {
    itemForm
      .validateFields()
      .then(values => {
        if (currentInvoice) {
          const editingItemId = values.editingItemId;
          const product = products.find(p => p.id === values.productId);
          
          if (product && editingItemId) {
            // Find the item being edited
            const itemIndex = currentInvoice.items.findIndex(item => item.id === editingItemId);
            
            if (itemIndex !== -1) {
              let updatedItem: InvoiceItem;
              
              if (currentInvoice.invoiceType === 'manufactured') {
                const pricePerInch = values.pricePerInch || 0;
                const size = values.size || 0;
                const cpPerPc = pricePerInch * size;
                const total = cpPerPc * values.quantity;
                
                updatedItem = {
                  ...currentInvoice.items[itemIndex],
                  productId: values.productId,
                  name: product.name,
                  unit: product.unit,
                  quantity: values.quantity,
                  price: product.price,
                  total: total,
                  productCategory: values.productCategory || product.productType || '',
                  pricePerInch: pricePerInch,
                  size: size,
                  cpPerPc: cpPerPc,
                };
              } else {
                updatedItem = {
                  ...currentInvoice.items[itemIndex],
                  productId: values.productId,
                  name: product.name,
                  unit: product.unit,
                  quantity: values.quantity,
                  price: product.price,
                  total: product.price * values.quantity,
                  productCategory: values.productCategory || product.productType || '',
                };
              }
              
              // Create updated items array
              const updatedItems = [...currentInvoice.items];
              updatedItems[itemIndex] = updatedItem;
              
              // Recalculate totals
              const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
              let discountAmount;
              
              if (discountType === 'percentage') {
                // Calculate discount as percentage of subtotal
                discountAmount = (subtotal * currentInvoice.discountRate) / 100;
              } else {
                // Use discount as fixed decimal amount
                discountAmount = currentInvoice.discountRate;
              }
              const total = subtotal - discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges;
              
              setCurrentInvoice({
                ...currentInvoice,
                items: updatedItems,
                subtotal,
                discountAmount,
                total,
              });
              
              setItemVisible(false);
            }
          }
        }
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleDiscountChange = (value: number) => {
    if (currentInvoice) {
      let discountAmount;
      
      if (discountType === 'percentage') {
        // Calculate discount as percentage of subtotal
        discountAmount = (currentInvoice.subtotal * value) / 100;
      } else {
        // Use discount as fixed decimal amount
        discountAmount = value;
      }
      
      const total = currentInvoice.subtotal - discountAmount - (currentInvoice.advancePayment || 0) + currentInvoice.shippingCharges + currentInvoice.packingCharges;

      setCurrentInvoice({
        ...currentInvoice,
        discountRate: value,
        discountAmount,
        total,
      });
    }
  };

  const handleShippingChargesChange = (value: number) => {
    if (currentInvoice) {
      const total = currentInvoice.subtotal - currentInvoice.discountAmount - (currentInvoice.advancePayment || 0) + value + currentInvoice.packingCharges;

      setCurrentInvoice({
        ...currentInvoice,
        shippingCharges: value,
        total,
      });
    }
  };

  const handlePackingChargesChange = (value: number) => {
    if (currentInvoice) {
      const total = currentInvoice.subtotal - currentInvoice.discountAmount - (currentInvoice.advancePayment || 0) + currentInvoice.shippingCharges + value;

      setCurrentInvoice({
        ...currentInvoice,
        packingCharges: value,
        total,
      });
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      
      // Format address for display
      const formatAddress = (customer: CustomerData) => {
        return `${customer.houseNumber}, ${customer.city}, ${customer.district}, ${customer.state} - ${customer.pinCode}${customer.landmark ? ` (Landmark: ${customer.landmark})` : ''}`;
      };
      
      const billingAddress = formatAddress(customer);
      
      form.setFieldsValue({
        customerName: customer.customerName,
        customerEmail: customer.mobileNumber1,
        billingAddress: billingAddress,
      });

      if (currentInvoice) {
        setCurrentInvoice({
          ...currentInvoice,
          customerName: customer.customerName,
          customerEmail: customer.mobileNumber1,
          billingAddress: billingAddress,
        });
      }
    }
  };

  const handleSaveNewCustomer = () => {
    form.validateFields(['customerName', 'customerEmail', 'billingAddress']).then(values => {
      const newCustomer = {
        id: Date.now().toString(),
        customerName: values.customerName,
        mobileNumber1: values.customerEmail,
        email: values.customerEmail,
        billingAddress: values.billingAddress,
        shippingAddress: values.billingAddress,
        city: '',
        state: '',
      };
      
      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(newCustomer);
      message.success('New customer saved successfully!');
    }).catch(error => {
      console.log('Validation error:', error);
      message.error('Please fill in all required customer fields');
    });
  };

  const getManufacturedColumns = () => [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Product Type',
      dataIndex: 'productCategory',
      key: 'productCategory',
    },
    {
      title: 'Price Per Inch',
      dataIndex: 'pricePerInch',
      key: 'pricePerInch',
      render: (price: number) => `₹${price ? price.toFixed(2) : '0.00'}`,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'CP/pc',
      dataIndex: 'cpPerPc',
      key: 'cpPerPc',
      render: (cpPerPc: number, record: InvoiceItem) => {
        const calculated = (record.pricePerInch || 0) * (record.size || 0);
        return `₹${calculated.toFixed(2)}`;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number, record: InvoiceItem) => {
        const cpPerPc = (record.pricePerInch || 0) * (record.size || 0);
        const calculated = cpPerPc * (record.quantity || 0);
        return `₹${calculated.toFixed(2)}`;
      },
    },
  ];

  const getTradedColumns = () => [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Product Type',
      dataIndex: 'productCategory',
      key: 'productCategory',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `₹${price ? price.toFixed(2) : '0.00'}`,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number, record: InvoiceItem) => {
        const calculated = (record.price || 0) * (record.quantity || 0);
        return `₹${calculated.toFixed(2)}`;
      },
    },
  ];

  // Action column for both invoice types
  const actionColumn = {
    title: 'Action',
    key: 'action',
    render: (text: string, record: InvoiceItem) => (
      <Space>
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          size="small" 
          onClick={() => handleEditItem(record)}
        >
          Edit
        </Button>
        <Popconfirm
          title="Are you sure to delete this item?"
          onConfirm={() => handleDeleteItem(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      </Space>
    ),
  };

  // Function to refresh data from localStorage
  const refreshData = () => {
    // Refresh customers
    const savedCustomers = localStorage.getItem('mockCustomers');
    if (savedCustomers) {
      const customersData = JSON.parse(savedCustomers);
      setCustomers(customersData);
    }
    
    // Refresh products
    const savedInventoryItems = localStorage.getItem('inventoryItemsWithProductType');
    if (savedInventoryItems) {
      const inventoryItems = JSON.parse(savedInventoryItems);
      // Convert inventory items to products format
      const productsFromInventory = inventoryItems.map((item: any) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        size: item.size || 0,
        unit: item.unit || 'pcs',
        quantity: item.quantity || 0,
        price: item.price || 0,
        productType: item.productType || 'Traded',
        category: item.productType || 'General' // Use productType as category
      }));
      setProducts(productsFromInventory);
    }

    // Refresh product types
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    if (savedProductTypes) {
      const productTypesData = JSON.parse(savedProductTypes);
      setProductTypes(productTypesData);
    }
    
    message.success('Data refreshed successfully');
  };

  // Get columns based on invoice type
  const itemColumns = currentInvoice?.invoiceType === 'manufactured' 
    ? [...getManufacturedColumns(), actionColumn] 
    : [...getTradedColumns(), actionColumn];

  const invoiceColumns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'invoiceType',
      render: (type: 'manufactured' | 'traded') => (
        <span style={{ 
          textTransform: 'capitalize',
          color: type === 'manufactured' ? '#1890ff' : '#52c41a' 
        }}>
          {type}
        </span>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `₹${total.toFixed(2)}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: string, record: Invoice) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditInvoice(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this invoice?"
            onConfirm={() => handleDeleteInvoice(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
          <Button
            type="default"
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => {
              setCurrentInvoice(record);
              setTimeout(() => {
                if (invoiceRef.current) {
                  handlePrint();
                } else {
                  message.error('Error preparing invoice for printing');
                }
              }, 300);
            }}
          >
            Print
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="invoice-screen">
      <Card>
        <div className="invoice-header">
          <h2>Invoice Management</h2>
          <Space>
            <Button icon={<EditOutlined />} onClick={refreshData}>
              Refresh Data
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvoice}>
              Add Invoice
            </Button>
          </Space>
        </div>
        <Table dataSource={invoices} columns={invoiceColumns} rowKey="id" />
      </Card>

      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
        visible={visible}
        onOk={handleSaveInvoice}
        onCancel={() => setVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveInvoice} icon={<SaveOutlined />}>
            {editingInvoice ? 'Update' : 'Save'}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button icon={<EditOutlined />} onClick={refreshData}>
            Refresh Data
          </Button>
        </div>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice Number"
                rules={[{ required: true, message: 'Please input invoice number!' }]}
              >
                <Input placeholder="Enter invoice number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please input date!' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceType"
                label="Invoice Type"
                rules={[{ required: true, message: 'Please select invoice type!' }]}
                initialValue="traded"
              >
                <Select
                  placeholder="Select invoice type"
                  onChange={(value) => {
                    if (currentInvoice) {
                      setCurrentInvoice({
                        ...currentInvoice,
                        invoiceType: value,
                        items: []
                      });
                    }
                  }}
                >
                  <Option value="traded">Traded</Option>
                  <Option value="manufactured">Manufactured</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Select Customer"
                rules={[{ required: true, message: 'Please select a customer!' }]}
              >
                <Select
                  showSearch
                  placeholder="Search and select a customer"
                  optionFilterProp="children"
                  onChange={handleCustomerSelect}
                  filterOption={(input, option) =>
                    option?.children?.props?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      <div>
                        <div><strong>{customer.customerName}</strong></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {customer.mobileNumber1} {customer.mobileNumber2 ? `| ${customer.mobileNumber2}` : ''}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {customer.city}, {customer.state}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please input customer name!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerEmail"
                label="Customer Email/Phone"
                rules={[{ required: true, message: 'Please input customer email/phone!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="billingAddress"
                label="Billing Address"
                rules={[{ required: true, message: 'Please input billing address!' }]}
              >
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ textAlign: 'right', marginBottom: '20px' }}>
              <Button type="primary" onClick={handleSaveNewCustomer} icon={<PlusOutlined />}>
                Save as New Customer
              </Button>
            </Col>
          </Row>

          <Divider />

          <div className="invoice-items-header">
            <h3>Invoice Items</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
              Add Item
            </Button>
          </div>

          <Table dataSource={currentInvoice?.items || []} columns={itemColumns} rowKey="id" pagination={false} />

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Form.Item label="Discount Rate">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <InputNumber
                    min={0}
                    max={discountType === 'percentage' ? 100 : undefined}
                    value={currentInvoice?.discountRate}
                    onChange={handleDiscountChange}
                    style={{ marginRight: '8px' }}
                  />
                  <Select
                    value={discountType}
                    onChange={(value) => setDiscountType(value as 'percentage' | 'decimal')}
                    style={{ width: '100px' }}
                  >
                    <Option value="percentage">%</Option>
                    <Option value="decimal">₹</Option>
                  </Select>
                </div>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Advance Payment">
                <InputNumber
                  min={0}
                  value={currentInvoice?.advancePayment}
                  onChange={(value) => {
                    if (currentInvoice) {
                      const total = currentInvoice.subtotal - currentInvoice.discountAmount - (value || 0) + currentInvoice.shippingCharges + currentInvoice.packingCharges;
                      
                      setCurrentInvoice({
                        ...currentInvoice,
                        advancePayment: value || 0,
                        total,
                      });
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Shipping Charges">
                <InputNumber
                  min={0}
                  value={currentInvoice?.shippingCharges}
                  onChange={handleShippingChargesChange}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Packing Charges">
                <InputNumber
                  min={0}
                  value={currentInvoice?.packingCharges}
                  onChange={handlePackingChargesChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="notes" label="Notes">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={itemForm.getFieldValue('editingItemId') ? "Edit Invoice Item" : "Add Invoice Item"}
        visible={itemVisible}
        onOk={itemForm.getFieldValue('editingItemId') ? handleUpdateItem : handleSaveItem}
        onCancel={() => setItemVisible(false)}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            name="editingItemId"
            hidden={true}
          >
            <Input type="hidden" />
          </Form.Item>
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product!' }]}
          >
            <Select 
              placeholder="Select a product"
              disabled={!selectedProductType}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onChange={(value) => {
                // Find the selected product and populate its details
                const selectedProduct = products.find(p => p.id === value);
                if (selectedProduct) {
                  // Auto-populate price based on product type
                  if (currentInvoice?.invoiceType === 'manufactured') {
                    itemForm.setFieldsValue({
                      pricePerInch: selectedProduct.price
                    });
                  }
                }
              }}
            >
              {filteredProducts.map(product => (
                <Option key={product.id} value={product.id} title={product.name}>
                  {product.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="productCategory"
            label="Product Category"
            rules={[{ required: true, message: 'Please select a product type!' }]}
          >
            <Select 
              placeholder="Select product type"
              onChange={(value) => {
                setSelectedProductType(value);
                // Filter products based on selected product type
                const filtered = products.filter(product => product.productType === value);
                setFilteredProducts(filtered);
                // Clear the product selection when product type changes
                itemForm.setFieldsValue({
                  productId: undefined
                });
              }}
            >
              {productTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
          
          {currentInvoice?.invoiceType === 'manufactured' ? (
            <>
              <Form.Item
                name="pricePerInch"
                label="Price Per Inch"
                rules={[{ required: true, message: 'Please input price per inch!' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Please input size!' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </>
          ) : null}
          
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input quantity!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Hidden printable invoice */}
      <div ref={invoiceRef} className="hidden">
        <div className="invoice-container">
          <div className="invoice-header">
            <div>
              <div className="invoice-title">INVOICE</div>
              <div>ErpSoul System</div>
            </div>
            <div>
              <div><strong>Invoice #:</strong> {currentInvoice?.invoiceNumber}</div>
              <div><strong>Date:</strong> {currentInvoice?.date}</div>
              <div style={{display: 'none'}}><strong>Type:</strong> 
                <span style={{ 
                  textTransform: 'capitalize',
                  color: currentInvoice?.invoiceType === 'manufactured' ? '#1890ff' : '#52c41a' 
                }}>
                  {currentInvoice?.invoiceType}
                </span>
              </div>
            </div>
          </div>

          <div className="invoice-details">
            <div className="invoice-details-grid">
              <div className="invoice-customer">
                <h3>Customer Name:</h3>
                <div><strong>{currentInvoice?.customerName}</strong></div>
                <div>Phone: {currentInvoice?.customerEmail}</div>
                <h3>Customer Address:</h3>
                <div>{currentInvoice?.billingAddress}</div>
              </div>
              <div className="invoice-info">
                <div><strong>Invoice #:</strong> {currentInvoice?.invoiceNumber}</div>
                <div><strong>Date:</strong> {currentInvoice?.date}</div>
              </div>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              {currentInvoice?.invoiceType === 'manufactured' ? (
                <tr>
                  <th>Product Name</th>
                  <th>Product Type</th>
                  <th>Price Per Inch</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Rate /Pc</th>
                  <th>Total</th>
                </tr>
              ) : (
                <tr>
                  <th>Product Name</th>
                  <th>Product Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              )}
            </thead>
            <tbody>
              {currentInvoice?.items.map((item) => (
                currentInvoice?.invoiceType === 'manufactured' ? (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.productCategory}</td>
                    <td>₹{(item.pricePerInch || 0).toFixed(2)}</td>
                    <td>{item.size}</td>
                    <td>{item.quantity}</td>
                    <td>₹{((item.pricePerInch || 0) * (item.size || 0)).toFixed(2)}</td>
                    <td>₹{item.total.toFixed(2)}</td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.productCategory}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>₹{item.total.toFixed(2)}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="invoice-totals-row">
              <span>Subtotal:</span>
              <span>₹{currentInvoice?.subtotal.toFixed(2)}</span>
            </div>
            {(currentInvoice?.advancePayment || 0) > 0 && (
              <div className="invoice-totals-row">
                <span>Advance Payment:</span>
                <span>-₹{(currentInvoice?.advancePayment || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="invoice-totals-row">
              <span>Discount ({currentInvoice?.discountRate}%):</span>
              <span>-₹{currentInvoice?.discountAmount.toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row">
              <span>Shipping Charges:</span>
              <span>₹{currentInvoice?.shippingCharges.toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row">
              <span>Packing Charges:</span>
              <span>₹{currentInvoice?.packingCharges.toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row total">
              <span>Total:</span>
              <span>₹{currentInvoice?.total.toFixed(2)}</span>
            </div>
          </div>

          {currentInvoice?.notes && (
            <div className="invoice-notes">
              <h3>Notes:</h3>
              <p>{currentInvoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceScreen;
