
const express = require('express');
const router = express.Router();
const actionLogController = require('../controllers/actionLogController');

// Get all action logs
router.get('/', actionLogController.getAllActionLogs);

// Get action logs by invoice ID
router.get('/invoice/:invoiceId', actionLogController.getActionLogsByInvoiceId);

module.exports = router;
