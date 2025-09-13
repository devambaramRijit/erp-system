
import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { CustomerData } from './services/mockApi';
import { api } from './lib/api';
import ProductDetailsSection from './ProductDetailsSection';
import './InvoiceScreen.css';
import dayjs from 'dayjs';

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
  costPricePerInch?: number;
  ratePerInch?: number;
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
  rate?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  invoiceType: 'manufactured';
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

const InvoiceGenerationScreen: React.FC = () => {
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>(() => {
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    return savedProductTypes ? JSON.parse(savedProductTypes) : [];
  });

  const [discountType, setDiscountType] = useState<'percentage' | 'decimal'>('percentage');
  const [visible, setVisible] = useState(false);
  const [itemVisible, setItemVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [disableRateField, setDisableRateField] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Generate invoice number based on financial year (April 1 to March 31)
  const generateInvoiceNumber = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // January is 0

    // Financial year calculation
    let financialYearStart, financialYearEnd;
    if (currentMonth >= 4) { // April or later
      financialYearStart = currentYear;
      financialYearEnd = currentYear + 1;
    } else { // January to March
      financialYearStart = currentYear - 1;
      financialYearEnd = currentYear;
    }
    
    // Special case: Change to 26-27 format starting from April 1, 2026
    const targetDate = new Date(2026, 3, 1); // April 1, 2026 (month is 0-indexed)
    if (now >= targetDate) {
      financialYearStart = 2026;
      financialYearEnd = 2027;
    }

    // Format as YY-YY
    const financialYearShort = `${financialYearStart.toString().slice(-2)}-${financialYearEnd.toString().slice(-2)}`;

    // Get existing invoices for this financial year
    const existingInvoices = invoices.filter(invoice => 
      invoice.invoiceNumber.startsWith('INV_PK_')
    );

    // Find the highest sequence number
    let nextSequence = 1;
    if (existingInvoices.length > 0) {
      const sequences = existingInvoices.map(invoice => {
        const parts = invoice.invoiceNumber.split('_');
        return parseInt(parts[2] || '0', 10);
      });
      nextSequence = Math.max(...sequences) + 1;
    }

    // Format with leading zeros
    const sequenceFormatted = nextSequence.toString().padStart(3, '0');

    return `INV_PK_${financialYearShort}_${sequenceFormatted}`;
  };

  // Load customers from localStorage and set up event listeners
  useEffect(() => {
    const loadCustomers = () => {
      const savedCustomers = localStorage.getItem('customers');
      if (savedCustomers) {
        try {
          const customersData = JSON.parse(savedCustomers);
          // Make sure the data is in the correct format for InvoiceScreen
          const formattedCustomers = customersData.map((customer: any) => ({
            id: customer.id,
            customerName: customer.customerName,
            mobileNumber1: customer.mobileNumber1 || '',
            mobileNumber2: customer.mobileNumber2 || '',
            email: customer.email || '',
            houseNumber: customer.houseNumber || '',
            city: customer.city || '',
            district: customer.district || '',
            state: customer.state || '',
            pinCode: customer.pinCode || '',
            landmark: customer.landmark || '',
            source: customer.source || ''
          }));
          setCustomers(formattedCustomers);
        } catch (error) {
          console.error('Error parsing saved customers:', error);
          setCustomers([]);
        }
      }
    };

    // Initial load
    loadCustomers();

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customers') {
        loadCustomers();
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    window.addEventListener('customersUpdated', loadCustomers);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customersUpdated', loadCustomers);
    };
  }, []);

  // Load products from localStorage first, then fallback to API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // First try to get products from localStorage
        const savedProducts = localStorage.getItem('simpleInventoryProducts');
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          // Transform the data to match our Product interface
          const transformedProducts = parsedProducts.map((item: any) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            size: item.size || 0,
            unit: item.unit || 'pcs',
            quantity: item.quantity || 0,
            price: item.ratePerPiece || 0, // Use ratePerPiece as price
            productType: item.productType || 'Traded',
            category: item.productCategory || 'General',
            costPricePerInch: item.costPricePerInch,
            ratePerInch: item.ratePerInch
          }));
          setProducts(transformedProducts);
        } else {
          // Fallback to API if no products in localStorage
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
            productType: item.productType || (item.category && (item.category.includes('Manufactured') || item.category.includes('Laddu Gopal')) ? 'Manufactured' : 'Traded'),
            category: item.category || 'General',
            costPricePerInch: item.costPricePerInch,
            ratePerInch: item.ratePerInch
          }));
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        // No fallback to mock products
        setProducts([]);
      }
    };

    // Initial load
    loadProducts();

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'simpleInventoryProducts') {
        loadProducts();
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    window.addEventListener('productsUpdated', loadProducts);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productsUpdated', loadProducts);
    };
  }, []);

  // Load invoices from localStorage
  useEffect(() => {
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

  // Update next invoice number when invoices change
  useEffect(() => {
    setNextInvoiceNumber(generateInvoiceNumber());
  }, [invoices]);

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

  // Handles Adding Invoice
  const handleAddInvoice = () => {
    setEditingInvoice(null);
    const invoiceNumber = generateInvoiceNumber();
    const newInvoice = {
      id: '',
      invoiceNumber: invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      billingAddress: '',
      invoiceType: 'manufactured',
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
        }
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleAddItem = () => {
    itemForm.resetFields();
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
              const rate = values.rate || product.price;

              newItem = {
                id: Date.now().toString(),
                productId: values.productId,
                name: product.name,
                unit: values.unit || product.unit || 'pcs',
                quantity: values.quantity,
                price: rate,
                total: total,
                productCategory: product.category || '',
                pricePerInch: pricePerInch,
                size: size,
                cpPerPc: cpPerPc,
                rate: rate,
              };
            } else {
              const rate = values.rate || product.price;
              newItem = {
                id: Date.now().toString(),
                productId: values.productId,
                name: product.name,
                unit: values.unit || product.unit || 'pcs',
                quantity: values.quantity,
                price: rate,
                total: rate * values.quantity,
                productCategory: product.category || '',
                rate: rate,
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
                const rate = values.rate || product.price;

                updatedItem = {
                  ...currentInvoice.items[itemIndex],
                  productId: values.productId,
                  name: product.name,
                  unit: values.unit || product.unit || 'pcs',
                  quantity: values.quantity,
                  price: rate,
                  total: total,
                  productCategory: product.category || '',
                  pricePerInch: pricePerInch,
                  size: size,
                  cpPerPc: cpPerPc,
                  rate: rate,
                };
              } else {
                const rate = values.rate || product.price;
                updatedItem = {
                  ...currentInvoice.items[itemIndex],
                  productId: values.productId,
                  name: product.name,
                  unit: values.unit || product.unit || 'pcs',
                  quantity: values.quantity,
                  price: rate,
                  total: rate * values.quantity,
                  productCategory: product.category || '',
                  rate: rate,
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

  const handleProductCategoryChange = (value: string) => {
    // Disable rate field if product category is Laddu Gopal Base
    setDisableRateField(value === 'Laddu Gopal Base');

    // If rate field is disabled, clear its value
    if (value === 'Laddu Gopal Base') {
      itemForm.setFieldsValue({ rate: 0 });
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Set the product category
      const category = product.category || product.productType;
      itemForm.setFieldsValue({ productCategory: category });
      
      // If product is manufactured and category is Laddu Gopal Base, set price per inch from rate per inch
      if (product.productType === 'Manufactured' && category === 'Laddu Gopal Base' && product.ratePerInch) {
        itemForm.setFieldsValue({ 
          pricePerInch: product.ratePerInch,
          rate: 0
        });
        setDisableRateField(true);
      } else {
        // For other products, use the regular price
        itemForm.setFieldsValue({ 
          rate: product.price
        });
        setDisableRateField(false);
      }
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
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `₹${rate ? rate.toFixed(2) : '0.00'}`,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `₹${total ? total.toFixed(2) : '0.00'}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: InvoiceItem) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
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
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `₹${total ? total.toFixed(2) : '0.00'}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Invoice) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
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
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Update current invoice whenever it changes
  useEffect(() => {
    if (currentInvoice) {
      form.setFieldsValue(currentInvoice);
    }
  }, [currentInvoice, form]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2>Invoice Generation</h2>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvoice}>
              Add Invoice
            </Button>
          </Space>
        </div>
        <Table dataSource={invoices} columns={invoiceColumns} rowKey="id" />
      </Card>

      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
        open={visible}
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
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice Number"
                rules={[{ required: true, message: 'Please input invoice number!' }]}
              >
                <Input placeholder="Enter invoice number" readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please input date!' }]}
                getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              {/* Invoice type is always manufactured */}
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="Select Customer"
                rules={[{ required: true, message: 'Please select a customer!' }]}
              >
                <Select
                  showSearch
                  placeholder="Search and select a customer"
                  optionFilterProp="children"
                  onChange={handleCustomerSelect}
                  filterOption={(input, option) => {
                    if (!option || !option.value) return false;

                    // Find the customer by ID
                    const customer = customers.find(c => c.id === option.value);
                    if (!customer) return false;

                    // Search in customer ID, name, mobile numbers, city, and state
                    const searchText = input.toLowerCase();
                    return (
                      (customer.id && customer.id.toLowerCase().includes(searchText)) ||
                      (customer.customerName && customer.customerName.toLowerCase().includes(searchText)) ||
                      (customer.mobileNumber1 && customer.mobileNumber1.toLowerCase().includes(searchText)) ||
                      (customer.mobileNumber2 && customer.mobileNumber2.toLowerCase().includes(searchText)) ||
                      (customer.city && customer.city.toLowerCase().includes(searchText)) ||
                      (customer.state && customer.state.toLowerCase().includes(searchText))
                    );
                  }}
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.customerName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="customerName"
                label="Customer Name"
              >
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="customerEmail"
                label="Customer Email/Phone"
              >
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="billingAddress"
                label="Billing Address"
              >
                <Input.TextArea readOnly autoSize={{ minRows: 1, maxRows: 3 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ textAlign: 'right', marginBottom: '20px' }}>
              <Button type="primary" onClick={() => setCustomerModalVisible(true)} icon={<PlusOutlined />}>
                Add Customer
              </Button>
            </Col>
          </Row>

          <Divider />

          <div className="invoice-items-header">
            <div className="flex justify-between items-center mb-4">
              <h3>Invoice Items</h3>
              <Button type="primary" onClick={handleAddItem} icon={<PlusOutlined />}>
                Add Item
              </Button>
            </div>
          </div>

          {currentInvoice && (
            <Table
              dataSource={currentInvoice.items}
              columns={getManufacturedColumns()}
              rowKey="id"
              pagination={false}
            />
          )}

          <div className="invoice-totals mt-6">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="notes" label="Notes">
                  <TextArea rows={4} placeholder="Additional notes..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <div className="space-y-2">
                  <Row justify="space-between">
                    <Col>Subtotal:</Col>
                    <Col>₹{currentInvoice?.subtotal ? currentInvoice.subtotal.toFixed(2) : '0.00'}</Col>
                  </Row>
                  <Row justify="space-between">
                    <Col>
                      <Form.Item label="Discount (%)" style={{ marginBottom: 0 }}>
                        <InputNumber
                          min={0}
                          value={currentInvoice?.discountRate || 0}
                          onChange={handleDiscountChange}
                        />
                      </Form.Item>
                    </Col>
                    <Col>₹{currentInvoice?.discountAmount ? currentInvoice.discountAmount.toFixed(2) : '0.00'}</Col>
                  </Row>

                  <Row justify="space-between">
                    <Col>
                      <Form.Item label="Shipping Charges" style={{ marginBottom: 0 }}>
                        <InputNumber
                          min={0}
                          value={currentInvoice?.shippingCharges || 0}
                          onChange={handleShippingChargesChange}
                        />
                      </Form.Item>
                    </Col>
                    <Col>₹{currentInvoice?.shippingCharges ? currentInvoice.shippingCharges.toFixed(2) : '0.00'}</Col>
                  </Row>
                  <Row justify="space-between">
                    <Col>
                      <Form.Item label="Packing Charges" style={{ marginBottom: 0 }}>
                        <InputNumber
                          min={0}
                          value={currentInvoice?.packingCharges || 0}
                          onChange={handlePackingChargesChange}
                        />
                      </Form.Item>
                    </Col>
                    <Col>₹{currentInvoice?.packingCharges ? currentInvoice.packingCharges.toFixed(2) : '0.00'}</Col>
                  </Row>
                  <Divider />
                  <Row justify="space-between">
                    <Col><strong>Total:</strong></Col>
                    <Col><strong>₹{currentInvoice ? (currentInvoice.subtotal - currentInvoice.discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges).toFixed(2) : '0.00'}</strong></Col>
                  </Row>
                  {(currentInvoice?.advancePayment || 0) > 0 && (
                    <>
                      <Row justify="space-between">
                        <Col>
                          <Form.Item label="Advance Payment" style={{ marginBottom: 0 }}>
                            <InputNumber
                              min={0}
                              value={currentInvoice?.advancePayment || 0}
                              onChange={(value) => {
                                if (currentInvoice) {
                                  const totalWithoutAdvance = currentInvoice.subtotal - currentInvoice.discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges;
                                  setCurrentInvoice({
                                    ...currentInvoice,
                                    advancePayment: value || 0,
                                    total: totalWithoutAdvance - (value || 0),
                                  });
                                }
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col>₹{currentInvoice?.advancePayment ? currentInvoice.advancePayment.toFixed(2) : '0.00'}</Col>
                      </Row>
                      <Divider style={{ marginTop: 10, marginBottom: 10 }} />
                      <Row justify="space-between">
                        <Col><strong>Amount Due:</strong></Col>
                        <Col><strong>₹{currentInvoice?.total ? currentInvoice.total.toFixed(2) : '0.00'}</strong></Col>
                      </Row>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Add New Customer"
        open={customerModalVisible}
        onOk={handleSaveNewCustomer}
        onCancel={() => setCustomerModalVisible(false)}
        width={600}
      >
        <Form form={customerForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please input customer name!' }]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerEmail"
                label="Customer Email/Phone"
                rules={[{ required: true, message: 'Please input customer email/phone!' }]}
              >
                <Input placeholder="Enter customer email/phone" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="billingAddress"
                label="Billing Address"
                rules={[{ required: true, message: 'Please input billing address!' }]}
              >
                <TextArea rows={3} placeholder="Enter billing address" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Add Item"
        open={itemVisible}
        onOk={itemForm.getFieldValue('editingItemId') ? handleUpdateItem : handleSaveItem}
        onCancel={() => setItemVisible(false)}
        width={800}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item name="editingItemId" hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="Product"
                rules={[{ required: true, message: 'Please select a product!' }]}
              >
                <Select
                  showSearch
                  placeholder="Search and select a product"
                  optionFilterProp="children"
                  onChange={handleProductSelect}
                  filterOption={(input, option) => {
                    if (!option || !option.value) return false;

                    // Find the product by ID
                    const product = products.find(p => p.id === option.value);
                    if (!product) return false;

                    // Search in product ID, name, SKU, and category
                    const searchText = input.toLowerCase();
                    return (
                      (product.id && product.id.toLowerCase().includes(searchText)) ||
                      (product.name && product.name.toLowerCase().includes(searchText)) ||
                      (product.sku && product.sku.toLowerCase().includes(searchText)) ||
                      (product.category && product.category.toLowerCase().includes(searchText))
                    );
                  }}
                >
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      <div>
                        <div><strong>{product.name}</strong></div>
                        <div>SKU: {product.sku}</div>
                        <div>Category: {product.category || product.productType}</div>
                        <div>Price: ₹{product.price.toFixed(2)}</div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productCategory"
                label="Product Category"
                rules={[{ required: true, message: 'Please select product category!' }]}
              >
                <Select placeholder="Select product category" onChange={handleProductCategoryChange}>
                  {productTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="pricePerInch"
                label="Price Per Inch"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="size"
                label="Size"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rate"
                label="Rate"
                rules={[{ required: true, message: 'Please input rate!' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} disabled={disableRateField} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please input quantity!' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please input unit!' }]}
              >
                <Input placeholder="e.g. pcs, kg, ltr" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoiceGenerationScreen;
