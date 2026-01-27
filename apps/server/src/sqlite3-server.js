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
    invoiceType TEXT,
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

  // Drop the users table if it exists to ensure a clean schema
  db.run(`DROP TABLE IF EXISTS users`);

  // Recreate the users table with the correct schema
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed the users table with default admin and user
  db.run(`INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`, ['admin@example.com', 'admin123', 'Admin User', 'admin']);
  db.run(`INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`, ['user@example.com', 'user123', 'Demo User', 'user']);

  // Add invoiceType column to invoices table if it doesn't exist
  db.run('ALTER TABLE invoices ADD COLUMN invoiceType TEXT', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding invoiceType column to invoices table:', err);
    }
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ message: 'Error logging in' });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      user: { email: user.email, name: user.name, role: user.role },
      token: 'dummy-token'
    });
  });
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
    `INSERT INTO customers (name, address, city, district, state, postalCode, landmark, phone, mobileNumber2, email, createdAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, address, city, district, state, postalCode, landmark, phone, mobileNumber2, email, new Date().toISOString()],
    function(err) {
      if (err) {
        console.error('Error creating customer:', err);
        return res.status(500).json({ message: 'Error creating customer', error: err.message });
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

// POST bulk update customers
app.post('/api/customers/bulk-update', (req, res) => {
  const customersToUpdate = req.body;
  if (!Array.isArray(customersToUpdate) || customersToUpdate.length === 0) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  let updatedCount = 0;
  const notFound = [];
  const errors = [];
  let completed = 0;

  customersToUpdate.forEach(customerData => {
    if (!customerData.phone) {
      notFound.push(customerData);
      completed++;
      if (completed === customersToUpdate.length) {
        sendResponse();
      }
      return;
    }

    db.get('SELECT * FROM customers WHERE phone = ?', [customerData.phone], (err, customer) => {
      if (err) {
        errors.push({ customerData, error: err.message });
        completed++;
        if (completed === customersToUpdate.length) {
          sendResponse();
        }
        return;
      }

      if (customer) {
        const updateSql = `UPDATE customers SET 
          name = ?, 
          address = ?, 
          city = ?, 
          district = ?, 
          state = ?, 
          postalCode = ?, 
          landmark = ?, 
          mobileNumber2 = ?, 
          email = ?, 
          updatedAt = ? 
          WHERE id = ?`;
        const params = [
          customerData.name || customer.name,
          customerData.address || customer.address,
          customerData.city || customer.city,
          customerData.district || customer.district,
          customerData.state || customer.state,
          customerData.postalCode || customer.postalCode,
          customerData.landmark || customer.landmark,
          customerData.mobileNumber2 || customer.mobileNumber2,
          customerData.email || customer.email,
          new Date().toISOString(),
          customer.id
        ];
        db.run(updateSql, params, function(err) {
          if (err) {
            errors.push({ customerData, error: err.message });
          } else {
            updatedCount++;
          }
          completed++;
          if (completed === customersToUpdate.length) {
            sendResponse();
          }
        });
      } else {
        notFound.push(customerData);
        completed++;
        if (completed === customersToUpdate.length) {
          sendResponse();
        }
      }
    });
  });

  function sendResponse() {
    res.status(200).json({
      message: `Bulk update completed. Updated ${updatedCount} customers.`,
      updatedCount,
      notFound: notFound.length,
      errors: errors.length,
      notFoundCustomers: notFound,
      errorDetails: errors,
    });
  }
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
  const { invoiceNumber, date, customerName, customerEmail, billingAddress, items, subtotal, taxRate, taxAmount, total, notes, status, invoiceType } = req.body;

  if (!invoiceNumber || !customerName) {
    return res.status(400).json({ message: 'Invoice number and customer name are required' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT id FROM invoices WHERE invoiceNumber = ?', [invoiceNumber], (err, row) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to check invoice number' });
      }

      if (row) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'Invoice number already exists' });
      }

      const sql = `INSERT INTO invoices (invoiceNumber, date, customerName, customerEmail, customerAddress, items, subtotal, taxRate, taxAmount, total, notes, status, createdAt, updatedAt, invoiceType)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        invoiceNumber,
        date || new Date().toISOString(),
        customerName,
        customerEmail || '',
        billingAddress || '',
        JSON.stringify(items || []),
        subtotal || 0,
        taxRate || 0,
        taxAmount || 0,
        total || 0,
        notes || '',
        status || 'draft',
        new Date().toISOString(),
        new Date().toISOString(),
        invoiceType || 'manufactured'
      ];

      db.run(sql, params, function(err) {
        if (err) {
          console.error('Error creating invoice:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Error creating invoice' });
        }

        const invoiceId = this.lastID;

        const itemPromises = (items || []).map(item => {
          return new Promise((resolve, reject) => {
            if (item.productId && item.quantity > 0) {
              const updateSql = `UPDATE inventory SET quantity = quantity - ? WHERE id = ?`;
              db.run(updateSql, [item.quantity, item.productId], (err) => {
                if (err) return reject(err);
                resolve();
              });
            } else {
              resolve();
            }
          });
        });

        Promise.all(itemPromises)
          .then(() => {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Failed to commit transaction' });
              }
              db.get("SELECT * FROM invoices WHERE id = ?", [invoiceId], (err, row) => {
                if (err) {
                  return res.status(500).json({ message: 'Error fetching newly created invoice' });
                }
                res.status(201).json(row);
              });
            });
          })
          .catch(err => {
            console.error('Error updating inventory:', err);
            db.run('ROLLBACK');
            res.status(500).json({ message: 'Error updating inventory' });
          });
      });
    });
  });
});

