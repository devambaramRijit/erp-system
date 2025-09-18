
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const upload = require('../middleware/uploadMiddleware');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Get all customers
router.get('/', isAuthenticated, customerController.getAllCustomers);

// Get customer by ID
router.get('/:id', isAuthenticated, customerController.getCustomerById);

// Create new customer
router.post('/', isAuthenticated, customerController.createCustomer);

// Update customer
router.put('/:id', isAuthenticated, customerController.updateCustomer);

// Delete customer
router.delete('/:id', isAuthenticated, customerController.deleteCustomer);

// Import customers from Excel
router.post('/import-excel', isAuthenticated, upload.single('file'), customerController.importCustomersFromExcel);

module.exports = router;
