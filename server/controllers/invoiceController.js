const { Invoice } = require('../models');

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (invoice) {
      res.json(invoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    const newInvoice = await Invoice.create(req.body);
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const updated = await Invoice.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated[0] === 1) {
      const updatedInvoice = await Invoice.findByPk(req.params.id);
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const deleted = await Invoice.destroy({
      where: { id: req.params.id }
    });
    if (deleted === 1) {
      res.json({ message: 'Invoice deleted successfully' });
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};
