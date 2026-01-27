const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const upload = require('../middleware/uploadMiddleware');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Get all customers
router.get('/', isAuthenticated, customerController.getAllCustomers);

// Download customer template
router.get('/download-template', (req, res, next) => {
  console.log('Download template route hit before auth!');
  isAuthenticated(req, res, next);
}, (req, res, next) => {
  console.log('Download template route hit after auth!');
  customerController.downloadCustomerTemplate(req, res, next);
});

// Get customer by ID
router.get('/:id', isAuthenticated, customerController.getCustomerById);

// Create new customer
router.post('/', isAuthenticated, customerController.createCustomer);

// Update customer
router.put('/:id', isAuthenticated, customerController.updateCustomer);

// Delete customer
router.delete('/:id', isAuthenticated, customerController.deleteCustomer);

// Import customers from Excel
router.post('/import', isAuthenticated, upload.single('file'), customerController.importCustomersFromExcel);

// Bulk import customers from Excel
router.post('/bulk-import', isAuthenticated, upload.single('file'), customerController.bulkImportCustomersFromExcel);

// Bulk update customers
router.post('/bulk-update', isAuthenticated, customerController.bulkUpdateCustomers);

module.exports = router;
