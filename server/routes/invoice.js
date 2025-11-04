const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Get all invoices
router.get('/', isAuthenticated, invoiceController.getAllInvoices);

// Get invoice by ID
router.get('/:id', isAuthenticated, invoiceController.getInvoiceById);

// Create new invoice
router.post('/', isAuthenticated, invoiceController.createInvoice);

// Update invoice
router.put('/:id', isAuthenticated, invoiceController.updateInvoice);

// Delete invoice
router.delete('/:id', isAuthenticated, invoiceController.deleteInvoice);

// Finalize invoice
router.put('/:id/finalize', isAuthenticated, invoiceController.finalizeInvoice);

module.exports = router;