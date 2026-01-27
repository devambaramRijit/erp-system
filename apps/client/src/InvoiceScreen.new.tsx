import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Typography, Button, Form, Input, Select, Table, InputNumber, Modal, message, Card, Row, Col, Divider, Space, Popconfirm, AutoComplete, Dropdown, Menu } from 'antd';
import moment from 'moment';
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined, LockOutlined, CopyOutlined, DownloadOutlined, HistoryOutlined, MoreOutlined, ExportOutlined, FilePdfOutlined, EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';
import InvoiceActionLog from './components/InvoiceActionLog';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title } = Typography;


// A simple event bus for cross-component communication
const eventBus = {
  on(event: string, callback: (event: any) => void) {
    document.addEventListener(event, callback);
  },
  dispatch(event: string, data?: any) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  off(event: string, callback: (event: any) => void) {
    document.removeEventListener(event, callback);
  },
};

// Interfaces (assuming these are defined elsewhere, but including them here for completeness)
interface Product {
    id: string;
    sku: string;
    name: string;
    size?: string;
    unit?: string;
    quantity: number;
    price: number;
    productType: string;
    category?: string;
    ratePerPiece?: number;
    ratePerInch?: number;
    costPricePerInch?: number;
    costPricePerPiece?: number;
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
    size?: string;
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
    discountType?: 'percentage' | 'decimal';
}

const InvoiceScreenNew: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [form] = Form.useForm();
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedInvoices = localStorage.getItem('invoices');
    if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    const storedProducts = localStorage.getItem('erp_inventory');
    if (storedProducts) setProducts(JSON.parse(storedProducts));
  }, []);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    if (invoice.isFinalized) {
      message.error('This invoice has been finalized and cannot be edited');
      return;
    }
    setEditingInvoice(invoice);
    form.setFieldsValue({
      ...invoice,
      date: moment(invoice.date),
    });
    setCurrentInvoice(invoice);
    setVisible(true);
  }, [form]);

  const handleDownloadPDF = useCallback((record: Invoice) => {
    setCurrentInvoice(record);
    setTimeout(async () => {
      if (!invoiceRef.current) {
        message.error('Error preparing invoice for download');
        return;
      }
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${record.invoiceNumber}.pdf`);
    }, 500);
  }, [invoiceRef]);

  useEffect(() => {
    const handleViewInvoiceEvent = (event: any) => {
      handleEditInvoice(event.detail.invoice);
    };

    const handlePrintInvoiceEvent = (event: any) => {
      handleDownloadPDF(event.detail.invoice);
    };

    eventBus.on('view-invoice', handleViewInvoiceEvent);
    eventBus.on('print-invoice', handlePrintInvoiceEvent);

    return () => {
      eventBus.off('view-invoice', handleViewInvoiceEvent);
      eventBus.off('print-invoice', handlePrintInvoiceEvent);
    };
  }, [handleEditInvoice, handleDownloadPDF]);
  
  // Placeholder for the rest of the component
  return (
    <div>
        <Title level={2}>Invoice Screen (New)</Title>
        <p>This is a new implementation of the invoice screen.</p>
        {/* A hidden div to hold the printable content */}
        <div style={{ display: 'none' }}>
            <div ref={invoiceRef}>
                {currentInvoice && (
                    <div>
                        <h1>Invoice #{currentInvoice.invoiceNumber}</h1>
                        <p>Customer: {currentInvoice.customerName}</p>
                        {/* More invoice details here */}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default InvoiceScreenNew;
