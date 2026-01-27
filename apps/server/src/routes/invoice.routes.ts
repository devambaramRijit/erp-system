import { Router } from 'express';
import { Invoice, InvoiceItem } from '@shared/schema/invoice';

const router = Router();

// Mock invoice storage
let invoices: Invoice[] = [];

// Get all invoices
router.get('/', (req, res) => {
  res.json(invoices);
});

// Get a specific invoice by ID
router.get('/:id', (req, res) => {
  const invoice = invoices.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  res.json(invoice);
});

// Add a new invoice
router.post('/', (req, res) => {
  console.log('=== INVOICE POST REQUEST ===');
  console.log('Received data:', JSON.stringify(req.body, null, 2));

  const newInvoice: Invoice = {
    ...req.body,
    id: req.body.id || Date.now().toString(),
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Ensure items are properly formatted
  if (typeof newInvoice.items === 'string') {
    try {
      newInvoice.items = JSON.parse(newInvoice.items);
    } catch (e) {
      console.error('Failed to parse items:', e);
      newInvoice.items = [];
    }
  }

  // Calculate total if not provided or if it's 0
  if (!newInvoice.total || newInvoice.total === 0) {
    const subtotal = newInvoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = (newInvoice.discountType === 'percentage' || !newInvoice.discountType)
      ? (subtotal * (newInvoice.discountRate || 0)) / 100
      : (newInvoice.discountRate || 0);
    const subtotalAfterDiscount = subtotal - discountAmount;
    newInvoice.total = subtotalAfterDiscount + (newInvoice.shippingCharges || 0) + (newInvoice.packingCharges || 0) - (newInvoice.advancePayment || 0);
    newInvoice.subtotal = subtotal;
    newInvoice.discountAmount = discountAmount;
  }

  invoices.push(newInvoice);

  console.log('Invoice saved:', JSON.stringify(newInvoice, null, 2));
  console.log('=== END INVOICE POST REQUEST ===\n');

  res.status(201).json(newInvoice);
});

// Update an invoice
router.put('/:id', (req, res) => {
  console.log('=== INVOICE PUT REQUEST ===');
  console.log('Invoice ID:', req.params.id);
  console.log('Received data:', JSON.stringify(req.body, null, 2));

  const index = invoices.findIndex(inv => inv.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  // Ensure items are properly formatted
  let updatedItems = req.body.items;
  if (typeof updatedItems === 'string') {
    try {
      updatedItems = JSON.parse(updatedItems);
    } catch (e) {
      console.error('Failed to parse items:', e);
      updatedItems = [];
    }
  }

  // Calculate total if not provided or if it's 0
  let calculatedTotal = req.body.total;
  if (!calculatedTotal || calculatedTotal === 0) {
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = (req.body.discountType === 'percentage' || !req.body.discountType)
      ? (subtotal * (req.body.discountRate || 0)) / 100
      : (req.body.discountRate || 0);
    const subtotalAfterDiscount = subtotal - discountAmount;
    calculatedTotal = subtotalAfterDiscount + (req.body.shippingCharges || 0) + (req.body.packingCharges || 0) - (req.body.advancePayment || 0);
  }

  const updatedInvoice: Invoice = {
    ...invoices[index],
    ...req.body,
    items: updatedItems,
    total: calculatedTotal,
    updatedAt: new Date().toISOString()
  };

  invoices[index] = updatedInvoice;

  console.log('Invoice updated:', JSON.stringify(updatedInvoice, null, 2));
  console.log('=== END INVOICE PUT REQUEST ===\n');

  res.json(updatedInvoice);
});

// Delete an invoice
router.delete('/:id', (req, res) => {
  const index = invoices.findIndex(inv => inv.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  invoices.splice(index, 1);
  res.status(204).send();
});

// Finalize an invoice
router.put('/:id/finalize', (req, res) => {
  const index = invoices.findIndex(inv => inv.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  const updatedInvoice: Invoice = {
    ...invoices[index],
    ...req.body,
    isFinalized: true,
    updatedAt: new Date().toISOString()
  };

  invoices[index] = updatedInvoice;
  res.json(updatedInvoice);
});

export default router;
