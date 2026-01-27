import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Typography, Table, Input, Tag, Space, Button, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import InvoicePreview, { Invoice } from '../components/InvoicePreview';
import '../components/InvoicePreview.css';

const { Title } = Typography;
const { Search } = Input;

const InvoiceHistoryScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const navigate = useNavigate();

  const componentRef = useRef(null);

  const handlePrintHook = useReactToPrint({
    contentRef: componentRef,
    documentTitle: invoiceToPrint ? `Invoice_${invoiceToPrint.invoiceNumber}` : 'Invoice',
    onAfterPrint: () => setInvoiceToPrint(null),
    onPrintError: () => message.error('Failed to print invoice'),
  });

  useEffect(() => {
    const storedInvoices = localStorage.getItem('invoices');
    if (storedInvoices) {
      // Sort invoices by date descending
      const parsedInvoices = JSON.parse(storedInvoices);
      const sortedInvoices = parsedInvoices.sort((a: Invoice, b: Invoice) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInvoices(sortedInvoices);
    }
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) {
      return invoices;
    }
    return invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);
  
  const handleView = (record: Invoice) => {
    setSelectedInvoice(record);
    setIsPreviewVisible(true);
  };

  const handlePrint = (record: Invoice) => {
    setInvoiceToPrint(record);
    setTimeout(() => {
      if (componentRef.current) {
        handlePrintHook();
      } else {
        console.error("Ref is null, cannot print.");
        message.error("Error preparing document for printing.");
        setInvoiceToPrint(null); // Reset state
      }
    }, 300);
  };

  const columns = [
    { title: 'Invoice Number', dataIndex: 'invoiceNumber', key: 'invoiceNumber', sorter: (a: Invoice, b: Invoice) => a.invoiceNumber.localeCompare(b.invoiceNumber) },
    { title: 'Customer Name', dataIndex: 'customerName', key: 'customerName', sorter: (a: Invoice, b: Invoice) => a.customerName.localeCompare(b.customerName) },
    { title: 'Date', dataIndex: 'date', key: 'date', sorter: (a: Invoice, b: Invoice) => new Date(b.date).getTime() - new Date(a.date).getTime() },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (total: number) => `₹${(total || 0).toFixed(2)}`, sorter: (a: Invoice, b: Invoice) => a.total - b.total },
    { title: 'Status', dataIndex: 'isFinalized', key: 'isFinalized', render: (isFinalized: boolean) => <Tag color={isFinalized ? 'green' : 'orange'}>{isFinalized ? 'Finalized' : 'Draft'}</Tag>, filters: [{text: 'Finalized', value: true}, {text: 'Draft', value: false}], onFilter: (value, record) => record.isFinalized === value },
    {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Invoice) => (
            <Space size="middle">
                <Button onClick={() => handleView(record)}>View</Button>
                <Button onClick={() => handlePrint(record)}>Print</Button>
            </Space>
        ),
    }
  ];

  return (
    <div>
      <Title level={2}>Invoice History</Title>
      <Search
        placeholder="Search by Invoice Number or Customer Name"
        onSearch={setSearchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
        allowClear
      />
      <Table
        columns={columns}
        dataSource={filteredInvoices}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={`Invoice Preview: ${selectedInvoice?.invoiceNumber}`}
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <InvoicePreview invoice={selectedInvoice} />
      </Modal>
      <div className="hidden-for-printing">
        <InvoicePreview ref={componentRef} invoice={invoiceToPrint} />
      </div>
    </div>
  );
};

export default InvoiceHistoryScreen;
