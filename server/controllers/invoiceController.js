const { Invoice } = require('../models');
const actionLogController = require('./actionLogController');

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
    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({
      where: { invoiceNumber: req.body.invoiceNumber }
    });
    
    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }
    
    const newInvoice = await Invoice.create(req.body);
    
    // Log the action
    try {
      const userId = req.user ? req.user.id : null;
      const username = req.user ? req.user.username : null;
      await actionLogController.createActionLog(
        newInvoice.id,
        newInvoice.invoiceNumber,
        'created',
        userId,
        username,
        `Invoice ${newInvoice.invoiceNumber} was created`
      );
    } catch (logError) {
      console.error('Error logging invoice creation:', logError);
    }
    
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
      
      // Log the action
      try {
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : null;
        await actionLogController.createActionLog(
          updatedInvoice.id,
          updatedInvoice.invoiceNumber,
          'updated',
          userId,
          username,
          `Invoice ${updatedInvoice.invoiceNumber} was updated`
        );
      } catch (logError) {
        console.error('Error logging invoice update:', logError);
      }
      
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
    // Get invoice details before deletion for logging
    const invoice = await Invoice.findByPk(req.params.id);
    
    const deleted = await Invoice.destroy({
      where: { id: req.params.id }
    });
    
    if (deleted === 1) {
      // Log the action
      try {
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : null;
        await actionLogController.createActionLog(
          invoice.id,
          invoice.invoiceNumber,
          'deleted',
          userId,
          username,
          `Invoice ${invoice.invoiceNumber} was deleted`
        );
      } catch (logError) {
        console.error('Error logging invoice deletion:', logError);
      }
      
      res.json({ message: 'Invoice deleted successfully' });
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// Finalize invoice
exports.finalizeInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Update invoice status to finalized
    const updated = await Invoice.update(
      { status: 'finalized' },
      { where: { id: req.params.id } }
    );
    
    if (updated[0] === 1) {
      // Log the action
      try {
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : null;
        await actionLogController.createActionLog(
          invoice.id,
          invoice.invoiceNumber,
          'finalized',
          userId,
          username,
          `Invoice ${invoice.invoiceNumber} was finalized`
        );
      } catch (logError) {
        console.error('Error logging invoice finalization:', logError);
      }
      
      res.json({ message: 'Invoice finalized successfully' });
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error finalizing invoice:', error);
    res.status(500).json({ error: 'Failed to finalize invoice' });
  }
};
