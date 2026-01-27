
import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm, AutoComplete, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined, LockOutlined, CopyOutlined, HistoryOutlined } from '@ant-design/icons';
import moment from 'moment';
import InvoiceActionLog from './components/InvoiceActionLog';
import { useReactToPrint } from 'react-to-print';
import { CustomerData } from './services/mockApi';
import { api } from './lib/api';
import ProductDetailsSection from './ProductDetailsSection';
import ProductForm from './ProductForm';
import InvoicePreview from './components/InvoicePreview';
import './InvoiceScreen.css';
import './components/InvoicePreview.css';

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
  ratePerPiece?: number;
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
  ratePerInch?: number;
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
  notesLine1?: string;
  notesLine2?: string;
  notesLine3?: string;
  isFinalized?: boolean;
}

const InvoiceScreen: React.FC = () => {
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
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
  const [actionLogVisible, setActionLogVisible] = useState<boolean>(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null);
  const [showDuplicateButton, setShowDuplicateButton] = useState(() => {
    const saved = localStorage.getItem('uiSettings');
    return saved ? JSON.parse(saved).showDuplicateButton : true; // Default to true
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewClearedAfterDeletion, setPreviewClearedAfterDeletion] = useState(false);
  const [printSelectedVisible, setPrintSelectedVisible] = useState(false);
  const [viewSelectedLogsVisible, setViewSelectedLogsVisible] = useState(false);
  const [selectedActionLogs, setSelectedActionLogs] = useState<any[]>([]);
  const printSelectedRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [pincodeData, setPincodeData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/pincodes.json')
      .then((response) => response.json())
      .then((data) => setPincodeData(data))
      .catch((error) => console.error('Error loading pincode data:', error));
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
        const saved = localStorage.getItem('uiSettings');
        const newShowFlag = saved ? JSON.parse(saved).showDuplicateButton : true;
        setShowDuplicateButton(newShowFlag);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logAction = async (action: string, invoiceId: string, invoiceNumber: string, details: string = '') => {
    try {
      const logs = JSON.parse(localStorage.getItem('action_logs') || '[]');
      const newLog = {
        id: Date.now().toString(),
        invoiceId,
        invoiceNumber,
        action,
        details,
        timestamp: new Date().toISOString(),
        // In a real app, user ID and name would be sourced from auth context
        userId: 1, // Placeholder
        username: 'System Admin' // Placeholder
      };
      logs.push(newLog);
      localStorage.setItem('action_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to log action to localStorage:', error);
      // Silently fail for now
    }
  };

  // Helper function to sort invoices by invoiceNumber
  const sortInvoices = (invoiceArray: Invoice[]): Invoice[] => {
    // Extract numeric part from invoice numbers for proper numerical sorting
    const extractNumericPart = (invoiceNumber: string) => {
      const match = invoiceNumber.match(/_(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    return [...invoiceArray].sort((a, b) => {
      const numA = extractNumericPart(a.invoiceNumber);
      const numB = extractNumericPart(b.invoiceNumber);
      
      if (numA === numB) {
        return a.invoiceNumber.localeCompare(b.invoiceNumber); // Fallback to alphanumeric for tie-breaking
      }
      return numA - numB;
    });
  };

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
    console.log('Raw invoices from localStorage:', savedInvoices);
    
    if (savedInvoices) {
      try {
        const parsedInvoices = JSON.parse(savedInvoices);
        console.log('Parsed invoices from localStorage:', parsedInvoices);
        console.log('Number of invoices:', parsedInvoices.length);
        
        // Only update state if we have valid invoices
        if (Array.isArray(parsedInvoices)) {
          setInvoices(sortInvoices(parsedInvoices));
          console.log('Successfully set invoices in state');
        } else {
          console.log('Invalid invoices format in localStorage');
        }
      } catch (error) {
        console.error('Error parsing saved invoices:', error);
      }
    } else {
      console.log('No invoices found in localStorage');
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

  React.useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      const [startDate, endDate] = dateRange;
      const filtered = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
      });
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoices);
    }
  }, [dateRange, invoices]);

  // Save current invoice to localStorage whenever it changes
  React.useEffect(() => {
    if (currentInvoice) {
      localStorage.setItem('currentInvoice', JSON.stringify(currentInvoice));
    } else {
      localStorage.removeItem('currentInvoice');
    }
  }, [currentInvoice]);

  // Update rate for Laddu Gopal Base, RK Base, Mata Rani Base, Ganesh Lakshmi Base and Shyam Baba Base products
  React.useEffect(() => {
    const upperCategory = selectedProductCategory.toUpperCase();
    if ((upperCategory === 'LADDU GOPAL BASE' || 
         upperCategory === 'RK BASE' || 
         upperCategory === 'MATA RANI BASE' ||
         upperCategory === 'GANESH LAKSHMI BASE' ||
         upperCategory === 'SHYAM BABA BASE') && 
        currentInvoice?.invoiceType === 'manufactured' && 
        itemForm) {
      const ratePerInch = itemForm.getFieldValue('ratePerInch') || 0;
      const size = itemForm.getFieldValue('size') || 0;
      const rate = ratePerInch * size;
      
      console.log('useEffect updating rate:', { ratePerInch, size, rate });
      
      if (rate !== itemForm.getFieldValue('rate')) {
        itemForm.setFieldsValue({ rate });
      }
    }
  }, [selectedProductCategory, currentInvoice, itemForm, itemForm?.getFieldValue('ratePerInch'), itemForm?.getFieldValue('size')]);

  // Save invoices to localStorage whenever they change
  React.useEffect(() => {
    try {
      console.log('Saving invoices to localStorage:', invoices);
      localStorage.setItem('invoices', JSON.stringify(invoices));
    } catch (error) {
      console.error('Error saving invoices to localStorage:', error);
    }
  }, [invoices]);

  // Initialize invoices from localStorage on component mount
  React.useEffect(() => {
    console.log('Component mounted, attempting to load invoices from localStorage');
    const savedInvoices = localStorage.getItem('invoices');
    console.log('Raw invoices from localStorage:', savedInvoices);
    
    if (savedInvoices) {
      try {
        const parsedInvoices = JSON.parse(savedInvoices);
        console.log('Parsed invoices from localStorage:', parsedInvoices);
        console.log('Number of invoices:', parsedInvoices.length);
        
        // Only update state if we have valid invoices
        if (Array.isArray(parsedInvoices) && parsedInvoices.length > 0) {
          setInvoices(sortInvoices(parsedInvoices));
          console.log('Successfully set invoices in state');
        } else {
          console.log('No valid invoices found in localStorage');
        }
      } catch (error) {
        console.error('Error initializing invoices from localStorage:', error);
      }
    } else {
      console.log('No invoices found in localStorage');
    }
  }, []);

  // Load customers from localStorage and update on changes
  useEffect(() => {
    const loadCustomers = () => {
      try {
        const savedCustomers = localStorage.getItem('customers');
        if (savedCustomers) {
          const customersData = JSON.parse(savedCustomers);
          if (Array.isArray(customersData)) {
            const formattedCustomers = customersData.map((customer: any) => ({
              id: customer.id,
              // Normalize data from both CustomerScreen (name, phone) and old InvoiceScreen (customerName, mobileNumber1)
              customerName: customer.name || customer.customerName || '',
              mobileNumber1: customer.phone || customer.mobileNumber1 || '',
              mobileNumber2: customer.mobileNumber2 || '',
              email: customer.email || '',
              // Address fields can also be inconsistent
              houseNumber: customer.houseNumber || '',
              address: customer.address || '',
              city: customer.city || '',
              district: customer.district || '',
              state: customer.state || '',
              pinCode: customer.pinCode || customer.postalCode || '',
              landmark: customer.landmark || '',
              source: customer.source || ''
            }));
            setCustomers(formattedCustomers);
          } else {
            console.warn("Customers data in localStorage is not an array.");
            setCustomers([]);
          }
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error loading or parsing customers from localStorage:', error);
        setCustomers([]);
      }
    };

    loadCustomers();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'customers') {
        loadCustomers();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sample data
  React.useEffect(() => {
    // Load products from localStorage first, then fallback to API
    const loadProducts = async () => {
      try {
        // First try to get products from localStorage
        const savedProducts = localStorage.getItem('erp_inventory');
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          // Transform the data to match our Product interface
          const transformedProducts = parsedProducts.map((item: any) => {
            const category = item.productCategory || 'General';
            const inferredProductType = category.toUpperCase().includes('BASE') ? 'Manufactured' : 'Traded';
            return {
              id: item.id,
              sku: item.sku,
              name: item.name,
              size: item.size || 0,
              unit: item.unit || 'pcs',
              quantity: item.quantity || 0,
              price: item.ratePerPiece || 0, // Use ratePerPiece as price
              productType: item.productType || inferredProductType,
              category: category,
              costPricePerInch: item.costPricePerInch,
              ratePerInch: item.ratePerInch
            };
          });
          setProducts(transformedProducts);
        } else {
          // Fallback to API if no products in localStorage
          const productsResponse = await api.get('/inventory');
          // Transform the data to match our Product interface
          const transformedProducts = productsResponse.map((item: any) => {
            const category = item.category || 'General';
            const inferredProductType = category.toUpperCase().includes('BASE') ? 'Manufactured' : 'Traded';
            return {
              id: item.id,
              sku: item.sku,
              name: item.name,
              size: item.size || 0,
              unit: item.unit || 'pcs',
              quantity: item.quantity || 0,
              price: item.price || 0,
              productType: item.productType || inferredProductType,
              category: category,
              costPricePerInch: item.costPricePerInch,
              ratePerInch: item.ratePerInch
            };
          });
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
      setProductTypes([]);
    }
  }, [products]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: currentInvoice ? `Invoice_${currentInvoice.invoiceNumber}` : 'Invoice',
    onPrintError: (errorLocation) => {
      console.error('Error printing:', errorLocation);
      message.error('Failed to print invoice');
    }
  });

  const handlePrintSelectedInvoices = useReactToPrint({
    content: () => printSelectedRef.current,
  });

  const handlePrintAddress = (invoice: Invoice) => {
    // Get customer data
    const customer = customers.find(c => c.customerName === invoice.customerName);
    
    // Create a hidden iframe for printing
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'absolute';
    printIframe.style.left = '-9999px';
    printIframe.style.top = '-9999px';
    document.body.appendChild(printIframe);
    
    // Create HTML content for the address print
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Address Information</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.5;
          }
          .address-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
          }
          .address-section {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .address-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
            padding-bottom: 5px;
          }
          .address-details {
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="address-container">
          <div class="address-section">
            <div class="address-title"><strong>TO</strong></div>
            <div class="address-details"><strong> ${invoice.customerName}</strong></div>
            ${customer ? `
              <div class="address-details">${[customer.address, customer.houseNumber].filter(Boolean).join(', ')}</div>
              <div class="address-details">${[customer.city, customer.district].filter(Boolean).join(', ')}</div>
              <div class="address-details">${[customer.state, customer.pinCode].filter(Boolean).join(' - ')}</div>
              ${customer.landmark ? `<div class="address-details">Landmark: ${customer.landmark}</div>` : ''}
              <div class="address-details"><strong>Mobile:</strong> ${customer.mobileNumber1 || ''} ${customer.mobileNumber2 ? ', ' + customer.mobileNumber2 : ''}</div>
            ` : '<div class="address-details">No customer details available</div>'}
          </div>
          <div class="address-section">
            <div class="address-title"><strong>FROM</strong></div>
            <div class="address-details"><strong>POOJA KREATIONS</strong></div>
            <div class="address-details">Cinema Hall Road, near Shiv Temple, Industrial Area,</div>
            <div class="address-details">Durgapur, West Bengal 713201</div>
            <div class="address-details"><strong>CONTACT NO.:</strong> 96145 22527</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Write content to the iframe
    printIframe.contentDocument?.open();
    printIframe.contentDocument?.write(printContent);
    printIframe.contentDocument?.close();
    
    // Print directly
    printIframe.contentWindow?.print();
    
    // Clean up after printing
    setTimeout(() => {
      document.body.removeChild(printIframe);
    }, 1000);
  };

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

    // Get existing invoices with PK prefix
    const existingInvoices = invoices.filter(invoice =>
      invoice.invoiceNumber.startsWith('INV_PK_')
    );

    // Find the highest sequence number
    let nextSequence = 1;
    if (existingInvoices.length > 0) {
      const sequences = existingInvoices.map(invoice => {
        // Use regex to extract the sequence number from the end of the invoice number
        const match = invoice.invoiceNumber.match(/_(\d+)$/);
        const sequenceNumber = match ? parseInt(match[1], 10) : 0;
        console.log(`Extracted sequence ${sequenceNumber} from invoice ${invoice.invoiceNumber}`);
        return sequenceNumber;
      });
      const maxSequence = Math.max(...sequences);
      console.log(`Max sequence found: ${maxSequence}, next sequence will be: ${maxSequence + 1}`);
      nextSequence = maxSequence + 1;
    }

    // Format with leading zeros
    const sequenceFormatted = nextSequence.toString().padStart(3, '0');

    return `INV_PK_${financialYearShort}_${sequenceFormatted}`;
  };

  const handleAddInvoice = () => {
    form.resetFields(); // Ensure form is cleared before population
    setEditingInvoice(null);
    setSelectedCustomer(null); // Reset selected customer
    

    const newInvoice = {
      id: Date.now().toString(),
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
      isFinalized: false, // New invoices are always not finalized
    };
    form.setFieldsValue(newInvoice);
    setCurrentInvoice(newInvoice);
    setPreviewClearedAfterDeletion(false);
    setVisible(true);
  };

  const handleDuplicateInvoice = (invoiceToDuplicate: Invoice) => {
    const duplicatedInvoice: Invoice = {
      ...invoiceToDuplicate,
      id: Date.now().toString(), // New unique ID
      invoiceNumber: generateInvoiceNumber(), // New unique invoice number
      date: new Date().toISOString().split('T')[0], // Set current date
      isFinalized: false, // Duplicated invoice is always a draft
      // Optionally reset other fields like advancePayment, discount, etc. if desired
      advancePayment: 0,
      discountRate: 0,
      discountAmount: 0,
      shippingCharges: 0,
      packingCharges: 0,
      total: invoiceToDuplicate.subtotal, // Reset total based on subtotal (no discounts/charges yet)
    };

    // Deep copy items to ensure they are new instances
    duplicatedInvoice.items = invoiceToDuplicate.items.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substring(7), // New ID for each item
    }));
    
    const newInvoices = [...invoices, duplicatedInvoice];
    setInvoices(sortInvoices(newInvoices)); // Will be sorted after this step
    localStorage.setItem('invoices', JSON.stringify(newInvoices));
    message.success(`Invoice ${invoiceToDuplicate.invoiceNumber} duplicated as ${duplicatedInvoice.invoiceNumber}. New Invoice Number: ${duplicatedInvoice.invoiceNumber}`);
    logAction('duplicated', duplicatedInvoice.id, duplicatedInvoice.invoiceNumber, `Duplicated from invoice ${invoiceToDuplicate.invoiceNumber}.`);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    if (invoice.isFinalized) {
      message.error('This invoice has been finalized and cannot be edited');
      return;
    }
    
    // Split the notes into separate lines if it exists
    const notesLines = invoice.notes ? invoice.notes.split('\n') : ['', '', ''];
    const formValues = {
      ...invoice,
      notesLine1: invoice.notesLine1 || notesLines[0] || '',
      notesLine2: invoice.notesLine2 || notesLines[1] || '',
      notesLine3: invoice.notesLine3 || notesLines[2] || ''
    };
    
    setEditingInvoice(invoice);
    form.setFieldsValue(formValues);
    setCurrentInvoice(invoice);
    setPreviewClearedAfterDeletion(false);
    
    // Find and set the selected customer based on customer name
    const customer = customers.find(c => c.customerName === invoice.customerName);
    if (customer) {
      setSelectedCustomer(customer);
    }
    
    setVisible(true);
  };

  const handleDeleteInvoice = (id: string) => {
    const invoiceToDelete = invoices.find(invoice => invoice.id === id);
    if (!invoiceToDelete) {
      console.error("Could not find invoice to delete for logging.");
      // Still proceed with deletion
      const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      message.success('Invoice deleted successfully');
      return;
    }

    const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
    setInvoices(updatedInvoices);

    // If the deleted invoice is the one being previewed, clear the preview
    if (currentInvoice && currentInvoice.id === id) {
      setCurrentInvoice(null);
      setPreviewClearedAfterDeletion(true);
    }

    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    message.success('Invoice deleted successfully');
    logAction('deleted', invoiceToDelete.id, invoiceToDelete.invoiceNumber, 'Invoice deleted.');
  };

  const handleFinalizeInvoice = (invoice: Invoice) => {
    // 1. Get all products
    const savedProducts = localStorage.getItem('erp_inventory');
    if (!savedProducts) {
      message.error('Could not find product list to update stock. Finalization aborted.');
      return;
    }

    let products;
    try {
      products = JSON.parse(savedProducts);
      if (!Array.isArray(products)) throw new Error("Products data is not an array.");
    } catch (error) {
      message.error('Could not parse product list. Finalization aborted.');
      console.error(error);
      return;
    }
    
    // Create a map for efficient lookup
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const newActivityLogs: any[] = [];
    // 3. Update stock for each item
    for (const item of invoice.items) {
      const product = productMap.get(item.productId);
      if (product) {
        const previousQuantity = product.quantity;
        
        if (product.productType === 'Manufactured') {
          product.quantity += item.quantity;
        } else {
          product.quantity -= item.quantity;
        }

        newActivityLogs.push({
          id: `${Date.now()}-${item.productId}-${Math.random()}`,
          itemId: item.productId,
          itemName: item.name,
          action: 'sale',
          previousQuantity: previousQuantity,
          newQuantity: product.quantity, // Log the new quantity
          timestamp: new Date().toISOString(),
          user: 'System',
          invoiceId: invoice.id
        });
      }
    }

    // 4. Get the updated product list from the map
    const updatedProducts = Array.from(productMap.values());

    try {
      // 5. Save updated product list
      localStorage.setItem('erp_inventory', JSON.stringify(updatedProducts));

      const existingLogs = JSON.parse(localStorage.getItem('inventoryActivityLogs') || '[]');
      const updatedLogs = [...newActivityLogs, ...existingLogs];
      localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
      
      // 6. Finalize the invoice
      const updatedInvoice = { ...invoice, isFinalized: true };
      const updatedInvoices = invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv);
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      message.success('Invoice finalized and stock updated successfully');
      logAction('finalized', updatedInvoice.id, updatedInvoice.invoiceNumber, `Stock updated for ${invoice.items.length} items.`);

      // Also update the 'products' state in this component to reflect changes immediately
      setProducts(updatedProducts);

    } catch (error) {
      console.error('Error during finalization:', error);
      message.error('An error occurred during finalization.');
    }
  };

  const handleViewActionLog = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoiceId(invoice.id);
      setSelectedInvoiceNumber(invoice.invoiceNumber);
    } else {
      setSelectedInvoiceId(null);
      setSelectedInvoiceNumber(null);
    }
    setActionLogVisible(true);
  };

  const handleSaveInvoice = () => {
    form
      .validateFields()
      .then(values => {
        if (currentInvoice) {
          // Combine the notes lines into a single notes field
          const notesLine1 = values.notesLine1 || '';
          const notesLine2 = values.notesLine2 || '';
          const notesLine3 = values.notesLine3 || '';
          const combinedNotes = `${notesLine1}\n${notesLine2}\n${notesLine3}`.trim();
          
          const updatedInvoice: Invoice = {
            ...currentInvoice,
            ...values,
            notes: combinedNotes,
            notesLine1,
            notesLine2,
            notesLine3,
            id: editingInvoice ? editingInvoice.id : Date.now().toString(),
          };

          if (editingInvoice) {
            const updatedInvoices = invoices.map(invoice => invoice.id === editingInvoice.id ? updatedInvoice : invoice);
            setInvoices(sortInvoices(updatedInvoices));
            try {
              localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
              console.log('Saved updated invoices to localStorage');
            } catch (error) {
              console.error('Error saving updated invoices to localStorage:', error);
            }
            message.success('Invoice updated successfully');
            logAction('editted', updatedInvoice.id, updatedInvoice.invoiceNumber, 'Invoice details updated.');
          } else {
            const newInvoices = [...invoices, updatedInvoice];
            setInvoices(newInvoices);
            try {
              localStorage.setItem('invoices', JSON.stringify(newInvoices));
              console.log('Saved new invoices to localStorage');
            } catch (error) {
              console.error('Error saving new invoices to localStorage:', error);
            }
            message.success('Invoice added successfully');
            logAction('created', updatedInvoice.id, updatedInvoice.invoiceNumber, 'New invoice created.');
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

  const handleProductSelect = (productId: string) => {
    console.log('Selecting product with ID:', productId);
    const product = products.find(p => p.id === productId );
    if (product) {
      console.log('Found product:', product);
      console.log('Product ratePerInch:', product.ratePerInch);
      // Set the product category
      const category = (product.category || product.productType || '').toUpperCase();
      itemForm.setFieldsValue({ productCategory: category });
      setSelectedProductCategory(category);

      // Set default values for Laddu Gopal Mukut
      if (category.includes('LADDU GOPAL MUKUT')) {
        console.log('Setting default values for Laddu Gopal Mukut');
        itemForm.setFieldsValue({
          ratePerInch: 1,
          size: product.size || 1 // Use product size
        });
      }
      
      // If product is Traded or Laddu Gopal Mukut, show only rate per piece
      if (product.productType?.toUpperCase() === 'TRADED' || product.name.toUpperCase().includes('LADDU GOPAL MUKUT') || category.includes('LADDU GOPAL MUKUT')) {
        // Fetch the Rate per Piece value from the product
        const ratePerPiece = product.price || 0;
        itemForm.setFieldsValue({ 
          rate: ratePerPiece,
          ratePerInch: 1, // Keep value in background
          size: product.size || 1 // Use product size
        });
        setDisablePriceFields(true);
        setShowRateField(true);
        setDisableRateField(false); // Allow editing rate field
      } 
      // If product is Manufactured and category contains "Base", show price per inch and size fields
      else if (product.productType?.toUpperCase() === 'MANUFACTURED' && category.includes('BASE')) {
        // Fetch the Rate Per Inch value from the product
        const ratePerInch = product.ratePerInch || product.costPricePerInch || 1;
        const size = product.size || 1; // Use product size
        // Calculate Rate/Pc as Price Per Inch x Size
        itemForm.setFieldsValue({ 
          ratePerInch: ratePerInch,
          size: size,
          rate: ratePerInch * size
        });
        setDisablePriceFields(false);
        setShowRateField(true);
        setDisableRateField(true); // Lock rate field for manufactured products with "Base" in category
      }
      // If product is Manufactured and category is Shyam Baba Base, show price per inch and size fields but keep them unlocked
      // Shyam Baba Base is now handled by the general Base condition above
      // For all other products, set default values
      else {
        // Fetch the Rate per Piece value from the product
        const ratePerPiece = product.price || 0;
        itemForm.setFieldsValue({ 
          rate: ratePerPiece,
          size: product.size || 'N/A'
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
              const ratePerInch = values.ratePerInch || 0;
              const size = values.size || 0;
              // Use the rate value from the form field, which should already be calculated
              const rate = values.rate || (ratePerInch * size);
              const cpPerPc = rate;
              const total = rate * values.quantity;
              console.log('Saving item:', { ratePerInch, size, rate, cpPerPc, total, formRate: values.rate });
              
              newItem = {
                id: Date.now().toString(),
                productId: values.productId,
                name: product.name,
                unit: values.unit || product.unit || 'pcs',
                quantity: values.quantity,
                price: rate,
                total: total,
                productCategory: product.category || '',
                ratePerInch: ratePerInch,
                size: size,
                cpPerPc: cpPerPc,
                rate: rate,
              };
            } else {
              const rate = values.rate || product.price || 1; // Default to 1 if both are undefined or 0
              const ratePerInch = values.ratePerInch || 1; // Default to 1 for traded products
              const size = values.size || 1; // Default to 1 for traded products
              newItem = {
                id: Date.now().toString(),
                productId: values.productId,
                name: product.name,
                unit: values.unit || product.unit || 'pcs',
                quantity: values.quantity,
                price: rate,
                total: rate * values.quantity * size * ratePerInch,
                productCategory: product.category || '',
                rate: rate,
                ratePerInch: ratePerInch,
                size: size,
              };
            }

            const updatedItems = [...currentInvoice.items, newItem];
            console.log('Updated items:', JSON.stringify(updatedItems));
            console.log('New item:', JSON.stringify(newItem));
            console.log('New item rate:', newItem.rate);
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
                const ratePerInch = values.ratePerInch || 0;
                const size = values.size || 0;
                // Use the rate value from the form field, which should already be calculated
                const rate = values.rate || (ratePerInch * size);
                const cpPerPc = rate;
                const total = rate * values.quantity;
                
                updatedItem = {
                  ...currentInvoice.items[itemIndex],
                  productId: values.productId,
                  name: product.name,
                  unit: values.unit || product.unit || 'pcs',
                  quantity: values.quantity,
                  price: rate,
                  total: total,
                  productCategory: product.category || '',
                  ratePerInch: ratePerInch,
                  size: size,
                  cpPerPc: cpPerPc,
                  rate: rate,
                };
              } else {
                const rate = values.rate || product.price;
                const ratePerInch = values.ratePerInch || 1; // Default to 1 for traded products
                const size = values.size || 1; // Default to 1 for traded products
                updatedItem = {
                  ...currentInvoice.items[itemIndex],
                  productId: values.productId,
                  name: product.name,
                  unit: values.unit || product.unit || 'pcs',
                  quantity: values.quantity,
                  price: rate,
                  total: rate * values.quantity * size * ratePerInch,
                  productCategory: product.category || '',
                  rate: rate,
                  ratePerInch: ratePerInch,
                  size: size,
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
      
      // Calculate the correct subtotal
      const subtotal = currentInvoice.items.reduce((sum, item) => {
        if (item.productCategory?.toUpperCase() === 'LADDU GOPAL BASE') {
          return sum + item.total;
        } else {
          return sum + ((item.rate || 0) * (item.quantity || 0));
        }
      }, 0);
      
      if (discountType === 'percentage') {
        // Calculate discount as percentage of subtotal
        discountAmount = (subtotal * value) / 100;
      } else {
        // Use discount as fixed decimal amount
        discountAmount = value;
      }
      
      const total = subtotal - discountAmount - (currentInvoice.advancePayment || 0) + currentInvoice.shippingCharges + currentInvoice.packingCharges;

      setCurrentInvoice({
        ...currentInvoice,
        discountRate: value,
        discountAmount,
        subtotal,
        total,
      });
    }
  };

  const handleShippingChargesChange = (value: number) => {
    if (currentInvoice) {
      // Calculate the correct subtotal
      const subtotal = currentInvoice.items.reduce((sum, item) => {
        if (item.productCategory?.toUpperCase() === 'LADDU GOPAL BASE') {
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
        if (item.productCategory?.toUpperCase() === 'LADDU GOPAL BASE') {
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
    const upperValue = value.toUpperCase();
    // Disable rate field if product category is a base type
    setDisableRateField(
      upperValue === 'LADDU GOPAL BASE' || 
      upperValue === 'SHYAM BABA BASE' || 
      upperValue === 'MATA RANI BASE' || 
      upperValue === 'GANESH LAKSHMI BASE' || 
      upperValue === 'RK BASE'
    );
    
    // If rate field is disabled, clear its value
    if (
      upperValue === 'LADDU GOPAL BASE' || 
      upperValue === 'SHYAM BABA BASE' || 
      upperValue === 'MATA RANI BASE' || 
      upperValue === 'GANESH LAKSHMI BASE' || 
      upperValue === 'RK BASE'
    ) {
      itemForm.setFieldsValue({ rate: 0 });
    }
  };

  const handlePincodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    console.log(`Pincode blurred: ${pincode}`);
    if (pincode && pincode.length === 6) {
      const details = pincodeData.filter((item) => item.pincode === Number(pincode));
      console.log('Pincode details:', details);
      if (details && details.length > 0) {
        const location = details[0];
        console.log('Location found:', location);
        if (location) {
          customerForm.setFieldsValue({
            city: location.name,
            district: location.district,
            state: location.state,
          });
          console.log('Form values set');
        }
      }
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      
      // Format address for display, sourcing from multiple possible fields
      const formatAddress = (c: any) => {
        const addressParts = [
          c.address,
          c.houseNumber,
          c.city,
          c.district,
          c.state,
        ].filter(Boolean); // Filter out empty/null/undefined parts
        const mainAddress = addressParts.join(', ');
        const pin = c.pinCode || c.postalCode;
        const landmark = c.landmark ? ` (Landmark: ${c.landmark})` : '';
        
        let fullAddress = mainAddress;
        if (pin) {
          fullAddress += ` - ${pin}`;
        }
        fullAddress += landmark;
        
        return fullAddress;
      };
      
      const billingAddress = formatAddress(customer);
      
      form.setFieldsValue({
        customerName: customer.customerName, // This is now populated by loadCustomers
        customerEmail: customer.mobileNumber1, // This is now populated by loadCustomers
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
    
    // Check if there are any Laddu Gopal Base, RK Base or Mata Rani Base products in the current invoice
    const hasSpecialProducts = currentInvoice?.items.some(item => {
      const upperCategory = item.productCategory?.toUpperCase();
      return upperCategory === 'LADDU GOPAL BASE' || 
             upperCategory === 'RK BASE' || 
             upperCategory === 'MATA RANI BASE';
    });

    // Only add Price Per Inch and Size columns if there are special products
    if (hasSpecialProducts) {
      // Add Price Per Inch and Size columns with conditional content
    const ratePerInchColumn = {
      title: 'Rate Per Inch',
      dataIndex: 'ratePerInch',
      key: 'ratePerInch',
      render: (price: number, record: InvoiceItem) => {
        const upperCategory = record.productCategory?.toUpperCase();
        // Show size value only if it exists and is not empty
        // Show size for all products 
        if (upperCategory === 'LADDU GOPAL BASE' ||
            upperCategory === 'RK BASE' ||
            upperCategory === 'MATA RANI BASE' ||
            upperCategory === 'GANESH LAKSHMI BASE' ||
            upperCategory === 'SHYAM BABA BASE') {
          return `₹${price ? price.toFixed(2) : '0.00'}`;
        }
        return ''; // Return empty string for other categories
      },
    };
    
    const sizeColumn = {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: string | number) => {
        // Show size value only if it exists and is not empty
        // Show size for all products 
        return size && size.toString().trim() !== '' ? size : '';
      },
    };
    
      // Add conditional columns
      columns.push(ratePerInchColumn);
      columns.push(sizeColumn);
    };
    
    // Continue with the rest of the columns
    if (!hasSpecialProducts) {
      columns.push(
        {
          title: 'Rate/Pc',
          dataIndex: 'rate',
          key: 'rate',
        render: (rate: number, record: InvoiceItem) => {
          // For base products, calculate rate as pricePerInch * size
          // Show size for all products 

          if (record.productCategory?.toUpperCase().includes('BASE')) {
            return ''; // Return empty string for Base products
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
          const upperCategory = record.productCategory?.toUpperCase();
          // For base products, calculate total as (pricePerInch * size) * quantity
          // Show size for all products 
          if (upperCategory === 'LADDU GOPAL BASE' ||
              upperCategory === 'RK BASE' ||
              upperCategory === 'MATA RANI BASE' ||
              upperCategory === 'GANESH LAKSHMI BASE' ||
              upperCategory === 'SHYAM BABA BASE') {
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
    }
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

    // Check if there are any base products in the current invoice
    const hasSpecialProducts = currentInvoice?.items.some(item => {
      const upperCategory = item.productCategory?.toUpperCase();
      return upperCategory === 'LADDU GOPAL BASE' || 
             upperCategory === 'RK BASE' || 
             upperCategory === 'MATA RANI BASE';
    });

    // Always add Size column for all products
      // Add Size column with conditional content
      const sizeColumn = {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
        render: (size: string | number) => {
          // Show size value only if it exists and is not empty
          // Show size for all products 
   
  
  
  
            return size && size.toString().trim() !== '' ? size : '';
        },
      };

      // Add the size column
      columns.push(sizeColumn);

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
      const transformedProducts = productsResponse.map((item: any) => {
        const category = item.category || 'General';
        const inferredProductType = category.toUpperCase().includes('BASE') ? 'Manufactured' : 'Traded';
        return {
            id: item.id,
            sku: item.sku,
            name: item.name,
            size: item.size || 0,
            unit: item.unit || 'pcs',
            quantity: item.quantity || 0,
            price: item.price || 0,
            productType: item.productType || inferredProductType,
            category: category,
            costPricePerInch: item.costPricePerInch,
            ratePerInch: item.ratePerInch
        };
      });
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

  const handlePrintSelectedAddresses = () => {
    selectedRowKeys.forEach(key => {
      const invoiceToPrint = invoices.find(invoice => invoice.id === key);
      if (invoiceToPrint) {
        handlePrintAddress(invoiceToPrint);
      }
    });
  };

  const handlePrintSelected = () => {
    setPrintSelectedVisible(true);
  };

  const handleViewSelectedActionLogs = async () => {
    if (selectedRowKeys.length > 0) {
        try {
            const promises = selectedRowKeys.map(key => api.get(`/action-logs/invoice/${key}`));
            const responses = await Promise.all(promises);
            const logs = responses.flatMap(response => response);
            setSelectedActionLogs(logs);
            setViewSelectedLogsVisible(true);
        } catch (error) {
            console.error('Error fetching action logs:', error);
            message.error('Failed to fetch action logs for selected invoices.');
        }
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
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
          if (item.productCategory?.toUpperCase() === 'LADDU GOPAL BASE') {
            return sum + item.total;
          } else {
            return sum + ((item.rate || 0) * (item.quantity || 0));
          }
        }, 0);

        const discountAmount = record.discountType === 'percentage' 
          ? (subtotal * (record.discountRate || 0)) / 100
          : (record.discountRate || 0);
        const subtotalAfterDiscount = subtotal - discountAmount;
        const calculatedTotal = subtotalAfterDiscount + (record.shippingCharges || 0) + (record.packingCharges || 0);
        return `₹${calculatedTotal.toFixed(2)}`;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: string, record: Invoice) => (
        <Space>
          <Button
            type="default"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => handleDuplicateInvoice(record)}
          >
            Duplicate
          </Button>
          {!record.isFinalized && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditInvoice(record)}
            >
              Edit
            </Button>
          )}
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
          {!record.isFinalized && (
            <Button
              type="default"
              icon={<LockOutlined />}
              size="small"
              onClick={() => handleFinalizeInvoice(record)}
            >
              Finalize
            </Button>
          )}
          <Button
            type="default"
            icon={<HistoryOutlined />}
            size="small"
            onClick={() => handleViewActionLog(record)}
          >
            Log
          </Button>
        </Space>
      ),
    },
    {
      title: 'Print',
      key: 'print',
      render: (text: string, record: Invoice) => (
        <Space>
          <Button
            type="default"
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => {
              setCurrentInvoice(record);
              setPreviewClearedAfterDeletion(false);
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
          <Button
            type="default"
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => {
              handlePrintAddress(record);
            }}
          >
            Print Address
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="invoice-screen">
      <Card>
        <div className="invoice-header">
          <h2 style={{ color: "black", fontWeight: "bold" }}>Invoice Management</h2>
          <Space>
            <DatePicker.RangePicker
              onChange={(dates, dateStrings) => setDateRange(dateStrings as [string | null, string | null])}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvoice}>
              Add Invoice
            </Button>
            <Button icon={<HistoryOutlined />} onClick={() => handleViewActionLog()}>
              View Action Log
            </Button>
            <Button
              type="primary"
              disabled={!selectedRowKeys.length}
              onClick={handleViewSelectedActionLogs}
            >
              View Selected Logs
            </Button>
            <Button
              type="primary"
              disabled={!selectedRowKeys.length}
              onClick={handlePrintSelected}
            >
              Print Selected
            </Button>
            <Button
              type="primary"
              disabled={!selectedRowKeys.length}
              onClick={handlePrintSelectedAddresses}
            >
              Print Selected Addresses
            </Button>
          </Space>
        </div>
        <Table dataSource={filteredInvoices} columns={invoiceColumns} rowKey="id" rowSelection={rowSelection} />
      </Card>

      {currentInvoice ? (
        <Card style={{ marginTop: '24px' }} title="Last Invoice Preview">
          <InvoicePreview invoice={currentInvoice} />
        </Card>
      ) : previewClearedAfterDeletion ? (
        <Card style={{ marginTop: '24px' }} title="Last Invoice Preview">
          <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
            <p>add, edit, or print an invoice to preview it</p>
          </div>
        </Card>
      ) : null}

      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
        open={visible}
        onOk={handleSaveInvoice}
        onCancel={() => setVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => {
            setVisible(false);
            setSelectedCustomer(null); // Reset selected customer when closing modal
          }}>
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
                      (customer.id && customer.id.toString().toLowerCase().includes(searchText)) ||
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
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="customerEmail"
                label="Customer Email/Phone"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="billingAddress"
                label="Billing Address"
              >
                <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right', marginBottom: '20px' }}>
              <Button 
                type="primary" 
                onClick={() => {
                  if (selectedCustomer) {
                    // Get the updated values from the form
                    const updatedValues = form.getFieldsValue(['customerName', 'customerEmail', 'billingAddress']);
                    
                    // Parse the billing address to extract individual components
                    // This is a simplified approach - in a real app, you might want a more robust parser
                    const addressParts = updatedValues.billingAddress.split(', ');
                    const houseNumber = addressParts[0] || '';
                    const city = addressParts[1] || '';
                    const district = addressParts[2] || '';
                    const stateAndPin = addressParts[3] || '';
                    
                    // Extract state and pin code
                    const stateParts = stateAndPin.split(' - ');
                    const state = stateParts[0] || '';
                    const pinCode = stateParts[1] || '';
                    
                    // Extract landmark if present
                    const landmarkMatch = updatedValues.billingAddress.match(/\(Landmark: (.+)\)/);
                    const landmark = landmarkMatch ? landmarkMatch[1] : '';
                    
                    // Create the updated customer object
                    const updatedCustomer = {
                      ...selectedCustomer,
                      customerName: updatedValues.customerName,
                      mobileNumber1: updatedValues.customerEmail,
                      houseNumber,
                      city,
                      district,
                      state,
                      pinCode,
                      landmark
                    };
                    
                    // Update customers list
                    const updatedCustomers = customers.map(customer => 
                      customer.id === selectedCustomer.id ? updatedCustomer : customer
                    );
                    setCustomers(updatedCustomers);
                    
                    // Save to localStorage
                    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
                    
                    // Update the selected customer
                    setSelectedCustomer(updatedCustomer);
                    
                    // Update the current invoice if it exists
                    if (currentInvoice) {
                      setCurrentInvoice({
                        ...currentInvoice,
                        customerName: updatedCustomer.customerName,
                        customerEmail: updatedCustomer.mobileNumber1,
                        billingAddress: updatedValues.billingAddress,
                      });
                    }
                    
                    message.success('Customer information updated successfully');
                  }
                }}
                disabled={!selectedCustomer}
              >
                Update Customer Information
              </Button>
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
            <h3 style={{ color: "black", fontWeight: "bold" }}>Invoice Items</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
              Add Item
            </Button>
          </div>

          {/* Table hidden - only showing Added Items Summary Table */}
          {/* <Table dataSource={currentInvoice?.items || []} columns={itemColumns} rowKey="id" pagination={false} /> */}
          
          {/* Added Items Summary Table */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ color: "black", fontWeight: "bold" }}>Items Summary</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Product Name</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Product Type</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Rate Per Inch</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Size</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Rate per Piece</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Quantity</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Unit</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Total</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoice?.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.productCategory || ''}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {item.productCategory?.toUpperCase().includes('BASE') ? `₹${(item.ratePerInch || 1).toFixed(2)}` : ''}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {item.size || ''}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>₹{(item.rate || item.price || 0).toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.unit || 'pcs'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>₹{(item.total || 0).toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            <Button 
                                              size="small" 
                                              type="primary" 
                                              style={{ marginRight: '5px' }}
                                              onClick={() => {
                                                itemForm.setFieldsValue({
                                                  editingItemId: item.id,
                                                  productIdDisplay: item.name,
                                                  productId: item.productId,
                                                  productCategory: item.productCategory,
                                                  rate: item.rate || item.price,
                                                  ratePerInch: item.ratePerInch,
                                                  size: item.size,
                                                  quantity: item.quantity,
                                                  unit: item.unit
                                                });
                                                setSelectedProductCategory(item.productCategory);
                                                setItemVisible(true);
                                              }}
                                            >
                                              Edit
                                            </Button>
                                            {showDuplicateButton && (
                                              <Button 
                                                size="small" 
                                                type="default"
                                                icon={<CopyOutlined />}
                                                style={{ marginRight: '5px' }}
                                                onClick={() => {
                                                  if (currentInvoice) {
                                                    const newItem = {
                                                      ...item,
                                                      id: Date.now().toString(), // Generate new ID
                                                      name: `${item.name} (Copy)`
                                                    };
                                                    const updatedInvoice = {
                                                      ...currentInvoice,
                                                      items: [...currentInvoice.items, newItem]
                                                    };
                                                    setCurrentInvoice(updatedInvoice);
                                                    form.setFieldsValue(updatedInvoice);
                                                    message.success('Item duplicated successfully');
                                                  }
                                                }}
                                              >
                                                Duplicate
                                              </Button>
                                            )}
                                            <Button 
                                              size="small" 
                                              danger
                                              onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this item?')) {
                                                  handleDeleteItem(item.id);
                                                }
                                              }}
                                            >
                                              Delete
                                            </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
                Add Item
              </Button>
            </div>
          </div>

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
                        if (item.productCategory?.toUpperCase() === 'LADDU GOPAL BASE') {
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
              <Form.Item label="Notes">
                <Row gutter={8}>
                  <Col span={24}>
                    <Form.Item name="notesLine1" noStyle>
                      <Input placeholder="Line 1" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="notesLine2" noStyle>
                      <Input placeholder="Line 2" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="notesLine3" noStyle>
                      <Input placeholder="Line 3" />
                    </Form.Item>
                  </Col>
                </Row>
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
                    if (item.productCategory?.toUpperCase() === 'LADDU GOPAL BASE') {
                      return sum + item.total;
                    } else {
                      return sum + ((item.rate || 0) * (item.quantity || 0));
                    }
                  }, 0) || 0).toFixed(2)}
                </div>
              </Col>
            </Row>

            {(currentInvoice?.discountAmount || 0) > 0 && (
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
            )}
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
                    const total = subtotalAfterDiscount + (currentInvoice?.shippingCharges || 0) + (currentInvoice?.packingCharges || 0);
                    return total.toFixed(2);
                  })()}
                </div>
              </Col>
            </Row>
            {(currentInvoice?.advancePayment || 0) > 0 && (
              <>
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
                <Row style={{ marginTop: 16, borderTop: '1px solid #d9d9d9', paddingTop: 16 }}>
                  <Col span={18}>
                    <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Amount Due:</div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#f5222d' }}>
                      ₹{(() => {
                        const subtotal = currentInvoice?.items.reduce((sum, item) => {
                          if (item.productCategory?.toUpperCase() === 'LADDU GOPAL BASE') {
                            return sum + item.total;
                          } else {
                            return sum + ((item.rate || 0) * (item.quantity || 0));
                          }
                        }, 0) || 0;
                        const discountAmount = currentInvoice?.discountAmount || 0;
                        const subtotalAfterDiscount = subtotal - discountAmount;
                        const total = subtotalAfterDiscount + (currentInvoice?.shippingCharges || 0) + (currentInvoice?.packingCharges || 0);
                        const amountDue = total - (currentInvoice?.advancePayment || 0);
                        return amountDue.toFixed(2);
                      })()}
                    </div>
                  </Col>
                </Row>
              </>
            )}
          </div>
        </Form>
      </Modal>

      <Modal
        title={itemForm.getFieldValue('editingItemId') ? "Edit Invoice Item" : "Add Invoice Item"}
        open={itemVisible}
        onOk={itemForm.getFieldValue('editingItemId') ? handleUpdateItem : handleSaveItem}
        onCancel={() => setItemVisible(false)}
      >
        <Form 
          form={itemForm} 
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            // Debug: Log all changes
            console.log('Form values changed:', changedValues);
            console.log('All form values:', allValues);
            console.log('Selected product category:', selectedProductCategory);
            console.log('Invoice type:', currentInvoice?.invoiceType);
            
            const upperCategory = selectedProductCategory.toUpperCase();
            // If it's a manufactured invoice with any Base product and ratePerInch or size changes, calculate the rate
            if (currentInvoice?.invoiceType === 'manufactured' && 
                upperCategory && upperCategory.includes('BASE') && 
                (changedValues.ratePerInch || changedValues.size)) {
              const ratePerInch = allValues.ratePerInch || 1; // Default to 1 instead of 0
              const size = allValues.size || 1; // Default to 1 instead of 0
              const rate = ratePerInch * size;
              
              console.log('Calculating rate:', { ratePerInch, size, rate });
              
              // Always update the rate field
              itemForm.setFieldsValue({ rate });
              console.log('Updated rate field to:', rate);
            }
            
            // For traded products or laddu gopal mukut, ensure rate doesn't change when quantity changes
            if ((currentInvoice?.invoiceType !== 'manufactured' || upperCategory === 'LADDU GOPAL MUKUT') && changedValues.quantity) {
              // Always preserve the current rate value, don't let it change
              if (allValues.rate !== undefined) {
                // Keep the current rate, don't recalculate
                itemForm.setFieldsValue({ rate: allValues.rate });
              }
            }
          }}
        >
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
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select or enter a product!' }]}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Select 
                value={itemForm.getFieldValue('productId')}
                placeholder="Select or enter a product"
                showSearch
                optionLabelProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => {
                  // Check if the value matches an existing product ID
                  const selectedProduct = products.find(p => p.id === value);
                  
                  if (selectedProduct) {
                    // Update the display field with the product name
                    itemForm.setFieldsValue({
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
                  <Select.Option key={product.id} value={product.id} label={product.name}>
                    <div>
                      <strong>{product.name}</strong>
                    </div>
                    <div>
                      <small>Product Type: {product.productType || 'N/A'} | Size: {product.size || 'N/A'}</small>
                    </div>
                  </Select.Option>
                ))}
              </Select>


            {/* Add New Product button hidden */}
            </div>
          </Form.Item>
          
          <Form.Item
            name="productCategory"
            hidden={true}
          >
            <Input type="hidden" />
          </Form.Item>


          {showRateField && (
          <Form.Item
            name="rate"
            label="Rate Per Piece"
          >
            <InputNumber 
              min={0} 
              step={0.01} 
              style={{ width: '100%' }} 
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
              placeholder="Enter rate per piece"
              disabled={disableRateField || (selectedProductCategory.toUpperCase() === 'LADDU GOPAL BASE' || selectedProductCategory.toUpperCase() === 'RK BASE' || selectedProductCategory.toUpperCase() === 'SHYAM BABA BASE' || selectedProductCategory.toUpperCase() === 'MATA RANI BASE' || selectedProductCategory.toUpperCase() === 'GANESH LAKSHMI BASE')}
            />
          </Form.Item>
          )}
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.productId !== currentValues.productId}
          >
            {({ getFieldValue }) => {
              const productId = getFieldValue('productId');
              const product = products.find(p => p.id === productId);
              
              if (!product) {
                return null;
              }

              const productTypeUpper = product.productType?.toUpperCase();

              if (productTypeUpper === 'TRADED') {
                return null;
              }

              const isEditing = !!itemForm.getFieldValue('editingItemId');
              const isManufactured = productTypeUpper === 'MANUFACTURED';
              const category = (product.category || '').toUpperCase();
              const isManufacturedBase = isManufactured && category.includes('BASE');

              const shouldShow = (isEditing && isManufactured) || isManufacturedBase;
              
              console.log('RATE PER INCH FIELD DEBUG:', {
                product: {id: product.id, name: product.name, productType: product.productType, category: product.category},
                isManufactured,
                category,
                isManufacturedBase,
                shouldShow
              });

              if (shouldShow) {
                return (
                  <Form.Item
                    name="ratePerInch"
                    label="Rate Per Inch"
                  >
                    <InputNumber 
                      min={0} 
                      step={0.01} 
                      style={{ width: '100%' }} 
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value!.replace(/₹\s?|(,*)/g, '') as unknown as number}
                      placeholder="Enter rate per inch"
                      disabled={!(currentInvoice?.invoiceType === 'manufactured' && (selectedProductCategory.toUpperCase() === 'LADDU GOPAL BASE' || selectedProductCategory.toUpperCase() === 'RK BASE' || selectedProductCategory.toUpperCase() === 'SHYAM BABA BASE' || selectedProductCategory.toUpperCase() === 'MATA RANI BASE' || selectedProductCategory.toUpperCase() === 'GANESH LAKSHMI BASE'))}
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="size"
            label="Size"
            rules={[{ required: true, message: 'Please input size!' }]}
          >
            <Input placeholder="Enter size (e.g., S, M, L, or numeric value)" style={{ width: '100%' }} defaultValue="S" />
          </Form.Item>
          
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
      <div className="hidden-for-printing">
        <InvoicePreview ref={invoiceRef} invoice={currentInvoice} />
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
                  <Select.Option value="Andhra Pradesh">Andhra Pradesh</Select.Option>
                  <Select.Option value="Arunachal Pradesh">Arunachal Pradesh</Select.Option>
                  <Select.Option value="Assam">Assam</Select.Option>
                  <Select.Option value="Bihar">Bihar</Select.Option>
                  <Select.Option value="Chhattisgarh">Chhattisgarh</Select.Option>
                  <Select.Option value="Goa">Goa</Select.Option>
                  <Select.Option value="Gujarat">Gujarat</Select.Option>
                  <Select.Option value="Haryana">Haryana</Select.Option>
                  <Select.Option value="Himachal Pradesh">Himachal Pradesh</Select.Option>
                  <Select.Option value="Jharkhand">Jharkhand</Select.Option>
                  <Select.Option value="Karnataka">Karnataka</Select.Option>
                  <Select.Option value="Kerala">Kerala</Select.Option>
                  <Select.Option value="Madhya Pradesh">Madhya Pradesh</Select.Option>
                  <Select.Option value="Maharashtra">Maharashtra</Select.Option>
                  <Select.Option value="Manipur">Manipur</Select.Option>
                  <Select.Option value="Meghalaya">Meghalaya</Select.Option>
                  <Select.Option value="Mizoram">Mizoram</Select.Option>
                  <Select.Option value="Nagaland">Nagaland</Select.Option>
                  <Select.Option value="Odisha">Odisha</Select.Option>
                  <Select.Option value="Punjab">Punjab</Select.Option>
                  <Select.Option value="Rajasthan">Rajasthan</Select.Option>
                  <Select.Option value="Sikkim">Sikkim</Select.Option>
                  <Select.Option value="Tamil Nadu">Tamil Nadu</Select.Option>
                  <Select.Option value="Telangana">Telangana</Select.Option>
                  <Select.Option value="Tripura">Tripura</Select.Option>
                  <Select.Option value="Uttar Pradesh">Uttar Pradesh</Select.Option>
                  <Select.Option value="Uttarakhand">Uttarakhand</Select.Option>
                  <Select.Option value="West Bengal">West Bengal</Select.Option>
                  <Select.Option value="Delhi">Delhi</Select.Option>
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
                <Input 
                  placeholder="Enter PIN code" 
                  onBlur={handlePincodeBlur}
                />
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
      
      <InvoiceActionLog
        visible={actionLogVisible}
        onClose={() => setActionLogVisible(false)}
        invoiceId={selectedInvoiceId}
        invoiceNumber={selectedInvoiceNumber}
      />

      <Modal
        title="Selected Action Logs"
        open={viewSelectedLogsVisible}
        onCancel={() => setViewSelectedLogsVisible(false)}
        footer={null}
        width={1000}
      >
        <Table
          dataSource={selectedActionLogs}
          rowKey="id"
          columns={[
            {
              title: 'Invoice Number',
              dataIndex: 'invoiceNumber',
              key: 'invoiceNumber',
            },
            {
              title: 'Date of Action',
              dataIndex: 'actionDate',
              key: 'dateOfAction',
              render: (date) => moment(date).format('YYYY-MM-DD'),
            },
            {
              title: 'Time of Action',
              dataIndex: 'actionDate',
              key: 'timeOfAction',
              render: (date) => moment(date).format('HH:mm:ss'),
            },
            {
              title: 'Status',
              dataIndex: 'action',
              key: 'action',
              render: (action) => {
                const actionMap = {
                  created: 'created',
                  editted: 'editted',
                  deleted: 'deleted',
                  finalize: 'finalize',
                };
                return actionMap[action] || action;
              }
            },
            {
              title: 'User',
              dataIndex: 'username',
              key: 'username',
            },
            {
              title: 'Details',
              dataIndex: 'details',
              key: 'details',
            },
          ]}
        />
      </Modal>

      <Modal
        title="Print Selected Invoices"
        open={printSelectedVisible}
        onCancel={() => setPrintSelectedVisible(false)}
        width="80%"
        footer={[
            <Button key="back" onClick={() => setPrintSelectedVisible(false)}>
                Cancel
            </Button>,
            <Button key="print" type="primary" onClick={handlePrintSelectedInvoices}>
                Print
            </Button>,
        ]}
      >
        <style>{`
          @media print {
            .page-break {
              page-break-after: always;
            }
          }
        `}</style>
        <div ref={printSelectedRef}>
            {selectedRowKeys.map(key => {
                const invoice = invoices.find(inv => inv.id === key);
                if (!invoice) return null;
                return (
                    <div key={invoice.id} className="page-break">
                        <InvoicePreview invoice={invoice} />
                    </div>
                );
            })}
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceScreen;
