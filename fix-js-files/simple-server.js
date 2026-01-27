const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const { logChange } = require('./server/services/auditService');
const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./server/config/database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.0.101:5173', 'http://192.168.0.107:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Create tables if they don't exist
db.serialize(() => {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create invoices table
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNumber TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerEmail TEXT,
    customerAddress TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    taxRate REAL DEFAULT 0,
    taxAmount REAL DEFAULT 0,
    total REAL NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create invoice_action_logs table
  db.run(`CREATE TABLE IF NOT EXISTS invoice_action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    action_type TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
  )`);
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Store user info in session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    });
  });
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

// Invoice routes
app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM invoices ORDER BY date DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching invoices:', err);
      return res.status(500).json({ message: 'Error fetching invoices' });
    }
    res.json(rows);
  });
});

app.get('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching invoice:', err);
      return res.status(500).json({ message: 'Error fetching invoice' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(row);
  });
});

// POST create invoice
app.post('/api/invoices', (req, res) => {
  const {
    invoiceNumber,
    date,
    customerName,
    customerEmail,
    customerAddress,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes,
    status
  } = req.body;

  // Validate required fields
  if (!invoiceNumber || !date || !customerName || !items) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `INSERT INTO invoices (
    invoiceNumber, date, customerName, customerEmail, customerAddress, items,
    subtotal, taxRate, taxAmount, total, notes, status, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  // Handle null/undefined values for numeric fields
  const safeSubtotal = (subtotal === null || subtotal === undefined) ? 0 : subtotal;
  const safeTaxRate = (taxRate === null || taxRate === undefined) ? 0 : taxRate;
  const safeTaxAmount = (taxAmount === null || taxAmount === undefined) ? 0 : taxAmount;
  const safeTotal = (total === null || total === undefined) ? 0 : total;
  
  const values = [
    invoiceNumber,
    date,
    customerName,
    customerEmail,
    customerAddress,
    JSON.stringify(items || []),
    safeSubtotal,
    safeTaxRate,
    safeTaxAmount,
    safeTotal,
    notes,
    status || 'draft',
    new Date().toISOString(),
    new Date().toISOString()
  ];

  db.run(sql, values, function(err) {
    if (err) {
      console.error('Error creating invoice:', err);
      return res.status(500).json({ message: 'Error creating invoice' });
    }
    const newInvoiceId = this.lastID;

    // Log the action using audit service
    const newInvoiceData = {
      id: newInvoiceId,
      invoiceNumber,
      date,
      customerName,
      customerEmail,
      customerAddress,
      items: items || [],
      subtotal: safeSubtotal,
      taxRate: safeTaxRate,
      taxAmount: safeTaxAmount,
      total: safeTotal,
      notes,
      status: status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logChange(
      'invoices',
      newInvoiceId,
      'CREATE',
      null, // No old data for creation
      newInvoiceData,
      req.session.userId // Get user ID from session
    );

    // Get the newly created invoice
    db.get("SELECT * FROM invoices WHERE id = ?", [newInvoiceId], (err, row) => {
      if (err) {
        console.error('Error fetching new invoice:', err);
        return res.status(500).json({ message: 'Error fetching new invoice' });
      }
      res.status(201).json(row);
    });
  });
});

// PUT update invoice
app.put('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const {
    invoiceNumber,
    date,
    customerName,
    customerEmail,
    customerAddress,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes,
    status
  } = req.body;

  // Validate required fields
  if (!invoiceNumber || !date || !customerName || !items) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Fetch the old invoice data to compare for logging
  db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, oldInvoice) => {
    if (err) {
      console.error('Error fetching old invoice for logging:', err);
      // Continue without logging if this fails
    }

    const sql = `UPDATE invoices SET
      invoiceNumber = ?,
      date = ?,
      customerName = ?,
      customerEmail = ?,
      customerAddress = ?,
      items = ?,
      subtotal = ?,
      taxRate = ?,
      taxAmount = ?,
      total = ?,
      notes = ?,
      status = ?,
      updatedAt = ?
    WHERE id = ?`;

    // Handle null/undefined values for numeric fields
    const safeSubtotal = (subtotal === null || subtotal === undefined) ? 0 : subtotal;
    const safeTaxRate = (taxRate === null || taxRate === undefined) ? 0 : taxRate;
    const safeTaxAmount = (taxAmount === null || taxAmount === undefined) ? 0 : taxAmount;
    const safeTotal = (total === null || total === undefined) ? 0 : total;
    
    const values = [
      invoiceNumber,
      date,
      customerName,
      customerEmail,
      customerAddress,
      JSON.stringify(items || []),
      safeSubtotal,
      safeTaxRate,
      safeTaxAmount,
      safeTotal,
      notes,
      status,
      new Date().toISOString(),
      id
    ];

    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error updating invoice:', err);
        return res.status(500).json({ message: 'Error updating invoice' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Log the changes using audit service
      if (oldInvoice) {
        const newInvoiceData = {
          id,
          invoiceNumber,
          date,
          customerName,
          customerEmail,
          customerAddress,
          items: items || [],
          subtotal: safeSubtotal,
          taxRate: safeTaxRate,
          taxAmount: safeTaxAmount,
          total: safeTotal,
          notes,
          status,
          updatedAt: new Date().toISOString()
        };

        logChange(
          'invoices',
          id,
          'UPDATE',
          oldInvoice,
          newInvoiceData,
          req.session.userId
        );
      }

      // Get the updated invoice
      db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated invoice:', err);
          return res.status(500).json({ message: 'Error fetching updated invoice' });
        }
        res.json(row);
      });
    });
  });
});

// DELETE invoice
app.delete('/api/invoices/:id', (req, res) => {
  const { id } = req.params;

  // Get invoice details before deletion for logging
  db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, invoice) => {
    if (err) {
      console.error('Error fetching invoice for logging:', err);
      // Continue without logging if this fails
    }

    db.run('DELETE FROM invoices WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting invoice:', err);
        return res.status(500).json({ message: 'Error deleting invoice' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Log the deletion using audit service
      if (invoice) {
        logChange(
          'invoices',
          id,
          'DELETE',
          invoice,
          null, // No new data for deletion
          req.session.userId
        );
      }

      res.json({ message: 'Invoice deleted successfully' });
    });
  });
});

// Get action logs for a specific invoice
app.get('/api/action-logs/invoice/:id', (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT * FROM audit_logs WHERE table_name = ? AND record_id = ? ORDER BY timestamp DESC',
    ['invoices', id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching action logs:', err);
        return res.status(500).json({ message: 'Error fetching action logs' });
      }
      
      // Transform the audit logs to match the expected format
      const formattedLogs = rows.map(row => {
        let details = '';
        if (row.action === 'CREATE') {
          details = 'Invoice created';
        } else if (row.action === 'UPDATE') {
          if (row.changed_fields) {
            const changedFields = JSON.parse(row.changed_fields);
            details = `Updated: ${changedFields.join(', ')}`;
          } else {
            details = 'Invoice updated';
          }
        } else if (row.action === 'DELETE') {
          details = 'Invoice deleted';
        }
        
        return {
          id: row.id,
          invoiceId: row.record_id,
          action: row.action.toLowerCase(),
          actionDate: row.timestamp,
          details,
          userId: row.user_id
        };
      });
      
      res.json(formattedLogs);
    }
  );
});

// Initialize admin user if it doesn't exist
db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
  if (err) {
    console.error('Error checking for admin user:', err);
    return;
  }

  if (!user) {
    const adminPassword = bcrypt.hashSync('admin123', 8);
    db.run(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@example.com', adminPassword, 'admin'],
      (err) => {
        if (err) {
          console.error('Error creating admin user:', err);
        } else {
          console.log('Default admin user created');
        }
      }
    );
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// GET action logs for an invoice
app.get('/api/action-logs/invoice/:id', (req, res) => {
  const { id } = req.params;
  
  db.all('SELECT * FROM audit_logs WHERE table_name = ? AND record_id = ? ORDER BY timestamp DESC', ['invoices', id], (err, rows) => {
    if (err) {
      console.error('Error fetching action logs:', err);
      return res.status(500).json({ message: 'Error fetching action logs' });
    }
    
    // Transform the audit logs to match the expected format
    const formattedLogs = rows.map(row => {
      let details = '';
      if (row.action === 'CREATE') {
        details = 'Invoice created';
      } else if (row.action === 'UPDATE') {
        if (row.changed_fields) {
          const changedFields = JSON.parse(row.changed_fields);
          details = `Updated: ${changedFields.join(', ')}`;
        } else {
          details = 'Invoice updated';
        }
      } else if (row.action === 'DELETE') {
        details = 'Invoice deleted';
      }
      
      return {
        id: row.id,
        invoiceId: row.record_id,
        action: row.action.toLowerCase(),
        actionDate: row.timestamp,
        details,
        userId: row.user_id
      };
    });
    
    res.json(formattedLogs);
  });
});

// Serve the React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../apps/client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:5173`);
  
  // Log all registered routes
  console.log('\nRegistered API routes:');
  app._router.stack
    .filter(r => r.route)
    .map(r => Object.keys(r.route.methods).map(method => `${method.toUpperCase()} ${r.route.path}`))
    .flat()
    .forEach(path => console.log(path));
});
