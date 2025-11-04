import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { CustomerData } from './services/mockApi';
import { api } from './lib/api';
import { invoiceService } from './services/invoiceService';
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
  const [disableRateField, setDisableRateField] = useState(true);
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
    existingInvoices.forEach(invoice => {
      const match = invoice.invoiceNumber.match(/INV_PK_(\d{2}-\d{2})_(\d+)/);
      if (match && match[1] === financialYearShort) {
        const sequence = parseInt(match[2]);
        if (sequence >= nextSequence) {
          nextSequence = sequence + 1;
        }
      }
    });

    // Format sequence with leading zeros
    const sequenceFormatted = nextSequence.toString().padStart(3, '0');

    return `INV_PK_${financialYearShort}_${sequenceFormatted}`;
  };

  // Load customers from localStorage and set up event listeners
  useEffect(() => {
    const loadCustomers = () => {
      // Check if we have cached customer data in sessionStorage (faster access)
      const cachedCustomers = sessionStorage.getItem('cachedCustomers');
      const cacheTimestamp = sessionStorage.getItem('customersCacheTimestamp');
      const now = new Date().getTime();

      // Use cached data if it's less than 5 minutes old
      if (cachedCustomers && cacheTimestamp && (now - parseInt(cacheTimestamp) < 300000)) {
        try {
          const customersData = JSON.parse(cachedCustomers);
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
          return; // Exit early if we used cached data
        } catch (error) {
          console.error('Error parsing cached customers:', error);
        }
      }

      // If no valid cache, load from localStorage
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

          // Cache the data in sessionStorage for faster access next time
          try {
            sessionStorage.setItem('cachedCustomers', JSON.stringify(customersData));
            sessionStorage.setItem('customersCacheTimestamp', new Date().getTime().toString());
          } catch (error) {
            console.error('Error caching customers:', error);
          }
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
        // Check for cached products in sessionStorage first
        const cachedProducts = sessionStorage.getItem('cachedProducts');
        const cacheTimestamp = sessionStorage.getItem('productsCacheTimestamp');
        const now = new Date().getTime();

        // Use cached data if it's less than 5 minutes old
        if (cachedProducts && cacheTimestamp && (now - parseInt(cacheTimestamp) < 300000)) {
          try {
            const parsedProducts = JSON.parse(cachedProducts);
            // Transform the data to match our Product interface
            const transformedProducts = parsedProducts.map((item: any) => ({
              id: item.id,
              sku: item.sku,
              name: item.name,
              size: item.size,
              unit: item.unit,
              quantity: item.quantity,
              price: item.price,
              productType: item.productType,
              category: item.category,
              costPricePerInch: item.costPricePerInch,
              ratePerInch: item.ratePerInch
            }));
            setProducts(transformedProducts);
            return; // Exit early if we used cached data
          } catch (error) {
            console.error('Error parsing cached products:', error);
          }
        }

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

          // Cache the products data in sessionStorage for faster access next time
          try {
            sessionStorage.setItem('cachedProducts', JSON.stringify(parsedProducts));
            sessionStorage.setItem('productsCacheTimestamp', new Date().getTime().toString());
          } catch (error) {
            console.error('Error caching products:', error);
          }
        } else {
          // If no products in localStorage, fetch from API
          const response = await api.get('/products');
          setProducts(response.data);

          // Cache the products data in sessionStorage for faster access next time
          try {
            sessionStorage.setItem('cachedProducts', JSON.stringify(response.data));
            sessionStorage.setItem('productsCacheTimestamp', new Date().getTime().toString());
          } catch (error) {
            console.error('Error caching products:', error);
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
        message.error('Failed to load products');
      }
    };

    loadProducts();
  }, []);

  // Load invoices from localStorage
  useEffect(() => {
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (error) {
        console.error('Error parsing saved invoices:', error);
      }
    }

    // Generate next invoice number
    setNextInvoiceNumber(generateInvoiceNumber());
  }, [invoices]);

  // Handles Adding Invoice
  const handleAddInvoice = () => {
    console.log('Add Invoice button clicked');
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
    console.log('Setting visible to true');
    setVisible(true);
    console.log('Visible set to true');
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

  const handleSaveInvoice = async () => {
    try {
      const values = await form.validateFields();
      if (currentInvoice) {
        const updatedInvoice: Invoice = {
          ...currentInvoice,
          ...values,
          id: editingInvoice ? editingInvoice.id : Date.now().toString(),
        };

        if (editingInvoice) {
          try {
            await invoiceService.updateInvoice(editingInvoice.id, updatedInvoice);
            const updatedInvoices = invoices.map(invoice => invoice.id === editingInvoice.id ? updatedInvoice : invoice);
            setInvoices(updatedInvoices);
            message.success('Invoice updated successfully');
          } catch (error) {
            console.error('Failed to update invoice in database:', error);
            message.error('Failed to update invoice in database');
            return;
          }
        } else {
          try {
            const savedInvoice = await invoiceService.addInvoice(updatedInvoice);
            const newInvoices = [...invoices, savedInvoice];
            setInvoices(newInvoices);
            message.success('Invoice added successfully');
          } catch (error) {
            console.error('Failed to save invoice to database:', error);
            message.error('Failed to save invoice to database');
            return;
          }
        }

        setVisible(false);
        form.resetFields();
        setCurrentInvoice(null);
        setEditingInvoice(null);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
    setCurrentInvoice(null);
    setEditingInvoice(null);
  };

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice_${currentInvoice?.invoiceNumber}`,
  });

  const handleAddItem = () => {
    itemForm.validateFields().then(values => {
      if (currentInvoice) {
        const newItem: InvoiceItem = {
          id: Date.now().toString(),
          ...values,
          total: values.quantity * values.price,
          size: values.size,
          ratePerInch: values.ratePerInch,
          cpPerPc: values.cpPerPc,
        };

        const updatedItems = [...currentInvoice.items, newItem];
        const updatedInvoice = {
          ...currentInvoice,
          items: updatedItems,
          subtotal: updatedItems.reduce((sum, item) => sum + item.total, 0),
          total: updatedItems.reduce((sum, item) => sum + item.total, 0) - currentInvoice.discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges - currentInvoice.advancePayment,
        };

        setCurrentInvoice(updatedInvoice);
        form.setFieldsValue(updatedInvoice);
        itemForm.resetFields();
        setDisableRateField(true); // Reset rate field state
        setItemVisible(false);
      }
    });
  };

  const handleDeleteItem = (id: string) => {
    if (currentInvoice) {
      const updatedItems = currentInvoice.items.filter(item => item.id !== id);
      const updatedInvoice = {
        ...currentInvoice,
        items: updatedItems,
        subtotal: updatedItems.reduce((sum, item) => sum + item.total, 0),
        total: updatedItems.reduce((sum, item) => sum + item.total, 0) - currentInvoice.discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges - currentInvoice.advancePayment,
      };

      setCurrentInvoice(updatedInvoice);
      form.setFieldsValue(updatedInvoice);
    }
  };

  const handleDiscountChange = (value: number) => {
    if (currentInvoice) {
      const subtotal = currentInvoice.items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = discountType === 'percentage' 
        ? subtotal * (value / 100) 
        : value;

      const updatedInvoice = {
        ...currentInvoice,
        discountRate: value,
        discountAmount,
        total: subtotal - discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges - currentInvoice.advancePayment,
      };

      setCurrentInvoice(updatedInvoice);
      form.setFieldsValue(updatedInvoice);
    }
  };

  const handleShippingChargesChange = (value: number) => {
    if (currentInvoice) {
      const subtotal = currentInvoice.items.reduce((sum, item) => sum + item.total, 0);
      const updatedInvoice = {
        ...currentInvoice,
        shippingCharges: value,
        total: subtotal - currentInvoice.discountAmount + value + currentInvoice.packingCharges - currentInvoice.advancePayment,
      };

      setCurrentInvoice(updatedInvoice);
      form.setFieldsValue(updatedInvoice);
    }
  };

  const handlePackingChargesChange = (value: number) => {
    if (currentInvoice) {
      const subtotal = currentInvoice.items.reduce((sum, item) => sum + item.total, 0);
      const updatedInvoice = {
        ...currentInvoice,
        packingCharges: value,
        total: subtotal - currentInvoice.discountAmount + currentInvoice.shippingCharges + value - currentInvoice.advancePayment,
      };

      setCurrentInvoice(updatedInvoice);
      form.setFieldsValue(updatedInvoice);
    }
  };

  const handleAdvancePaymentChange = (value: number) => {
    if (currentInvoice) {
      const subtotal = currentInvoice.items.reduce((sum, item) => sum + item.total, 0);
      const updatedInvoice = {
        ...currentInvoice,
        advancePayment: value,
        total: subtotal - currentInvoice.discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges - value,
      };

      setCurrentInvoice(updatedInvoice);
      form.setFieldsValue(updatedInvoice);
    }
  };

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
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `₹${total.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: any, record: Invoice) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditInvoice(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this invoice?"
            onConfirm={() => handleDeleteInvoice(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
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
      render: (price: number) => `₹${price.toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `₹${total.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: any, record: InvoiceItem) => (
        <Popconfirm
          title="Are you sure you want to delete this item?"
          onConfirm={() => handleDeleteItem(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" icon={<DeleteOutlined />} danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

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
        afterOpenChange={(open) => console.log('Modal open state changed to:', open)}
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
                label="Customer"
                rules={[{ required: true, message: 'Please select a customer!' }]}
              >
                <Select
                  placeholder="Select a customer"
                  showSearch
                  filterOption={(input, option) =>
                    option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
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

          <Divider>Invoice Items</Divider>

          <Row gutter={16}>
            <Col span={24}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setItemVisible(true)}
                style={{ width: '100%', marginBottom: 16 }}
              >
                Add Item
              </Button>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Table
                dataSource={currentInvoice?.items || []}
                columns={itemColumns}
                pagination={false}
                rowKey="id"
                locale={{ emptyText: 'No items added to invoice' }}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item label="Subtotal">
                <Input
                  value={`₹${currentInvoice?.subtotal.toFixed(2) || '0.00'}`}
                  readOnly
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Discount Type">
                <Select
                  value={discountType}
                  onChange={(value) => setDiscountType(value)}
                >
                  <Option value="percentage">Percentage (%)</Option>
                  <Option value="decimal">Fixed Amount (₹)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountRate"
                label={`Discount (${discountType === 'percentage' ? '%' : '₹'})`}
              >
                <InputNumber
                  min={0}
                  max={discountType === 'percentage' ? 100 : undefined}
                  style={{ width: '100%' }}
                  onChange={handleDiscountChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Discount Amount">
                <Input
                  value={`₹${currentInvoice?.discountAmount.toFixed(2) || '0.00'}`}
                  readOnly
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shippingCharges"
                label="Shipping Charges (₹)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  onChange={handleShippingChargesChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="packingCharges"
                label="Packing Charges (₹)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  onChange={handlePackingChargesChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="advancePayment"
                label="Advance Payment (₹)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  onChange={handleAdvancePaymentChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Total Amount">
                <Input
                  value={`₹${currentInvoice?.total.toFixed(2) || '0.00'}`}
                  readOnly
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea rows={3} placeholder="Enter any additional notes" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Add Item"
        open={itemVisible}
        onOk={handleAddItem}
        onCancel={() => setItemVisible(false)}
        width={600}
      >
        <Form form={itemForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="Product"
                rules={[{ required: true, message: 'Please select a product!' }]}
              >
                <Select
                  placeholder="Select a product"
                  showSearch
                  filterOption={(input, option) =>
                    option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={(value) => {
                    const selectedProduct = products.find(p => p.id === value);
                    if (selectedProduct) {
                      itemForm.setFieldsValue({
                        name: selectedProduct.name,
                        unit: selectedProduct.unit,
                        price: selectedProduct.price,
                        ratePerInch: selectedProduct.ratePerInch,
                        size: selectedProduct.size,
                      });
                      // Show/hide rate per inch field based on product type
                      setDisableRateField(selectedProduct.productType !== 'Base');
                    }
                  }}
                >
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {product.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please input product name!' }]}
              >
                <Input placeholder="Enter product name" readOnly={false} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please input unit!' }]}
              >
                <Input placeholder="Enter unit" readOnly={false} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please input quantity!' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  disabled={false}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: 'Please input price!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  disabled={false}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="size"
                label="Size (inches)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  disabled={false}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ratePerInch"
                label="Rate per Inch"
                disabled={disableRateField}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  disabled={disableRateField}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="cpPerPc"
                label="Cost Price per Piece"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  disabled={false}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoiceGenerationScreen;
