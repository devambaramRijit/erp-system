// ... existing code ...
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../../database/erp_soul.db');
const db = new sqlite3.Database(dbPath);

// GET all customers
router.get('/', async (req, res) => {
    try {
        db.all('SELECT * FROM customers', (err, rows) => {
            if (err) {
                console.error('Error fetching customers:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json(rows);
        });
    } catch (error) {
        console.error('Error in GET /customers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk update customers
router.post('/bulk-update', async (req, res) => {
    try {
        const customers = req.body;
        // Your bulk update logic here
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
// ... existing code ...