// PUT update invoice

app.put('/api/invoices/:id', (req, res) => {

  const { id } = req.params;

  const { items: newItems, ...invoiceData } = req.body;



  db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, oldInvoice) => {

    if (err) {

      return res.status(500).json({ message: 'Failed to fetch invoice for update' });

    }

    if (!oldInvoice) {

      return res.status(404).json({ message: 'Invoice not found' });

    }



    const oldItems = JSON.parse(oldInvoice.items || '[]');

    

    const inventoryChanges = new Map();

    oldItems.forEach(item => {

      if (item.productId && item.quantity) {

        inventoryChanges.set(item.productId, (inventoryChanges.get(item.productId) || 0) + item.quantity);

      }

    });

    newItems.forEach(item => {

      if (item.productId && item.quantity) {

        inventoryChanges.set(item.productId, (inventoryChanges.get(item.productId) || 0) - item.quantity);

      }

    });



    db.serialize(() => {

      db.run('BEGIN TRANSACTION');



      const stmt = db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?');

      for (const [productId, quantityChange] of inventoryChanges.entries()) {

        if (productId && quantityChange !== 0) {

          stmt.run(quantityChange, productId);

        }

      }



      stmt.finalize((err) => {

        if (err) {

          console.error('Inventory update failed:', err);

          db.run('ROLLBACK');

          return res.status(500).json({ message: 'Inventory update failed' });

        }



        const updateSql = `UPDATE invoices SET

            invoiceNumber = ?, date = ?, customerName = ?, customerEmail = ?,

            customerAddress = ?, items = ?, subtotal = ?, total = ?, notes = ?, status = ?,

            invoiceType = ?, updatedAt = ?

          WHERE id = ?`;

        

        const params = [

          invoiceData.invoiceNumber, invoiceData.date, invoiceData.customerName,

          invoiceData.customerEmail, invoiceData.billingAddress, JSON.stringify(newItems || []),

          invoiceData.subtotal || 0, invoiceData.total || 0, invoiceData.notes,

          invoiceData.status, invoiceData.invoiceType || 'manufactured', new Date().toISOString(), id

        ];



        db.run(updateSql, params, function(err) {

          if (err) {

            console.error('Invoice update failed:', err);
            db.run('ROLLBACK');

            return res.status(500).json({ message: 'Invoice update failed' });

          }



          db.run('COMMIT', (commitErr) => {

            if (commitErr) {

              db.run('ROLLBACK');

              return res.status(500).json({ message: 'Failed to commit transaction' });

            }



            db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {

              if (err) {

                return res.status(500).json({ message: 'Failed to fetch updated invoice' });

              }

              row.items = JSON.parse(row.items || '[]');

              res.json(row);

            });

          });

        });

      });

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