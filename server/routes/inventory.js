const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const upload = require('../middleware/uploadMiddleware');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Get all inventory items
router.get('/', isAuthenticated, inventoryController.getAllInventory);

// Get inventory item by ID
router.get('/:id', isAuthenticated, inventoryController.getInventoryById);

// Create new inventory item
router.post('/', isAuthenticated, inventoryController.createInventoryItem);

// Update inventory item
router.put('/:id', isAuthenticated, inventoryController.updateInventoryItem);

// Delete inventory item
router.delete('/:id', isAuthenticated, inventoryController.deleteInventoryItem);

// Import products from CSV
router.post('/import-csv', isAuthenticated, upload.single('file'), inventoryController.importProductsFromCSV);

module.exports = router;