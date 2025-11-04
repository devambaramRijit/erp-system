const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.0.101:5173', 'http://192.168.0.107:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, '../../../server/config/database.sqlite'));

// Create tables if they don't exist
db.serialize(() => {
  // Create inventory table
  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    costPricePerPiece REAL,
    ratePerPiece REAL,
    costPricePerInch REAL,
    ratePerInch REAL,
    productType TEXT DEFAULT 'Traded',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create invoices table
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNumber TEXT NOT NULL UNIQUE,
    date TEXT,
    customerName TEXT NOT NULL,
    customerEmail TEXT,
    customerAddress TEXT,
    billingAddress TEXT,
    items TEXT,
    subtotal REAL DEFAULT 0,
    taxRate REAL DEFAULT 0,
    taxAmount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    district TEXT,
    state TEXT,
    postalCode TEXT,
    landmark TEXT,
    phone TEXT,
    mobileNumber2 TEXT,
    email TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Check for default credentials
  if ((email === 'admin@example.com' && password === 'admin123') || 
      (email === 'admin' && password === 'admin123')) {
    res.json({
      user: { email, name: 'Admin User' },
      token: 'dummy-token'
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  res.json({ username: 'user' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// GET all inventory
app.get('/api/inventory', (req, res) => {
  db.all('SELECT * FROM inventory', (err, rows) => {
    if (err) {
      console.error('Error fetching inventory:', err);
      return res.status(500).json({ message: 'Error fetching inventory' });
    }
    res.json(rows);
  });
});

// GET all inventory categories
app.get('/api/inventory/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM inventory', (err, rows) => {
    if (err) {
      console.error('Error fetching inventory categories:', err);
      return res.status(500).json({ message: 'Error fetching inventory categories' });
    }
    const categories = rows.map(row => row.category);
    res.json(categories);
  });
});

// POST new inventory item
app.post('/api/inventory', (req, res) => {
  const { sku, name, description, category, quantity, price, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch } = req.body;
  
  db.run(
    `INSERT INTO inventory (sku, name, description, category, quantity, price, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sku, name, description, category, quantity, price, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch],
    function(err) {
      if (err) {
        console.error('Error creating inventory item:', err);
        return res.status(500).json({ message: 'Error creating inventory item' });
      }
      
      // Return the created item with its ID
      db.get('SELECT * FROM inventory WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching created item:', err);
          return res.status(500).json({ message: 'Error fetching created item' });
        }
        res.status(201).json(row);
      });
    }
  );
});

// PUT update inventory item
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { sku, name, description, category, quantity, price, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch } = req.body;
  
  db.run(
    `UPDATE inventory SET sku=?, name=?, description=?, category=?, quantity=?, price=?, productType=?, costPricePerPiece=?, ratePerPiece=?, costPricePerInch=?, ratePerInch=?, updatedAt=CURRENT_TIMESTAMP 
     WHERE id=?`,
    [sku, name, description, category, quantity, price, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch, id],
    function(err) {
      if (err) {
        console.error('Error updating inventory item:', err);
        return res.status(500).json({ message: 'Error updating inventory item' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      // Return the updated item
      db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated item:', err);
          return res.status(500).json({ message: 'Error fetching updated item' });
        }
        res.json(row);
      });
    }
  );
});

// DELETE inventory item
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting inventory item:', err);
      return res.status(500).json({ message: 'Error deleting inventory item' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully' });
  });
});

// DELETE all inventory items
app.delete('/api/inventory/all', (req, res) => {
  db.run('DELETE FROM inventory', function(err) {
    if (err) {
      console.error('Error deleting all inventory items:', err);
      return res.status(500).json({ message: 'Error deleting all inventory items' });
    }
    
    res.json({ message: 'All inventory items deleted successfully' });
  });
});

// GET all invoices
app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM invoices', (err, rows) => {
    if (err) {
      console.error('Error fetching invoices:', err);
      return res.status(500).json({ message: 'Error fetching invoices' });
    }
    
    // Parse items JSON for each invoice
    const parsedInvoices = rows.map(row => {
      if (row.items) {
        try {
          row.items = JSON.parse(row.items);
        } catch (e) {
          row.items = [];
        }
      }
      return row;
    });
    
    res.json(parsedInvoices);
  });
});

// GET all customers
app.get('/api/customers', (req, res) => {
  console.log('GET /api/customers called');
  db.all('SELECT * FROM customers', (err, rows) => {
    if (err) {
      console.error('Error fetching customers:', err);
      return res.status(500).json({ message: 'Error fetching customers' });
    }
    res.json(rows);
  });
});

// POST new customer
app.post('/api/customers', (req, res) => {
  const { name, address, city, district, state, postalCode, landmark, phone, mobileNumber2, email } = req.body;
  
  db.run(
    `INSERT INTO customers (name, address, city, district, state, postalCode, landmark, phone, mobileNumber2, email) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, address, city, district, state, postalCode, landmark, phone, mobileNumber2, email],
    function(err) {
      if (err) {
        console.error('Error creating customer:', err);
        return res.status(500).json({ message: 'Error creating customer' });
      }
      
      // Return the created customer with its ID
      db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching created customer:', err);
          return res.status(500).json({ message: 'Error fetching created customer' });
        }
        res.status(201).json(row);
      });
    }
  );
});

// PUT update customer
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, address, city, district, state, postalCode, landmark, phone, mobileNumber2, email } = req.body;
  
  db.run(
    `UPDATE customers SET name=?, address=?, city=?, district=?, state=?, postalCode=?, landmark=?, phone=?, mobileNumber2=?, email=? 
     WHERE id=?`,
    [name, address, city, district, state, postalCode, landmark, phone, mobileNumber2, email, id],
    function(err) {
      if (err) {
        console.error('Error updating customer:', err);
        return res.status(500).json({ message: 'Error updating customer' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Return the updated customer
      db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated customer:', err);
          return res.status(500).json({ message: 'Error fetching updated customer' });
        }
        res.json(row);
      });
    }
  );
});

