
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Package, Plus, Trash2, Download, Search } from 'lucide-react';
import axios from 'axios';

interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  unit: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  shippingAddress: string;
  sameAsBilling: boolean;
  items: InvoiceItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  shippingCharges: number;
  packingCharges: number;
  total: number;
  notes: string;
}

const InvoiceScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerEmail: '',
    billingAddress: '',
    shippingAddress: '',
    sameAsBilling: true,
    items: [
      { id: '1', name: '', description: '', quantity: 1, price: 0, total: 0, unit: 'units' }
    ],
    subtotal: 0,
    discountRate: 0,
    discountAmount: 0,
    shippingCharges: 0,
    packingCharges: 0,
    total: 0,
    notes: ''
  });

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInventoryItems();
    fetchCustomers();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventoryItems(response.data);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Import the mock API dynamically to avoid circular dependencies
      const { mockCustomerApi, CustomerData } = await import('./services/mockApi');
      const customers = await mockCustomerApi.getCustomers();
      setCustomers(customers);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleCustomerSelect = (customer: any) => {
    // Format the address
    const billingAddress = `${customer.houseNumber || ''}, ${customer.city || ''}, ${customer.district || ''}, ${customer.state || ''}, ${customer.pinCode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/[,\s]{2,}/g, ', ');

    setInvoice(prev => ({
      ...prev,
      customerName: customer.customerName,
      customerEmail: customer.mobileNumber1,
      billingAddress: billingAddress,
      shippingAddress: billingAddress,
      sameAsBilling: true
    }));

    setShowCustomerModal(false);
  };

  const updateInvoiceField = (field: keyof InvoiceData, value: string | number) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const updateInvoiceItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => {
      const items = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate total if quantity or price changed
          if (field === 'quantity' || field === 'price') {
            updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.price);
          }

          return updatedItem;
        }
        return item;
      });

      // Recalculate subtotal, discount, and total
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = subtotal * (prev.discountRate / 100);
      const discountedSubtotal = subtotal - discountAmount;
      const total = discountedSubtotal + prev.shippingCharges + prev.packingCharges;

      return { ...prev, items, subtotal, discountAmount, total };
    });
  };

  const addNewItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
      unit: 'units'
    };

    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) return;

    setInvoice(prev => {
      const items = prev.items.filter(item => item.id !== id);

      // Recalculate subtotal, discount, and total
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = subtotal * (prev.discountRate / 100);
      const discountedSubtotal = subtotal - discountAmount;
      const total = discountedSubtotal + prev.shippingCharges + prev.packingCharges;

      return { ...prev, items, subtotal, discountAmount, total };
    });
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = inventoryItems.find(item => item.id === productId);
    if (product) {
      updateInvoiceItem(itemId, 'name', product.name);
      updateInvoiceItem(itemId, 'price', product.price);
    }
  };

  const handlePrintPDF = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current.innerHTML;
      const printWindow = window.open('', '_blank');

      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .invoice-container { max-width: 800px; margin: 0 auto; }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-title { font-size: 24px; font-weight: bold; }
                .invoice-details { margin-bottom: 30px; }
                .invoice-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .invoice-customer, .invoice-info { margin-bottom: 20px; }
                .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .invoice-table th { background-color: #f2f2f2; }
                .invoice-totals { margin-left: auto; width: 300px; }
                .invoice-totals-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .invoice-totals-row.total { font-weight: bold; font-size: 18px; border-top: 1px solid #ddd; padding-top: 10px; }
                .invoice-notes { margin-top: 30px; }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Invoice Management</h1>
        <div className="flex gap-2">
          <Button
            onClick={handlePrintPDF}
            className="button button-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Print PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Invoice Number</label>
              <input
                type="text"
                value={invoice.invoiceNumber}
                onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input
                type="date"
                value={invoice.date}
                onChange={(e) => updateInvoiceField('date', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="form-label">Discount Rate (%)</label>
              <input
                type="number"
                value={invoice.discountRate}
                onChange={(e) => updateInvoiceField('discountRate', Number(e.target.value))}
                className="input"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="form-label">Shipping Charges (₹)</label>
              <input
                type="number"
                value={invoice.shippingCharges}
                onChange={(e) => updateInvoiceField('shippingCharges', Number(e.target.value))}
                className="input"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="form-label">Packing Charges (₹)</label>
              <input
                type="number"
                value={invoice.packingCharges}
                onChange={(e) => updateInvoiceField('packingCharges', Number(e.target.value))}
                className="input"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Customer Information</h2>
            <Button
              onClick={() => setShowCustomerModal(true)}
              className="button button-secondary flex items-center gap-2"
            >
              Select Customer
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                value={invoice.customerName}
                onChange={(e) => updateInvoiceField('customerName', e.target.value)}
                className="input"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={invoice.customerEmail}
                onChange={(e) => updateInvoiceField('customerEmail', e.target.value)}
                className="input"
                placeholder="Enter customer phone number"
              />
            </div>
            <div>
              <label className="form-label">Billing Address</label>
              <textarea
                value={invoice.billingAddress}
                onChange={(e) => updateInvoiceField('billingAddress', e.target.value)}
                className="input"
                rows={3}
                placeholder="Enter billing address"
              />
            </div>
            <div>
              <label className="form-label">Shipping Address</label>
              <textarea
                value={invoice.sameAsBilling ? invoice.billingAddress : invoice.shippingAddress}
                onChange={(e) => updateInvoiceField('shippingAddress', e.target.value)}
                className="input"
                rows={3}
                placeholder="Enter shipping address"
                disabled={invoice.sameAsBilling}
              />
              <div className="mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={invoice.sameAsBilling}
                    onChange={(e) => updateInvoiceField('sameAsBilling', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span>Same as billing address</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Invoice Items</h2>
          <Button
            onClick={addNewItem}
            className="button button-secondary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <select
                      onChange={(e) => handleProductSelect(item.id, e.target.value)}
                      className="input w-full mb-2"
                      defaultValue=""
                    >
                      <option value="" disabled>Select a product</option>
                      {inventoryItems.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (${product.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateInvoiceItem(item.id, 'name', e.target.value)}
                      className="input w-full"
                      placeholder="Or enter custom item"
                    />
                  </td>
                  <td>
                    <select
                      value={item.unit}
                      onChange={(e) => updateInvoiceItem(item.id, 'unit', e.target.value)}
                      className="input w-full"
                    >
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="m">m</option>
                      <option value="cm">cm</option>
                      <option value="units">units</option>
                      <option value="pieces">pieces</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(item.id, 'quantity', Number(e.target.value))}
                      className="input"
                      min="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateInvoiceItem(item.id, 'price', Number(e.target.value))}
                      className="input"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td>₹{item.total.toFixed(2)}</td>
                  <td>
                    <Button
                      onClick={() => removeItem(item.id)}
                      className="button button-destructive p-2"
                      disabled={invoice.items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
          <textarea
            value={invoice.notes}
            onChange={(e) => updateInvoiceField('notes', e.target.value)}
            className="input"
            rows={4}
            placeholder="Enter any additional notes or payment instructions"
          />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Invoice Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount ({invoice.discountRate}%):</span>
              <span>-₹{invoice.discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Charges:</span>
              <span>₹{invoice.shippingCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Packing Charges:</span>
              <span>₹{invoice.packingCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>₹{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Select Customer</h2>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      customers
                        .filter(customer => {
                          if (!customerSearchTerm) return true;
                          const term = customerSearchTerm.toLowerCase();
                          return (
                            customer.customerName.toLowerCase().includes(term) ||
                            customer.mobileNumber1.includes(term) ||
                            customer.city.toLowerCase().includes(term) ||
                            customer.state.toLowerCase().includes(term)
                          );
                        })
                        .map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{customer.mobileNumber1}</div>
                              {customer.mobileNumber2 && (
                                <div className="text-sm text-gray-500">{customer.mobileNumber2}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {customer.houseNumber && <div>{customer.houseNumber}</div>}
                                {customer.city && <div>{customer.city}</div>}
                                {customer.district && <div>{customer.district}</div>}
                                {customer.state && <div>{customer.state}</div>}
                                {customer.pinCode && <div>{customer.pinCode}</div>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleCustomerSelect(customer)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable invoice */}
      <div ref={invoiceRef} className="hidden">
        <div className="invoice-header">
          <div>
            <div className="invoice-title">INVOICE</div>
            <div>ErpSoul System</div>
          </div>
          <div>
            <div><strong>Invoice #:</strong> {invoice.invoiceNumber}</div>
            <div><strong>Date:</strong> {invoice.date}</div>
          </div>
        </div>

        <div className="invoice-details">
          <div className="invoice-details-grid">
            <div className="invoice-customer">
              <h3>Billing Address:</h3>
              <div><strong>{invoice.customerName}</strong></div>
              <div>Phone: {invoice.customerEmail}</div>
              <div>{invoice.billingAddress}</div>
            </div>
            <div className="invoice-customer">
              <h3>Shipping Address:</h3>
              <div><strong>{invoice.customerName}</strong></div>
              <div>Phone: {invoice.customerEmail}</div>
              <div>{invoice.shippingAddress}</div>
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
            {invoice.items.map((item) => (
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
            <span>₹{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="invoice-totals-row">
            <span>Discount ({invoice.discountRate}%):</span>
            <span>-₹{invoice.discountAmount.toFixed(2)}</span>
          </div>
          <div className="invoice-totals-row">
            <span>Shipping Charges:</span>
            <span>₹{invoice.shippingCharges.toFixed(2)}</span>
          </div>
          <div className="invoice-totals-row">
            <span>Packing Charges:</span>
            <span>₹{invoice.packingCharges.toFixed(2)}</span>
          </div>
          <div className="invoice-totals-row total">
            <span>Total:</span>
            <span>₹{invoice.total.toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="invoice-notes">
            <h3>Notes:</h3>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceScreen;
