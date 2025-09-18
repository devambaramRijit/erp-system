const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Register route
router.post('/register', authController.register);

// Logout route
router.post('/logout', authController.logout);

// Get current user
router.get('/me', authController.getCurrentUser);

// Get all app data (products and customers)
router.get('/app-data', authController.getAppData);

module.exports = router;