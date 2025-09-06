
import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { CustomerData } from './services/mockApi';
import { api } from './lib/api';
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

const InvoiceScreen: React.FC = () => {
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
        
        // Extract unique categories from products
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
  }, []);

  // Extract unique categories from products
useEffect(() => {
    if (products.length === 0) {
      const mockProducts: Product[] = [
        { id: '1', sku: 'SKU001', name: 'Product A', size: '0', unit: 'pcs', quantity: 100, price: 10.99, productType: 'Electronics' },
        { id: '2', sku: 'SKU002', name: 'Product B', size: '0', unit: 'kg', quantity: 50, price: 5.99, productType: 'Groceries' },
        { id: '3', sku: 'SKU003', name: 'Product C', size: '0', unit: 'ltr', quantity: 30, price: 7.99, productType: 'Beverages' },
        { id: '4', sku: 'LGD001', name: 'Laddu Gopal Dress - 1', size: '0', unit: 'pcs', quantity: 10, price: 0, productType: 'Manufactured', category: 'Laddu Gopal Dress', costPricePerInch: 5, ratePerInch: 6 },
        { id: '5', sku: 'LGB001', name: 'Laddu Gopal Base - 1', size: '0', unit: 'pcs', quantity: 15, price: 0, productType: 'Manufactured', category: 'Laddu Gopal Base', costPricePerInch: 4, ratePerInch: 5 },
      ];

      setProducts(mockProducts);
      setProductTypes(['Electronics', 'Groceries', 'Beverages']);
    }

    // Load products directly
    try {
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
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, [products]);

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
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit: string) => unit || 'pcs',
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
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit: string) => unit || 'pcs',
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

  // Function to refresh data from API and localStorage
  const refreshData = async () => {
    // Refresh customers
    const savedCustomers = localStorage.getItem('mockCustomers');
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
      
      // Save to localStorage for offline access
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(transformedProducts));
    } catch (error) {
      console.error('Error fetching products from API:', error);
      // Fallback to localStorage if API fails
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
          category: item.productType || 'General', // Use productType as category
          costPricePerInch: item.costPricePerInch,
          ratePerInch: item.ratePerInch
        }));
        setProducts(productsFromInventory);
      }
    }

    // Refresh product types
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    if (savedProductTypes) {
      const productTypesData = JSON.parse(savedProductTypes);
      // Extract unique categories from products
      const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
      // Merge localStorage categories with product categories, prioritizing product categories
      const mergedCategories = Array.from(new Set([...uniqueCategories, ...productTypesData]));
      setProductTypes(mergedCategories);
    } else if (products.length > 0) {
      // Fallback to categories from products if no localStorage data
      const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
      setProductTypes(uniqueCategories);
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
            <Col span={12}>
              {/* Customer info fields moved below Add Customer button */}
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              {/* Customer info fields moved below Add Customer button */}
            </Col>
            <Col span={12}>
              {/* Customer info fields moved below Add Customer button */}
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ textAlign: 'right', marginBottom: '20px' }}>
              <Button type="primary" onClick={() => setCustomerModalVisible(true)} icon={<PlusOutlined />}>
                Add Customer
              </Button>
            </Col>
          </Row>

          {selectedCustomer && (
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Customer Name</label>
                  <div style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
                    {selectedCustomer.customerName}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Customer Email/Phone</label>
                  <div style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
                    {selectedCustomer.mobileNumber1 || selectedCustomer.email}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Billing Address</label>
                  <div style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
                    {selectedCustomer.houseNumber ? `${selectedCustomer.houseNumber}, ${selectedCustomer.city}, ${selectedCustomer.district}, ${selectedCustomer.state} - ${selectedCustomer.pinCode}${selectedCustomer.landmark ? ` (Landmark: ${selectedCustomer.landmark})` : ''}` : selectedCustomer.billingAddress || 'No address provided'}
                  </div>
                </div>
              </Col>
            </Row>
          )}

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
        open={itemVisible}
        onOk={itemForm.getFieldValue('editingItemId') ? handleUpdateItem : handleSaveItem}
        onCancel={() => setItemVisible(false)}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            name="editingItemId"
            hidden={true}
          >
            <Select />
          </Form.Item>

          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product!' }]}
          >
            <Select 
              placeholder="Select a product"

              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onChange={(value) => {
                // Find the selected product and populate its details
                const selectedProduct = products.find(p => p.id === value);
                if (selectedProduct) {
                  // Set the product category
                  itemForm.setFieldsValue({
                    productCategory: selectedProduct.category
                  });
                  
                  // Handle product category change
                  handleProductCategoryChange(selectedProduct.category);
                  
                  // Auto-populate price based on product
                  if (currentInvoice?.invoiceType === 'manufactured') {
                    // Use inch-based pricing if available (for Laddu Gopal Dress and Base)
                    if (selectedProduct.costPricePerInch !== undefined) {
                      itemForm.setFieldsValue({
                        pricePerInch: selectedProduct.costPricePerInch
                      });
                    } else {
                      itemForm.setFieldsValue({
                        pricePerInch: selectedProduct.price
                      });
                    }
                  }
                  
                  // Set the rate field with the product price
                  itemForm.setFieldsValue({
                    rate: selectedProduct.price
                  });
                }
              }}
            >
              {products.map(product => (
                <Option key={product.id} value={product.id} title={product.name}>
                  {product.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="productCategory"
            hidden={true}
          >
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            name="rate"
            label="Rate (Price Per Piece)"
            rules={[{ required: true, message: 'Please input rate!' }]}
          >
            <InputNumber 
              min={0} 
              step={0.01} 
              style={{ width: '100%' }} 
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
              placeholder="Enter rate per piece"
            />
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

          <Form.Item
            name="unit"
            label="Unit"
            rules={[{ required: true, message: 'Please select unit!' }]}
            initialValue="pcs"
          >
            <Select placeholder="Select unit">
              <Option value="pcs">Pieces</Option>
              <Option value="500gm">500gm</Option>
              <Option value="1kg">1kg</Option>
              <Option value="500pieces">500pieces</Option>
              <Option value="1m">1 Meter</Option>
              <Option value="kg">Kilogram</Option>
              <Option value="g">Gram</Option>
              <Option value="l">Liter</Option>
              <Option value="ml">Milliliter</Option>
            </Select>
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
                  <th>Price Per Inch</th>
                  <th>Size</th>
                  <th>Rate /Pc</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              ) : (
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
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
                    <td>₹{(item.pricePerInch || 0).toFixed(2)}</td>
                    <td>{item.size}</td>
                    <td>₹{((item.pricePerInch || 0) * (item.size || 0)).toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit || 'pcs'}</td>
                    <td>₹{item.total.toFixed(2)}</td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit || 'pcs'}</td>
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
              <span>₹{(currentInvoice?.subtotal || 0).toFixed(2)}</span>
            </div>
            {(currentInvoice?.advancePayment || 0) > 0 && (
              <div className="invoice-totals-row">
                <span>Advance Payment:</span>
                <span>-₹{(currentInvoice?.advancePayment || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="invoice-totals-row">
              <span>Discount ({currentInvoice?.discountRate}%):</span>
              <span>-₹{(currentInvoice?.discountAmount || 0).toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row">
              <span>Shipping Charges:</span>
              <span>₹{(currentInvoice?.shippingCharges || 0).toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row">
              <span>Packing Charges:</span>
              <span>₹{(currentInvoice?.packingCharges || 0).toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row total">
              <span>Total:</span>
              <span>₹{(currentInvoice?.total || 0).toFixed(2)}</span>
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

      {/* Customer Modal */}
      <Modal
        title="Add New Customer"
        open={customerModalVisible}
        onOk={() => {
          customerForm.validateFields().then(values => {
            // Generate a unique ID for the new customer
            const newCustomer = {
              ...values,
              id: `cust-${Date.now()}`,
              // Ensure all fields are properly initialized
              houseNumber: values.houseNumber || '',
              city: values.city || '',
              district: values.district || '',
              state: values.state || '',
              pinCode: values.pinCode || '',
              landmark: values.landmark || '',
              mobileNumber1: values.mobileNumber1 || '',
              mobileNumber2: values.mobileNumber2 || '',
              source: values.source || '',
            };
            
            // Add to customers list
            const updatedCustomers = [...customers, newCustomer];
            setCustomers(updatedCustomers);
            
            // Save to localStorage
            localStorage.setItem('customers', JSON.stringify(updatedCustomers));
            
            // Select the new customer
            setSelectedCustomer(newCustomer);
            form.setFieldsValue({ customerId: newCustomer.id });
            
            // Reset form and close modal
            customerForm.resetFields();
            setCustomerModalVisible(false);
            
            message.success('Customer added successfully');
          });
        }}
        onCancel={() => {
          customerForm.resetFields();
          setCustomerModalVisible(false);
        }}
        width={600}
      >
        <Form
          form={customerForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name *"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mobileNumber1"
                label="Mobile Number 1 *"
                rules={[{ required: true, message: 'Please enter mobile number' }]}
              >
                <Input placeholder="Enter primary mobile number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mobileNumber2"
                label="Mobile Number 2"
              >
                <Input placeholder="Enter secondary mobile number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="source"
                label="Source"
              >
                <Input placeholder="Enter source" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="houseNumber"
                label="House/Flat/Street No."
              >
                <Input placeholder="Enter house/flat/street number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City/Town/Village"
              >
                <Input placeholder="Enter city/town/village" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="district"
                label="P.O/District"
              >
                <Input placeholder="Enter P.O/District" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="state"
                label="State"
              >
                <Input placeholder="Enter state" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pinCode"
                label="PIN Code"
              >
                <Input placeholder="Enter PIN code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="landmark"
                label="Landmark"
              >
                <Input placeholder="Enter landmark" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoiceScreen;
