import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { CustomerData } from './services/mockApi';
import { api } from './lib/api';
import ProductDetailsSection from './ProductDetailsSection';
import './InvoiceScreen.css';

// Add custom styles for the product dropdown
const productDropdownStyles = \`
  /* Product dropdown in Add/Edit Item modal */
  .ant-modal .ant-select-dropdown {
    min-width: 550px !important;
    max-width: 650px !important;
  }

  .ant-modal .ant-select-item {
    height: auto;
    padding: 8px 12px;
    white-space: normal;
    line-height: 1.4;
  }

  .ant-modal .product-dropdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .ant-modal .product-info {
    flex: 1;
  }

  .ant-modal .product-name {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .ant-modal .product-details {
    font-size: 12px;
    color: #666;
  }

  .ant-modal .product-price {
    font-weight: 600;
    color: #1890ff;
    margin-left: 12px;
  }
\`;

// Add styles to document head
const styleElement = document.createElement('style');
styleElement.textContent = productDropdownStyles;
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
  costPricePerInch?: number;
  ratePerInch?: number;
}

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  productType: string;
  category?: string;
  costPricePerInch?: number;
  ratePerInch?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'decimal';
  total: number;
  notes?: string;
}

const InvoiceScreen = () => {
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

    // Load categories from localStorage
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    if (savedProductTypes) {
      try {
        const productTypesData = JSON.parse(savedProductTypes);
        setProductTypes(productTypesData);
      } catch (error) {
        console.error('Error parsing saved product types:', error);
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
    const savedCustomers = localStorage.getItem('customers');
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

    // Load products from localStorage first, then fallback to API
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
      }
    };

    loadProducts();

    // Category extraction moved to separate useEffect to avoid infinite loop
  }, []);

  // Extract unique categories from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

      // Load categories from localStorage
      const savedProductTypes = localStorage.getItem('inventoryProductTypes');
      if (savedProductTypes) {
        const productTypesData = JSON.parse(savedProductTypes);
        // Merge localStorage categories with product categories, prioritizing product categories
        const mergedCategories = Array.from(new Set([...uniqueCategories, ...productTypesData]));
        setProductTypes(mergedCategories);
      } else if (uniqueCategories.length > 0) {
        // Fallback to categories from products if no localStorage data
        setProductTypes(uniqueCategories);
      }
    }
  }, [products]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: currentInvoice ? \`Invoice_\${currentInvoice.invoiceNumber}\` : 'Invoice',
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
      id: \`inv-\${Date.now()}\`,
      invoiceNumber: \`INV-\${Date.now()}\`,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      billingAddress: '',
      items: [],
      subtotal: 0,
      discount: 0,
      discountType: 'percentage' as const,
      total: 0,
      notes: ''
    };
    setCurrentInvoice(newInvoice);
    form.setFieldsValue(newInvoice);
    setVisible(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCurrentInvoice(invoice);
    form.setFieldsValue(invoice);
    setVisible(true);
  };

  const handleDeleteInvoice = (id: string) => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
    setInvoices(updatedInvoices);
    message.success('Invoice deleted successfully');
  };

  const handleSaveInvoice = () => {
    form.validateFields().then(values => {
      const invoiceToSave = {
        ...values,
        id: editingInvoice ? editingInvoice.id : \`inv-\${Date.now()}\`,
        invoiceNumber: editingInvoice ? editingInvoice.invoiceNumber : \`INV-\${Date.now()}\`,
        items: currentInvoice?.items || [],
        subtotal: currentInvoice?.subtotal || 0,
        total: currentInvoice?.total || 0
      };

      if (editingInvoice) {
        const updatedInvoices = invoices.map(invoice =>
          invoice.id === editingInvoice.id ? invoiceToSave : invoice
        );
        setInvoices(updatedInvoices);
        message.success('Invoice updated successfully');
      } else {
        setInvoices([...invoices, invoiceToSave]);
        message.success('Invoice added successfully');
      }

      setVisible(false);
      form.resetFields();
      setCurrentInvoice(null);
    });
  };

  const handleAddItem = () => {
    itemForm.resetFields();
    setItemVisible(true);
  };

  const handleSaveItem = () => {
    itemForm.validateFields().then(values => {
      const selectedItem = products.find(p => p.id === values.productId);
      if (!selectedItem) return;

      // Calculate amount based on product type
      let amount = 0;
      if (selectedItem.productType === 'Manufactured' && selectedItem.size && values.size) {
        // For manufactured items, calculate based on size
        const rate = values.rate || selectedItem.ratePerInch || 0;
        amount = parseFloat(values.size) * rate;
      } else {
        // For other items, simple quantity * rate calculation
        amount = values.quantity * values.rate;
      }

      const newItem: InvoiceItem = {
        id: \`item-\${Date.now()}\`,
        productId: values.productId,
        productName: selectedItem.name,
        size: values.size || selectedItem.size,
        unit: selectedItem.unit,
        quantity: values.quantity,
        rate: values.rate,
        amount: amount,
        productType: selectedItem.productType,
        category: selectedItem.category,
        costPricePerInch: selectedItem.costPricePerInch,
        ratePerInch: selectedItem.ratePerInch
      };

      const updatedItems = [...(currentInvoice?.items || []), newItem];
      const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = currentInvoice?.discountType === 'percentage' 
        ? subtotal * (currentInvoice?.discount || 0) / 100 
        : currentInvoice?.discount || 0;
      const total = subtotal - discountAmount;

      setCurrentInvoice({
        ...currentInvoice!,
        items: updatedItems,
        subtotal,
        total
      });

      form.setFieldsValue({
        items: updatedItems,
        subtotal,
        total
      });

      setItemVisible(false);
      itemForm.resetFields();
    });
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = (currentInvoice?.items || []).filter(item => item.id !== id);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = currentInvoice?.discountType === 'percentage' 
      ? subtotal * (currentInvoice?.discount || 0) / 100 
      : currentInvoice?.discount || 0;
    const total = subtotal - discountAmount;

    setCurrentInvoice({
      ...currentInvoice!,
      items: updatedItems,
      subtotal,
      total
    });

    form.setFieldsValue({
      items: updatedItems,
      subtotal,
      total
    });
  };

  const handleDiscountChange = (value: number) => {
    if (!currentInvoice) return;

    const discountAmount = discountType === 'percentage' 
      ? currentInvoice.subtotal * value / 100 
      : value;
    const total = currentInvoice.subtotal - discountAmount;

    setCurrentInvoice({
      ...currentInvoice,
      discount: value,
      total
    });

    form.setFieldsValue({
      total
    });
  };

  const handleDiscountTypeChange = (type: 'percentage' | 'decimal') => {
    if (!currentInvoice) return;

    setDiscountType(type);
    const discountAmount = type === 'percentage' 
      ? currentInvoice.subtotal * (currentInvoice.discount || 0) / 100 
      : currentInvoice.discount || 0;
    const total = currentInvoice.subtotal - discountAmount;

    setCurrentInvoice({
      ...currentInvoice,
      discountType: type,
      total
    });

    form.setFieldsValue({
      total
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);

      // Format address for display
      const formatAddress = (customer: CustomerData) => {
        return \`\${customer.houseNumber}, \${customer.city}, \${customer.district}, \${customer.state} - \${customer.pinCode}\${customer.landmark ? \` (Landmark: \${customer.landmark})\` : ''}\`;
      };

      const billingAddress = formatAddress(customer);

      form.setFieldsValue({
        customerName: customer.customerName,
        customerEmail: customer.email,
        billingAddress: billingAddress,
      });

      if (currentInvoice) {
        setCurrentInvoice({
          ...currentInvoice,
          customerName: customer.customerName,
          customerEmail: customer.email,
          billingAddress: billingAddress,
        });
      }
    }
  };

  const handleAddCustomer = () => {
    customerForm.validateFields().then(values => {
      const newCustomer: CustomerData = {
        id: \`cust-\${Date.now()}\`,
        ...values
      };

      const updatedCustomers = [...customers, newCustomer];
      setCustomers(updatedCustomers);
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));

      // Select the newly added customer
      handleCustomerSelect(newCustomer.id);

      setCustomerModalVisible(false);
      customerForm.resetFields();
      message.success('Customer added successfully');
    });
  };

  const refreshData = async () => {
    // Refresh customers
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      const customersData = JSON.parse(savedCustomers);
      setCustomers(customersData);
    }

    // Refresh products from API
    try {
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
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  // Columns for invoice items table
  const itemColumns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
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
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => \`₹\${rate.toFixed(2)}\`,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => \`₹\${amount.toFixed(2)}\`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: InvoiceItem) => (
        <Popconfirm
          title="Are you sure you want to delete this item?"
          onConfirm={() => handleDeleteItem(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  // Columns for invoices table
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
      render: (total: number) => \`₹\${total.toFixed(2)}\`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Invoice) => (
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
            title="Are you sure you want to delete this invoice?"
            onConfirm={() => handleDeleteInvoice(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Custom dropdown render for product selection
  const renderProductOption = (product: Product) => (
    <Select.Option key={product.id} value={product.id}>
      <div className="product-dropdown-item">
        <div className="product-info">
          <div className="product-name">{product.name}</div>
          <div className="product-details">
            SKU: {product.sku} | Stock: {product.quantity} {product.unit} | 
            Type: {product.productType} {product.category ? \` | Category: \${product.category}\` : ''}
          </div>
        </div>
        <div className="product-price">₹{product.price.toFixed(2)}</div>
      </div>
    </Select.Option>
  );

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Invoice Management">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvoice}>
            Add Invoice
          </Button>
          <Button icon={<SaveOutlined />} onClick={refreshData}>
            Refresh Data
          </Button>
        </div>

        <Table
          dataSource={invoices}
          columns={invoiceColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingInvoice ? "Edit Invoice" : "Add Invoice"}
        visible={visible}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
          setCurrentInvoice(null);
        }}
        footer={[
          <Button key="back" onClick={() => {
            setVisible(false);
            form.resetFields();
            setCurrentInvoice(null);
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveInvoice}>
            {editingInvoice ? "Update" : "Save"}
          </Button>,
        ]}
        width={1000}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice Number"
                rules={[{ required: true, message: 'Please input invoice number!' }]}
              >
                <Input disabled />
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
            <Col span={8}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please select customer!' }]}
              >
                <Select
                  showSearch
                  placeholder="Select a customer"
                  optionFilterProp="children"
                  onChange={handleCustomerSelect}
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
            <Col span={8}>
              <Form.Item
                name="customerEmail"
                label="Customer Email"
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Button 
                type="dashed" 
                style={{ width: '100%', marginTop: '30px' }}
                onClick={() => setCustomerModalVisible(true)}
              >
                Add New Customer
              </Button>
            </Col>
          </Row>

          <Form.Item
            name="billingAddress"
            label="Billing Address"
          >
            <TextArea rows={3} disabled />
          </Form.Item>

          <Divider />

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <h3>Invoice Items</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
              Add Item
            </Button>
          </div>

          <Table
            dataSource={currentInvoice?.items || []}
            columns={itemColumns}
            rowKey="id"
            pagination={false}
            summary={() => (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>Subtotal</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    ₹{(currentInvoice?.subtotal || 0).toFixed(2)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <Space>
                      Discount:
                      <Select
                        value={discountType}
                        onChange={handleDiscountTypeChange}
                        style={{ width: 120 }}
                      >
                        <Select.Option value="percentage">Percentage</Select.Option>
                        <Select.Option value="decimal">Fixed Amount</Select.Option>
                      </Select>
                    </Space>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <InputNumber
                      value={currentInvoice?.discount || 0}
                      onChange={handleDiscountChange}
                      min={0}
                      max={discountType === 'percentage' ? 100 : currentInvoice?.subtotal || 0}
                      formatter={value => discountType === 'percentage' ? \`\${value}%\` : \`₹\${value}\`}
                      parser={value => discountType === 'percentage' ? value!.replace('%', '') : value!.replace('₹', '')}
                      style={{ width: 120 }}
                    />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}><strong>Total</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>₹{(currentInvoice?.total || 0).toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </>
            )}
          />

          <Form.Item
            name="notes"
            label="Notes"
            style={{ marginTop: '16px' }}
          >
            <TextArea rows={3} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Print Invoice
            </Button>
          </div>
        </Form>

        {/* Invoice Preview for Printing */}
        <div style={{ display: 'none' }}>
          <div ref={invoiceRef} style={{ padding: '20px' }}>
            {currentInvoice && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h1>INVOICE</h1>
                  <p>Invoice Number: {currentInvoice.invoiceNumber}</p>
                  <p>Date: {currentInvoice.date}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3>Bill To:</h3>
                  <p>{currentInvoice.customerName}</p>
                  <p>{currentInvoice.customerEmail}</p>
                  <p>{currentInvoice.billingAddress}</p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Product Name</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Size</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Unit</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Quantity</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Rate</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '8px' }}>{item.productName}</td>
                        <td style={{ padding: '8px' }}>{item.size}</td>
                        <td style={{ padding: '8px' }}>{item.unit}</td>
                        <td style={{ padding: '8px' }}>{item.quantity}</td>
                        <td style={{ padding: '8px' }}>₹{item.rate.toFixed(2)}</td>
                        <td style={{ padding: '8px' }}>₹{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ padding: '8px', textAlign: 'right' }}>Subtotal:</td>
                      <td style={{ padding: '8px' }}>₹{currentInvoice.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ padding: '8px', textAlign: 'right' }}>
                        Discount ({currentInvoice.discountType === 'percentage' ? \`\${currentInvoice.discount}%\` : \`₹\${currentInvoice.discount}\`}):
                      </td>
                      <td style={{ padding: '8px' }}>
                        -₹{(currentInvoice.discountType === 'percentage' 
                          ? currentInvoice.subtotal * currentInvoice.discount / 100 
                          : currentInvoice.discount).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>₹{currentInvoice.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                {currentInvoice.notes && (
                  <div style={{ marginTop: '20px' }}>
                    <h3>Notes:</h3>
                    <p>{currentInvoice.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="Add Invoice Item"
        visible={itemVisible}
        onCancel={() => {
          setItemVisible(false);
          itemForm.resetFields();
        }}
        footer={[
          <Button key="back" onClick={() => {
            setItemVisible(false);
            itemForm.resetFields();
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveItem}>
            Add
          </Button>,
        ]}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product!' }]}
          >
            <Select
              placeholder="Select a product"
              onChange={(value) => {
                const product = products.find(p => p.id === value);
                if (product) {
                  itemForm.setFieldsValue({
                    rate: product.price,
                  });
                  // For manufactured items, disable rate field
                  setDisableRateField(product.productType === 'Manufactured');
                }
              }}
            >
              {products.map(renderProductOption)}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Please input size!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
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
                name="rate"
                label="Rate"
                rules={[{ required: true, message: 'Please input rate!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  disabled={disableRateField}
                  formatter={value => \`₹\${value}\`}
                  parser={value => value!.replace('₹', '')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Add New Customer"
        visible={customerModalVisible}
        onCancel={() => {
          setCustomerModalVisible(false);
          customerForm.resetFields();
        }}
        footer={[
          <Button key="back" onClick={() => {
            setCustomerModalVisible(false);
            customerForm.resetFields();
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleAddCustomer}>
            Add Customer
          </Button>,
        ]}
      >
        <Form form={customerForm} layout="vertical">
          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: 'Please input customer name!' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mobileNumber1"
                label="Mobile Number"
                rules={[{ required: true, message: 'Please input mobile number!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Please input a valid email!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="houseNumber"
            label="House Number"
            rules={[{ required: true, message: 'Please input house number!' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please input city!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="district"
                label="District"
                rules={[{ required: true, message: 'Please input district!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please input state!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="pinCode"
                label="Pin Code"
                rules={[{ required: true, message: 'Please input pin code!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="landmark"
                label="Landmark"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="source"
            label="Source"
            rules={[{ required: true, message: 'Please select source!' }]}
          >
            <Select placeholder="Select source">
              <Select.Option value="Direct">Direct</Select.Option>
              <Select.Option value="Referral">Referral</Select.Option>
              <Select.Option value="Social Media">Social Media</Select.Option>
              <Select.Option value="Website">Website</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoiceScreen;
