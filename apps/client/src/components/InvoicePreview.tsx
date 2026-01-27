import React, { useEffect, useState } from 'react';

// Assuming these styles are available globally or imported from a shared CSS file
// For now, let's assume the necessary classes exist.

interface InvoiceSettings {
  sellerName: string;
  sellerPhone: string;
  sellerAddress: {
    line1: string;
    line2: string;
    line3: string;
  };
  companyLogo: string;
}

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  ratePerInch?: number;
  size?: number;
  rate?: number;
  unit?: string;
  productCategory?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  items: InvoiceItem[];
  notesLine1?: string;
  notesLine2?: string;
  notesLine3?: string;
  discountAmount?: number;
  shippingCharges?: number;
  packingCharges?: number;
  advancePayment?: number;
  invoiceType?: 'manufactured' | 'traded';
  isFinalized?: boolean;
}

interface InvoicePreviewProps {
  invoice: Invoice | null;
}

const InvoicePreview = React.forwardRef<HTMLDivElement, InvoicePreviewProps>(({ invoice }, ref) => {
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(() => {
    const savedSettings = localStorage.getItem('invoiceSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    // Default values if nothing in localStorage
    return {
      sellerName: 'Pooja Kreations',
      sellerPhone: '9749928722',
      sellerAddress: {
        line1: 'Cinema Hall Road, Durgapur',
        line2: 'West Bengal, PIN - 713201',
        line3: '(near Shiv Mandir)'
      },
      companyLogo: '/pk-logo.png'
    };
  });

  useEffect(() => {
    // This effect is now primarily for reacting to changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'invoiceSettings') {
        const newSettings = e.newValue;
        if (newSettings) {
          setInvoiceSettings(JSON.parse(newSettings));
        } else {
          // If the key was cleared from localStorage
          setInvoiceSettings({
            sellerName: 'Pooja Kreations',
            sellerPhone: '9749928722',
            sellerAddress: {
              line1: 'Cinema Hall Road, Durgapur',
              line2: 'West Bengal, PIN - 713201',
              line3: '(near Shiv Mandir)'
            },
            companyLogo: '/pk-logo.png'
          });
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!invoice) {
    return null;
  }

  // Calculate totals
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const discount = invoice.discountAmount || 0;
  const shipping = invoice.shippingCharges || 0;
  const packing = invoice.packingCharges || 0;
  const advance = invoice.advancePayment || 0;
  const total = subtotal - discount + shipping + packing;
  const amountDue = total - advance;

  return (
    <div className="invoice-container" ref={ref}>
        <div className="invoice-header">
            <div>
              <img src={invoiceSettings.companyLogo} alt="Company Logo" style={{ marginTop: "10px", maxWidth: "400px" }} />
            </div>
            <div>
              <div><strong>Invoice #:</strong> {invoice.invoiceNumber}</div>
              <div><strong>Date:</strong> {invoice.date}</div>
              {invoice.invoiceType && <div style={{display: 'none'}}><strong>Type:</strong> 
                <span style={{ 
                  textTransform: 'capitalize',
                  color: invoice.invoiceType === 'manufactured' ? '#1890ff' : '#52c41a' 
                }}>
                  {invoice.invoiceType}
                </span>
              </div>}
            </div>
        </div>

        <div className="invoice-details">
            <div className="invoice-details-grid">
              <div className="invoice-customer">
                <h3>Customer Name:</h3>
                <div><strong>{invoice.customerName}</strong></div>
                <div>Phone: {invoice.customerEmail}</div>
                <h3>Customer Address:</h3>
                <div>{invoice.billingAddress}</div>
              </div>

            </div>
        </div>

        <table className="invoice-table">
            <thead>
                <tr>
                    <th>Product Name</th>
                    <th>Size</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {invoice.items.map((item) => (
                    <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.size || ''}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit || 'pcs'}</td>
                        <td>₹{(item.rate || item.price || 0).toFixed(2)}</td>
                        <td>₹{(item.total || 0).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="invoice-summary">
            <div className="invoice-notes-section">
              {(invoice.notesLine1 || invoice.notesLine2 || invoice.notesLine3) && (
                <div className="invoice-notes">
                  <div className="invoice-notes-row">
                    <p>Notes:</p>
                  </div>
                  <div className="invoice-notes-row" style={{ marginBottom: '0px', lineHeight: '0.8', padding: '0' }}>
                    <p style={{ marginBottom: '0px', lineHeight: '0.8', padding: '0' }}>{invoice.notesLine1 || ''}</p>
                  </div>
                  <div className="invoice-notes-row" style={{ marginBottom: '0px', lineHeight: '0.8', padding: '0' }}>
                    <p style={{ marginBottom: '0px', lineHeight: '0.8', padding: '0' }}>{invoice.notesLine2 || ''}</p>
                  </div>
                  <div className="invoice-notes-row" style={{ marginBottom: '0px', lineHeight: '0.8', padding: '0' }}>
                    <p style={{ marginBottom: '0px', lineHeight: '0.8', padding: '0' }}>{invoice.notesLine3 || ''}</p>
                  </div>
                </div>
              )}
                <div className="invoice-terms">
                    <h3>Terms and Conditions:</h3>
                    <p>1. Open box video is mandatory for any claim or dispute. </p>
                    <p>2. Any claim or dispute arising from change in quality, shortage in quantity, or any cause whatsoever will not be entertained once the goods are delivered, if open box video, made at the time of delivery, is not provided.</p>
                    <p>3. Payment for this invoice is due within 24 hours of the billing date.</p>
                    <p>4. Late payment charges at 24% p.a. will be charged on amount of the bill after due date.</p>
                    <p>5. We are not responsible for any loss or damage during transit. </p>
                    <p>6. Subject to DURGAPUR jurisdiction only.</p>
                </div>
            </div>
            <div className="invoice-totals">
              <div className="invoice-totals-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="invoice-totals-row">
                <span>Discount: </span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="invoice-totals-row">
              <span>Shipping Charges:</span>
              <span>₹{shipping.toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row">
              <span>Packing Charges:</span>
              <span>₹{packing.toFixed(2)}</span>
            </div>
            <div className="invoice-totals-row total">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            {advance > 0 && (
              <>
                <div className="invoice-totals-row">
                  <span>Advance Payment:</span>
                  <span>-₹{advance.toFixed(2)}</span>
                </div>
                <div className="invoice-totals-row total" style={{ borderTop: '2px solid #000', paddingTop: '10px', marginTop: '10px' }}>
                  <span>Amount Due:</span>
                  <span>₹{amountDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="invoice-terms">
            <p style={{ fontSize: '16px', fontWeight: 'bold' }}> Powered By Devambaram Industries Private Limited. </p>
        </div>
    </div>
  );
});

export default InvoicePreview;
