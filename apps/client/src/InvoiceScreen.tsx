
import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm, AutoComplete } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { CustomerData } from './services/mockApi';
import { api } from './lib/api';
import ProductDetailsSection from './ProductDetailsSection';
import ProductForm from './ProductForm';
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
  const [disablePriceFields, setDisablePriceFields] = useState(false);
  const [showRateField, setShowRateField] = useState(true);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('');
  const [showProductForm, setShowProductForm] = useState<boolean>(false);
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
    // Load customers from localStorage (same as CustomerScreen)
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
        // No fallback to mock customers
        setCustomers([]);
      }
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
        // No fallback to mock products
        setProducts([]);
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
      // No mock products - will remain empty until real products are loaded
      setProducts([]);
      setProductTypes([]);
    }

    // Load products directly from LocalStorage if available
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

  // Handles Adding Invoice to the
  const handleAddInvoice = () => {
    setEditingInvoice(null);
    
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
        invoice.invoiceNumber.startsWith(`INV_${financialYearShort}_`)
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

      return `INV_${financialYearShort}_${sequenceFormatted}`;
    };
    
    const newInvoice = {
      id: '',
      invoiceNumber: generateInvoiceNumber(),
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

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId );
    if (product) {
      // Set the product category
      const category = product.category || product.productType;
      itemForm.setFieldsValue({ productCategory: category });
      setSelectedProductCategory(category);
      
      // If product is Traded and category is Laddu Gopal Dress, lock and set default values
      if (product.productType === 'Traded' && category === 'Laddu Gopal Dress') {
        // Fetch the Rate per Piece value from the product
        const ratePerPiece = product.price || 0;
        itemForm.setFieldsValue({ 
          pricePerInch: 1,
          size: 1,
          rate: ratePerPiece
        });
        setDisablePriceFields(true);
        setShowRateField(true);
        setDisableRateField(false); // Allow editing rate field
      } 
      // If product is Manufactured and category is Laddu Gopal Base, show price per inch and size fields
      else if (product.productType === 'Manufactured' && category === 'Laddu Gopal Base') {
        // Fetch the Rate per Inch value from the product
        const ratePerInch = product.ratePerInch || 1;
        const size = 1;
        // Calculate Rate/Pc as Price Per Inch x Size
        const calculatedRate = ratePerInch * size;
        itemForm.setFieldsValue({ 
          pricePerInch: ratePerInch,
          size: size,
          rate: calculatedRate
        });
        setDisablePriceFields(false);
        setShowRateField(false);
        setDisableRateField(true); // Lock the rate field
      }
      // For all other products, set price per inch and size to 1 and hide them
      else {
        // Fetch the Rate per Piece value from the product
        const ratePerPiece = product.price || 0;
        itemForm.setFieldsValue({ 
          pricePerInch: 1,
          size: 1,
          rate: ratePerPiece
        });
        setDisablePriceFields(true);
        setShowRateField(true);
        setDisableRateField(false); // Allow editing rate field
      }
    }
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
              discountAmount = (subtotal * currentInvoice.discountRate) / 100;
            } else {
              // Use discount as fixed decimal amount
              discountAmount = currentInvoice.discountRate;
            }
            const subtotalAfterDiscount = subtotal - discountAmount;
            const subtotalAfterAdvanceFinal = subtotalAfterDiscount - (currentInvoice.advancePayment || 0);
            const total = subtotalAfterAdvanceFinal + currentInvoice.shippingCharges + currentInvoice.packingCharges;

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
        discountAmount = (subtotal * currentInvoice.discountRate) / 100;
      } else {
        // Use discount as fixed decimal amount
        discountAmount = currentInvoice.discountRate;
      }
      const subtotalAfterDiscount = subtotal - discountAmount;
      const subtotalAfterAdvanceFinal = subtotalAfterDiscount - (currentInvoice.advancePayment || 0);
      const total = subtotalAfterAdvanceFinal + currentInvoice.shippingCharges + currentInvoice.packingCharges;

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
        // Calculate the correct subtotal
        const subtotal = currentInvoice.items.reduce((sum, item) => {
          if (item.productCategory === 'Laddu Gopal Base') {
            return sum + item.total;
          } else {
            return sum + ((item.rate || 0) * (item.quantity || 0));
          }
        }, 0);
        discountAmount = (subtotal * value) / 100;
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
      // Calculate the correct subtotal
      const subtotal = currentInvoice.items.reduce((sum, item) => {
        if (item.productCategory === 'Laddu Gopal Base') {
          return sum + item.total;
        } else {
          return sum + ((item.rate || 0) * (item.quantity || 0));
        }
      }, 0);
      const total = subtotal - currentInvoice.discountAmount - (currentInvoice.advancePayment || 0) + value + currentInvoice.packingCharges;

      setCurrentInvoice({
        ...currentInvoice,
        shippingCharges: value,
        total,
      });
    }
  };

  const handlePackingChargesChange = (value: number) => {
    if (currentInvoice) {
      // Calculate the correct subtotal
      const subtotal = currentInvoice.items.reduce((sum, item) => {
        if (item.productCategory === 'Laddu Gopal Base') {
          return sum + item.total;
        } else {
          return sum + ((item.rate || 0) * (item.quantity || 0));
        }
      }, 0);
      const total = subtotal - currentInvoice.discountAmount - (currentInvoice.advancePayment || 0) + currentInvoice.shippingCharges + value;

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
      
      setCustomers(...customers, newCustomer);
      setSelectedCustomer(newCustomer);
      message.success('New customer saved successfully!');
    }).catch(error => {
      console.log('Validation error:', error);
      message.error('Please fill in all required customer fields');
    });
  };

  const getManufacturedColumns = () => {
    // Base columns that always show
    const columns = [
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
    ];
    
    // Check if there are any Laddu Gopal Base products in the current invoice
    const hasLadduGopalBase = currentInvoice?.items.some(item => item.productCategory === 'Laddu Gopal Base');

    // Only add Price Per Inch and Size columns if there are Laddu Gopal Base products
    if (hasLadduGopalBase) {
      // Add Price Per Inch and Size columns with conditional content
    const pricePerInchColumn = {
      title: 'Price Per Inch',
      dataIndex: 'pricePerInch',
      key: 'pricePerInch',
      render: (price: number, record: InvoiceItem) => {
        // Only show value for Laddu Gopal Base category
        if (record.productCategory === 'Laddu Gopal Base') {
          return `₹${price ? price.toFixed(2) : '0.00'}`;
        }
        return ''; // Return empty string for other categories
      },
    };
    
    const sizeColumn = {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: InvoiceItem) => {
        // Only show value for Laddu Gopal Base category
        if (record.productCategory === 'Laddu Gopal Base') {
          return size;
        }
        return ''; // Return empty string for other categories
      },
    };
    
      // Add conditional columns
      columns.push(pricePerInchColumn);
      columns.push(sizeColumn);
    }
    
    // Continue with the rest of the columns
    columns.push(
      {
        title: 'Rate/Pc',
        dataIndex: 'rate',
        key: 'rate',
        render: (rate: number, record: InvoiceItem) => {
          // For Laddu Gopal Base products, calculate rate as pricePerInch * size
          if (record.productCategory === 'Laddu Gopal Base') {
            const calculated = (record.pricePerInch || 0) * (record.size || 0);
            return `₹${calculated.toFixed(2)}`;
          }
          // For other products, use the rate value directly
          return `₹${rate ? rate.toFixed(2) : '0.00'}`;
        },
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
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        render: (total: number, record: InvoiceItem) => {
          // For Laddu Gopal Base products, calculate total as (pricePerInch * size) * quantity
          if (record.productCategory === 'Laddu Gopal Base') {
            const cpPerPc = (record.pricePerInch || 0) * (record.size || 0);
            const calculated = cpPerPc * (record.quantity || 0);
            return `₹${calculated.toFixed(2)}`;
          }
          // For other products, calculate total as rate * quantity
          const calculated = (record.rate || 0) * (record.quantity || 0);
          return `₹${calculated.toFixed(2)}`;
        },
      }
    );
    
    return columns;
  };

  const getTradedColumns = () => {
    // Base columns that always show
    const columns = [
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
    ];

    // Check if there are any Laddu Gopal Base products in the current invoice
    const hasLadduGopalBase = currentInvoice?.items.some(item => item.productCategory === 'Laddu Gopal Base');

    // Only add Size column if there are Laddu Gopal Base products
    if (hasLadduGopalBase) {
      // Add Size column with conditional content
      const sizeColumn = {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
        render: (size: number, record: InvoiceItem) => {
          // Only show value for Laddu Gopal Base category
          if (record.productCategory === 'Laddu Gopal Base') {
            return size;
          }
          return ''; // Return empty string for other categories
        },
      };

      // Add conditional columns
      columns.push(sizeColumn);
    }

    // Continue with the rest of the columns
    columns.push({
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `₹${price ? price.toFixed(2) : '0.00'}`,
    });
    columns.push({
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    });
    columns.push({
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit: string) => unit || 'pcs',
    });
    columns.push({
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number, record: InvoiceItem) => {
        const calculated = (record.price || 0) * (record.quantity || 0);
        return `₹${calculated.toFixed(2)}`;
      },
    });

    return columns;
  };

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
    // Invoice type column removed - always manufactured
      // dataIndex removed - always manufactured
      // key removed - always manufactured
      // render removed - always manufactured
        // span tag removed 
          // textTransform removed
          // color removed 
        // span opening tag removed
          // type removed
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number, record: Invoice) => {
        // Calculate the correct total
        const subtotal = record.items.reduce((sum, item) => {
          if (item.productCategory === 'Laddu Gopal Base') {
            return sum + item.total;
          } else {
            return sum + ((item.rate || 0) * (item.quantity || 0));
          }
        }, 0);
        const subtotalAfterAdvance = subtotal - (record.advancePayment || 0);
        const discountAmount = record.discountType === 'percentage' 
          ? (subtotal * (record.discountRate || 0)) / 100
          : (record.discountRate || 0);
        const subtotalAfterDiscount = subtotal - discountAmount;
        const subtotalAfterAdvanceFinal = subtotalAfterDiscount - (record.advancePayment || 0);
        const calculatedTotal = subtotalAfterAdvanceFinal + (record.shippingCharges || 0) + (record.packingCharges || 0);
        return `₹${calculatedTotal.toFixed(2)}`;
      },
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
            <Col span={12}>
              {/* Customer info fields moved below Add Customer button */}
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
                      // Calculate the correct subtotal
                      const subtotal = currentInvoice.items.reduce((sum, item) => {
                        if (item.productCategory === 'Laddu Gopal Base') {
                          return sum + item.total;
                        } else {
                          return sum + ((item.rate || 0) * (item.quantity || 0));
                        }
                      }, 0);
                      const total = subtotal - currentInvoice.discountAmount - (value || 0) + currentInvoice.shippingCharges + currentInvoice.packingCharges;
                      
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
          
          {/* Invoice Summary */}
          <div style={{ marginTop: 20, borderTop: '1px solid #d9d9d9', paddingTop: 20, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <Row>
              <Col span={18}>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#333' }}>Subtotal:</div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#333' }}>
                  ₹{(currentInvoice?.items.reduce((sum, item) => {
                    if (item.productCategory === 'Laddu Gopal Base') {
                      return sum + item.total;
                    } else {
                      return sum + ((item.rate || 0) * (item.quantity || 0));
                    }
                  }, 0) || 0).toFixed(2)}
                </div>
              </Col>
            </Row>
            {(currentInvoice?.advancePayment || 0) > 0 && (
              <Row style={{ marginTop: 8 }}>
                <Col span={18}>
                  <div style={{ textAlign: 'right', color: '#333' }}>Advance Payment:</div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'right', color: '#333' }}>
                    -₹{(currentInvoice?.advancePayment || 0).toFixed(2)}
                  </div>
                </Col>
              </Row>
            )}
            <Row style={{ marginTop: 8 }}>
              <Col span={18}>
                <div style={{ textAlign: 'right', color: '#333' }}>Discount:</div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'right', color: '#333' }}>
                  -₹{(currentInvoice?.discountAmount || 0).toFixed(2)}
                </div>
              </Col>
            </Row>
            <Row style={{ marginTop: 8 }}>
              <Col span={18}>
                <div style={{ textAlign: 'right', color: '#333' }}>Shipping Charges:</div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'right', color: '#333' }}>
                  ₹{(currentInvoice?.shippingCharges || 0).toFixed(2)}
                </div>
              </Col>
            </Row>
            <Row style={{ marginTop: 8 }}>
              <Col span={18}>
                <div style={{ textAlign: 'right', color: '#333' }}>Packing Charges:</div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'right', color: '#333' }}>
                  ₹{(currentInvoice?.packingCharges || 0).toFixed(2)}
                </div>
              </Col>
            </Row>
            <Row style={{ marginTop: 16, borderTop: '1px solid #d9d9d9', paddingTop: 16 }}>
              <Col span={18}>
                <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Total:</div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                  ₹{(() => {
                    const subtotal = currentInvoice?.items.reduce((sum, item) => {
                      if (item.productCategory === 'Laddu Gopal Base') {
                        return sum + item.total;
                      } else {
                        return sum + ((item.rate || 0) * (item.quantity || 0));
                      }
                    }, 0) || 0;
                    const discountAmount = currentInvoice?.discountAmount || 0;
                    const subtotalAfterDiscount = subtotal - discountAmount;
                    const subtotalAfterAdvance = subtotalAfterDiscount - (currentInvoice?.advancePayment || 0);
                    const total = subtotalAfterAdvance + (currentInvoice?.shippingCharges || 0) + (currentInvoice?.packingCharges || 0);
                    return total.toFixed(2);
                  })()}
                </div>
              </Col>
            </Row>
          </div>
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
            hidden={true}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="productIdDisplay"
            label="Product"
            rules={[{ required: true, message: 'Please select or enter a product!' }]}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Select 
              placeholder="Select or enter a product"

              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => {
                // Check if the value matches an existing product ID
                const selectedProduct = products.find(p => p.id === value);
                
                if (selectedProduct) {
                  // Update the display field with the product name
                  itemForm.setFieldsValue({
                    productIdDisplay: selectedProduct.name,
                    productId: value
                  });
                  
                  // Use the handleProductSelect function
                  handleProductSelect(value);
                  
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
                {products.map((product) => (
                  <Select.Option key={product.id} value={product.id}>
                    {product.name}
                  </Select.Option>
                ))}
              </Select>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                // Open the product form in a modal
                setShowProductForm(true);
              }}
              title="Add New Product"
            />
            </div>
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
          >
            <InputNumber 
              min={0} 
              step={0.01} 
              style={{ width: '100%' }} 
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
              placeholder="Enter rate per piece"
              disabled={disableRateField}
            />
          </Form.Item>
          
          {currentInvoice?.invoiceType === 'manufactured' ? (
            <>
              <Form.Item
                name="pricePerInch"
                label="Price Per Inch"
                rules={[{ required: true, message: 'Please input price per inch!' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled={disablePriceFields} />
              </Form.Item>
              
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: 'Please input size!' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled={disablePriceFields} />
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
            rules={[{ required: true, message: 'Please select or enter unit!' }]}
            initialValue="pcs"
          >
            <AutoComplete
              placeholder="Select or enter unit"
              options={[
                { value: 'pcs', label: 'Pieces' },
                { value: '500gm', label: '500gm' },
                { value: '1kg', label: '1kg' },
                { value: '500pieces', label: '500pieces' },
                { value: '1m', label: '1 Meter' },
                { value: 'kg', label: 'Kilogram' },
                { value: 'g', label: 'Gram' },
                { value: 'l', label: 'Liter' },
                { value: 'ml', label: 'Milliliter' },
                { value: 'Set', label: 'Set' },
                { value: 'Dozen', label: 'Dozen' },
              ]}
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
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
                {/* Empty div to maintain layout */}
              </div>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              {(() => {
                // Check if there are any Laddu Gopal Base products in the current invoice
                const hasLadduGopalBase = currentInvoice?.items.some(item => item.productCategory === 'Laddu Gopal Base');
                
                if (currentInvoice?.invoiceType === 'manufactured') {
                  if (hasLadduGopalBase) {
                    return (
                      <tr>
                        <th>Product Name</th>
                        {hasLadduGopalBase && <th>Price Per Inch</th>}
                        {hasLadduGopalBase && <th>Size</th>}
                        <th>Rate /Pc</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Total</th>
                      </tr>
                    );
                  } else {
                    return (
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    );
                  }
                } else {
                  return (
                    <tr>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  );
                }
              })()}
            </thead>
            <tbody>
              {(() => {
                // Check if there are any Laddu Gopal Base products in the current invoice
                const hasLadduGopalBase = currentInvoice?.items.some(item => item.productCategory === 'Laddu Gopal Base');
                
                return currentInvoice?.items.map((item) => {
                  if (currentInvoice?.invoiceType === 'manufactured') {
                    if (hasLadduGopalBase) {
                      return (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          {hasLadduGopalBase && <td>{item.productCategory === 'Laddu Gopal Base' && currentInvoice?.invoiceType === 'manufactured' ? `₹${(item.pricePerInch || 0).toFixed(2)}` : ''}</td>}
                          {hasLadduGopalBase && <td>{item.productCategory === 'Laddu Gopal Base' ? item.size : ''}</td>}
                          <td>₹{item.productCategory === 'Laddu Gopal Base' ? ((item.pricePerInch || 0) * (item.size || 0)).toFixed(2) : (item.rate || 0).toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit || 'pcs'}</td>
                          <td>₹{item.productCategory === 'Laddu Gopal Base' ? item.total.toFixed(2) : ((item.rate || 0) * (item.quantity || 0)).toFixed(2)}</td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit || 'pcs'}</td>
                          <td>₹{item.price.toFixed(2)}</td>
                          <td>₹{item.productCategory === 'Laddu Gopal Base' ? item.total.toFixed(2) : ((item.rate || 0) * (item.quantity || 0)).toFixed(2)}</td>
                        </tr>
                      );
                    }
                  } else {
                    return (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit || 'pcs'}</td>
                        <td>₹{item.price.toFixed(2)}</td>
                        <td>₹{item.productCategory === 'Laddu Gopal Base' ? item.total.toFixed(2) : ((item.rate || 0) * (item.quantity || 0)).toFixed(2)}</td>
                      </tr>
                    );
                  }
                });
              })()}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="invoice-totals-row">
              <span>Subtotal:</span>
              <span>₹{(currentInvoice?.items.reduce((sum, item) => {
                if (item.productCategory === 'Laddu Gopal Base') {
                  return sum + item.total;
                } else {
                  return sum + ((item.rate || 0) * (item.quantity || 0));
                }
              }, 0) || 0).toFixed(2)}</span>
            </div>
            {(currentInvoice?.advancePayment || 0) > 0 && (
              <div className="invoice-totals-row">
                <span>Advance Payment:</span>
                <span>-₹{(currentInvoice?.advancePayment || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="invoice-totals-row">
              <span>Discount: </span>
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
              <span>₹{(() => {
                const subtotal = currentInvoice?.items.reduce((sum, item) => {
                  if (item.productCategory === 'Laddu Gopal Base') {
                    return sum + item.total;
                  } else {
                    return sum + ((item.rate || 0) * (item.quantity || 0));
                  }
                }, 0) || 0;

                const discountAmount = currentInvoice?.discountAmount || 0; 

                const subtotalAfterDiscount = subtotal - discountAmount;
                const subtotalAfterAdvance = subtotalAfterDiscount - (currentInvoice?.advancePayment || 0);
                const total = subtotalAfterAdvance + (currentInvoice?.shippingCharges || 0) + (currentInvoice?.packingCharges || 0);
                return total.toFixed(2);
              })()}</span>
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
                <Select
                  showSearch
                  placeholder="Select or type a state"
                  mode="combobox"
                >
                </Select>
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

      {/* Product Form Modal */}
      <Modal
        title="Add New Product"
        open={showProductForm}
        onCancel={() => setShowProductForm(false)}
        footer={null}
        width={800}
      >
        <ProductForm
          onProductAdded={(newProduct) => {
            // Add the new product to the products list
            setProducts([...products, newProduct]);
            // Close the modal
            setShowProductForm(false);
            // Select the newly added product
            itemForm.setFieldsValue({
              productId: newProduct.id,
              productIdDisplay: newProduct.name
            });
            // Set the rate field with the product price
            itemForm.setFieldsValue({
              rate: newProduct.price
            });
            // Handle product category change
            handleProductCategoryChange(newProduct.productCategory);
          }}
          onCancel={() => setShowProductForm(false)}
        />
      </Modal>
    </div>
  );
};

export default InvoiceScreen;
