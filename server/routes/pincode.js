const express = require('express');
const router = express.Router();
const pincodeController = require('../controllers/pincodeController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Route to get a list of all unique states
// This is used to populate the state dropdown in the customer form.
router.get('/states', isAuthenticated, pincodeController.getStates);

// Route to get information for a specific pincode
// This is used for autofilling address details based on a pincode.
router.get('/:pincode', isAuthenticated, pincodeController.getPincodeInfo);

module.exports = router;