// DELETE customer
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).json({ message: 'Error deleting customer' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  });
});

// GET invoice by ID
app.get('/api/invoices/:id', (req, res) => {
  db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('Error fetching invoice:', err);
      return res.status(500).json({ message: 'Error fetching invoice' });
    }
    
    if (!row) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Parse items JSON if needed
    if (row.items) {
      try {
        row.items = JSON.parse(row.items);
      } catch (e) {
        row.items = [];
      }
    }
    
    res.json(row);
  });
});

app.post('/api/invoices', (req, res) => {
  const { invoiceNumber, date, customerName, customerEmail, customerAddress, billingAddress, items, subtotal, taxRate, taxAmount, total, notes, status } = req.body;

  if (!invoiceNumber || !customerName) {
    return res.status(400).json({ message: 'Invoice number and customer name are required' });
  }

  // Check if invoice number already exists
  db.get('SELECT id FROM invoices WHERE invoiceNumber = ?', [invoiceNumber], (err, row) => {
    if (err) {
      console.error('Error checking invoice number:', err);
      return res.status(500).json({ error: 'Failed to check invoice number' });
    }

    if (row) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    const sql = `INSERT INTO invoices (invoiceNumber, date, customerName, customerEmail, customerAddress, items, subtotal, taxRate, taxAmount, total, notes, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
      invoiceNumber,
      date || new Date().toISOString(),
      customerName,
      customerEmail || '',
      billingAddress || customerAddress || '',
      JSON.stringify(items || []),
      subtotal || 0,
      taxRate || 0,
      taxAmount || 0,
      total || 0,
      notes || '',
      status || 'draft',
      new Date().toISOString(),
      new Date().toISOString()
    ], function(err) {
      if (err) {
        console.error('Error creating invoice:', err);
        return res.status(500).json({ message: 'Error creating invoice' });
      }

      // Get the newly created invoice
      db.get("SELECT * FROM invoices WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching newly created invoice:', err);
          return res.status(500).json({ message: 'Error creating invoice' });
        }

        // Parse items JSON
        if (row && row.items) {
          try {
            row.items = JSON.parse(row.items);
          } catch (parseErr) {
            console.error('Error parsing items JSON:', parseErr);
            row.items = [];
          }
        }

        res.status(201).json(row);
      });
    });
  });
});

// PUT update invoice
app.put('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const { items, ...otherFields } = req.body;
  
  // Convert items to JSON string if it's an array
  const updateData = {
    ...otherFields,
    items: Array.isArray(items) ? JSON.stringify(items) : items
  };
  
  const sql = `UPDATE invoices SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}, updatedAt = ? WHERE id = ?`;
  const values = [...Object.values(updateData), new Date().toISOString(), id];
  
  db.run(sql, values, function(err) {
    if (err) {
      console.error('Error updating invoice:', err);
      return res.status(500).json({ message: 'Error updating invoice' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Get the updated invoice
    db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated invoice:', err);
        return res.status(500).json({ message: 'Error fetching updated invoice' });
      }
      
      // Parse items JSON if needed
      if (row && row.items) {
        try {
          row.items = JSON.parse(row.items);
        } catch (e) {
          row.items = [];
        }
      }
      
      res.json(row);
    });
  });
});

// DELETE invoice
app.delete('/api/invoices/:id', (req, res) => {
  db.run('DELETE FROM invoices WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      console.error('Error deleting invoice:', err);
      return res.status(500).json({ message: 'Error deleting invoice' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted successfully' });
  });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});