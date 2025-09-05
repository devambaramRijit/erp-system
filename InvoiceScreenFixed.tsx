
import React, { useState, useRef } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import './InvoiceScreen.css';

const { Option } = Select;
const { TextArea } = Input;

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
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
  discountRate: number;
  discountAmount: number;
  shippingCharges: number;
  packingCharges: number;
  total: number;
  notes?: string;
}

const InvoiceScreen: React.FC = () => {
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visible, setVisible] = useState(false);
  const [itemVisible, setItemVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Sample data
  React.useEffect(() => {
    // Mock customers data
    const mockCustomers = [
      {
        id: '1',
        customerName: 'John Doe',
        mobileNumber1: '1234567890',
        email: 'john@example.com',
        billingAddress: '123 Main St, City, Country',
        shippingAddress: '123 Main St, City, Country',
        city: 'City',
        state: 'State',
      },
      {
        id: '2',
        customerName: 'Jane Smith',
        mobileNumber1: '9876543210',
        email: 'jane@example.com',
        billingAddress: '456 Oak Ave, Town, Country',
        shippingAddress: '456 Oak Ave, Town, Country',
        city: 'Town',
        state: 'State',
      },
    ];
    setCustomers(mockCustomers);

    // Mock products data
    const mockProducts: Product[] = [
      { id: '1', name: 'Product A', unit: 'pcs', price: 10.99 },
      { id: '2', name: 'Product B', unit: 'kg', price: 5.99 },
      { id: '3', name: 'Product C', unit: 'ltr', price: 7.99 },
    ];
    setProducts(mockProducts);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice_${currentInvoice?.invoiceNumber}`,
  });

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    form.resetFields();
    setCurrentInvoice({
      id: '',
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      billingAddress: '',
      items: [],
      subtotal: 0,
      discountRate: 0,
      discountAmount: 0,
      shippingCharges: 0,
      packingCharges: 0,
      total: 0,
    });
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
            setInvoices(invoices.map(invoice => invoice.id === editingInvoice.id ? updatedInvoice : invoice));
            message.success('Invoice updated successfully');
          } else {
            setInvoices([...invoices, updatedInvoice]);
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
            const newItem: InvoiceItem = {
              id: Date.now().toString(),
              productId: values.productId,
              name: product.name,
              unit: product.unit,
              quantity: values.quantity,
              price: product.price,
              total: product.price * values.quantity,
            };

            const updatedItems = [...currentInvoice.items, newItem];
            const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
            const discountAmount = (subtotal * currentInvoice.discountRate) / 100;
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
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleDeleteItem = (id: string) => {
    if (currentInvoice) {
      const updatedItems = currentInvoice.items.filter(item => item.id !== id);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = (subtotal * currentInvoice.discountRate) / 100;
      const total = subtotal - discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges;

      setCurrentInvoice({
        ...currentInvoice,
        items: updatedItems,
        subtotal,
        discountAmount,
        total,
      });
    }
  };

  const handleDiscountChange = (value: number) => {
    if (currentInvoice) {
      const discountAmount = (currentInvoice.subtotal * value) / 100;
      const total = currentInvoice.subtotal - discountAmount + currentInvoice.shippingCharges + currentInvoice.packingCharges;

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
      const total = currentInvoice.subtotal - currentInvoice.discountAmount + value + currentInvoice.packingCharges;

      setCurrentInvoice({
        ...currentInvoice,
        shippingCharges: value,
        total,
      });
    }
  };

  const handlePackingChargesChange = (value: number) => {
    if (currentInvoice) {
      const total = currentInvoice.subtotal - currentInvoice.discountAmount + currentInvoice.shippingCharges + value;

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
      form.setFieldsValue({
        customerName: customer.customerName,
        customerEmail: customer.mobileNumber1,
        billingAddress: customer.billingAddress,
      });

      if (currentInvoice) {
        setCurrentInvoice({
          ...currentInvoice,
          customerName: customer.customerName,
          customerEmail: customer.mobileNumber1,
          billingAddress: customer.billingAddress,
        });
      }
    }
  };

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
      title: 'Action',
      key: 'action',
      render: (text: string, record: InvoiceItem) => (
        <Popconfirm
          title="Are you sure to delete this item?"
          onConfirm={() => handleDeleteItem(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
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
              setTimeout(() => handlePrint(), 100);
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvoice}>
            Add Invoice
          </Button>
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
                    option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.customerName} - {customer.mobileNumber1}
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

          <Divider />

          <div className="invoice-items-header">
            <h3>Invoice Items</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
              Add Item
            </Button>
          </div>

          <Table dataSource={currentInvoice?.items || []} columns={itemColumns} rowKey="id" pagination={false} />

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Form.Item label="Discount Rate (%)">
                <InputNumber
                  min={0}
                  max={100}
                  value={currentInvoice?.discountRate}
                  onChange={handleDiscountChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Shipping Charges">
                <InputNumber
                  min={0}
                  value={currentInvoice?.shippingCharges}
                  onChange={handleShippingChargesChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
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
        title="Add Invoice Item"
        visible={itemVisible}
        onOk={handleSaveItem}
        onCancel={() => setItemVisible(false)}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product!' }]}
          >
            <Select placeholder="Select a product">
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} - ₹{product.price.toFixed(2)} per {product.unit}
                </Option>
              ))}
            </Select>
          </Form.Item>
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
            </div>
          </div>

          <div className="invoice-details">
            <div className="invoice-details-grid">
              <div className="invoice-customer">
                <h3>Customer Address:</h3>
                <div><strong>{currentInvoice?.customerName}</strong></div>
                <div>Phone: {currentInvoice?.customerEmail}</div>
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
              <tr>
                <th>Product</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoice?.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>{item.name}</div>
                  </td>
                  <td>{item.unit}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="invoice-totals-row">
              <span>Subtotal:</span>
              <span>₹{currentInvoice?.subtotal.toFixed(2)}</span>
            </div>
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
