const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

console.log('=== USING SQLITE-SERVER.JS ===');

const app = express();
const port = process.env.PORT || 3000;

// Initialize SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../../server/config/database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Define the Inventory model
const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  costPricePerPiece: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  ratePerPiece: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  costPricePerInch: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  ratePerInch: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'inventory'
});

// Define the User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  }
}, {
  timestamps: true,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Define the Customer model
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING
  },
  postalCode: {
    type: DataTypes.STRING
  },
  company: {
    type: DataTypes.STRING
  },
  taxId: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'Customers'
});

// Define the Invoice model
const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE
  },
  customerName: {
    type: DataTypes.STRING
  },
  customerEmail: {
    type: DataTypes.STRING
  },
  customerAddress: {
    type: DataTypes.TEXT
  },
  items: {
    type: DataTypes.TEXT
  },
  subtotal: {
    type: DataTypes.FLOAT
  },
  taxRate: {
    type: DataTypes.FLOAT
  },
  taxAmount: {
    type: DataTypes.FLOAT
  },
  total: {
    type: DataTypes.FLOAT
  },
  notes: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'invoices'
});

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Test database connection and sync models
sequelize.authenticate()
  .then(() => {
    console.log('SQLite connection has been established successfully.');
    return sequelize.sync();
  })
  .then(() => {
    console.log('Database synchronized.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    res.json({
      user: req.session.user,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        message: 'Could not log out'
      });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({
      message: 'Not authenticated'
    });
  }
});

// Inventory routes
app.get('/api/inventory', async (req, res) => {
  try {
    console.log('=== INVENTORY GET REQUEST ===');
    const inventoryItems = await Inventory.findAll();
    console.log('Returning inventory items:', JSON.stringify(inventoryItems, null, 2));
    console.log('=== END INVENTORY GET REQUEST ===\n');
    res.json(inventoryItems);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Error fetching inventory item' });
  }
});

app.post('/api/inventory', async (req, res) => {
  // Log wrapper to show received and expected data
  console.log('=== INVENTORY POST REQUEST ===');
  console.log('Received data:', JSON.stringify(req.body, null, 2));
  console.log('Expected fields: sku, name, category');
  console.log('Optional fields: description, quantity, price, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch');

  const { sku, name, description, quantity, price, category, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch } = req.body;

  if (!sku || !name || !category) {
    console.log('Validation failed. Missing required fields.');
    console.log('Missing:', {
      sku: !sku ? 'SKU is missing' : 'OK',
      name: !name ? 'Name is missing' : 'OK',
      category: !category ? 'Category is missing' : 'OK',
      productType: !productType ? 'Product Type is missing' : 'OK',
      costPricePerPiece: !costPricePerPiece ? 'Cost Price Per Piece is missing' : 'OK',
      ratePerPiece: !ratePerPiece ? 'Rate Per Piece is missing' : 'OK',
      costPricePerInch: !costPricePerInch ? 'Cost Price Per Inch is missing' : 'OK',
      ratePerInch: !ratePerInch ? 'Rate Per Inch is missing' : 'OK'
    });
    return res.status(400).json({ message: 'SKU, name, and category are required' });
  }

  console.log('Validation passed. All required fields are present.');

  try {
    const newItem = await Inventory.create({
      sku,
      name,
      description: description || '',
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
      category,
      productType: req.body.productType || 'Traded',
      costPricePerPiece: Number(req.body.costPricePerPiece) || 0,
      ratePerPiece: Number(req.body.ratePerPiece) || 0,
      costPricePerInch: Number(req.body.costPricePerInch) || 0,
      ratePerInch: Number(req.body.ratePerInch) || 0
    });

    console.log('Created new item:', JSON.stringify(newItem, null, 2));

    // Log response being sent to frontend
    console.log('Sending response to frontend:', JSON.stringify(newItem, null, 2));
    console.log('All fields included in response:', {
      id: newItem.id,
      sku: newItem.sku,
      name: newItem.name,
      description: newItem.description,
      quantity: newItem.quantity,
      price: newItem.price,
      category: newItem.category,
      productType: newItem.productType,
      costPricePerPiece: newItem.costPricePerPiece,
      ratePerPiece: newItem.ratePerPiece,
      costPricePerInch: newItem.costPricePerInch,
      ratePerInch: newItem.ratePerInch,
      createdAt: newItem.createdAt,
      updatedAt: newItem.updatedAt
    });
    console.log('=== END INVENTORY POST REQUEST ===\n');

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Error creating inventory item' });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { sku, name, description, quantity, price, category, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch } = req.body;

  try {
    const item = await Inventory.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!sku || !name || !category) {
      return res.status(400).json({ message: 'SKU, name, and category are required' });
    }

    await item.update({
      sku,
      name,
      description: description || item.description,
      quantity: Number(quantity) || item.quantity,
      price: Number(price) || item.price,
      category,
      productType: productType || item.productType || 'Traded',
      costPricePerPiece: costPricePerPiece !== undefined ? Number(costPricePerPiece) : (item.costPricePerPiece !== undefined ? item.costPricePerPiece : 0),
      ratePerPiece: ratePerPiece !== undefined ? Number(ratePerPiece) : (item.ratePerPiece !== undefined ? item.ratePerPiece : 0),
      costPricePerInch: costPricePerInch !== undefined ? Number(costPricePerInch) : (item.costPricePerInch !== undefined ? item.costPricePerInch : 0),
      ratePerInch: ratePerInch !== undefined ? Number(ratePerInch) : (item.ratePerInch !== undefined ? item.ratePerInch : 0)
    });

    console.log('Updated item:', JSON.stringify(item, null, 2));

    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Error updating inventory item' });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
});

// Import products from CSV
app.post('/api/products/import-csv', upload.single('file'), async (req, res) => {
  console.log('CSV import request received');

  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log(`File received: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);

  const results = [];
  const importedProducts = [];

  try {
    const processCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => {
            results.push(data);
          })
          .on('end', () => {
            resolve(results);
          })
          .on('error', reject);
      });
    };

    const csvData = await processCSV();
    console.log(`CSV parsing complete. Found ${csvData.length} rows.`);

    // Process the CSV data
    for (let index = 0; index < csvData.length; index++) {
      const row = csvData[index];
      console.log(`Processing row ${index + 1}:`, JSON.stringify(row, null, 2));

      // Skip header row if it exists
      if (index === 0 && row.SKU === 'SKU') continue;

      // Validate required fields
      if (!row.SKU || !row.Name || !row['Product Type'] || !row['Product Category']) {
        console.log(`Skipping row ${index + 1}: Missing required fields`);
        console.log(`Missing fields: SKU=${!!row.SKU}, Name=${!!row.Name}, Product Type=${!!row['Product Type']}, Product Category=${!!row['Product Category']}`);
        continue;
      }

      // Determine price based on product type
      let price = 0;
      if (row['Product Type'] === 'Traded' && row['Cost Price Per Piece']) {
        price = parseFloat(row['Cost Price Per Piece']) || 0;
      } else if (row['Product Type'] === 'Manufactured' && row['Product Category'] === 'Laddu Gopal Mukut' && row['Cost Price Per Piece']) {
        price = parseFloat(row['Cost Price Per Piece']) || 0;
      } else if (row['Product Type'] === 'Manufactured' && (row['Product Category'] === 'Laddu Gopal Base' || row['Product Category'] === 'Laddu Gopal Dress') && row['Cost Price Per Inch']) {
        price = parseFloat(row['Cost Price Per Inch']) || 0;
      }

      // Create new inventory item
      const newItem = {
        sku: row.SKU,
        name: row.Name,
        description: '', // No description field in CSV
        quantity: parseInt(row.Quantity) || 0,
        price: price,
        category: row['Product Category'],
        productType: row['Product Type'],
        costPricePerPiece: parseFloat(row['Cost Price Per Piece']) || 0,
        ratePerPiece: parseFloat(row['Rate Per Piece']) || 0,
        costPricePerInch: parseFloat(row['Cost Price Per Inch']) || 0,
        ratePerInch: parseFloat(row['Rate Per Inch']) || 0
      };

      try {
        const createdItem = await Inventory.create(newItem);
        importedProducts.push(createdItem);
      } catch (error) {
        console.error(`Error creating item from row ${index + 1}:`, error);
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    console.log(`Temporary file deleted: ${req.file.path}`);

    // Return the imported products
    console.log(`Import successful. Added ${importedProducts.length} products.`);
    res.status(201).json({
      message: `Successfully imported ${importedProducts.length} products`,
      products: importedProducts
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Delete the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: `Error processing file: ${error.message}` });
  }
});

// Customer routes
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// Customer import endpoint
app.post('/api/customers/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Import the xlsx library
    const XLSX = require('xlsx');

    // Read the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'No data found in the Excel file' });
    }

    console.log(`Processing ${data.length} customer records from Excel file`);

    const importedCustomers = [];
    const errors = [];

    // Process each row in the Excel file
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Map Excel columns to database fields
        const customerData = {
          name: row['Name'] || row['Customer Name'] || row['customerName'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['Mobile'] || row['mobileNumber1'] || '',
          address: row['Address'] || row['addressLine1'] || '',
          city: row['City'] || row['city'] || '',
          state: row['State'] || row['state'] || '',
          country: row['Country'] || row['country'] || '',
          postalCode: row['Postal Code'] || row['postalCode'] || '',
          company: row['Company'] || row['company'] || '',
          taxId: row['Tax ID'] || row['GST Number'] || row['gstNumber'] || '',
          notes: row['Notes'] || row['notes'] || ''
        };

        // Validate required fields
        if (!customerData.name) {
          errors.push(`Row ${i + 1}: Customer name is required`);
          continue;
        }

        // Create the customer in the database
        const customer = await Customer.create(customerData);
        importedCustomers.push(customer);

        console.log(`Created customer: ${customer.name} (ID: ${customer.id})`);
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    console.log(`Temporary file deleted: ${req.file.path}`);

    // Return the result
    res.status(201).json({
      message: `Successfully imported ${importedCustomers.length} customers`,
      importedCount: importedCustomers.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      customers: importedCustomers
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);

    // Delete the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: `Error processing file: ${error.message}` });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Error fetching customer' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await customer.update(req.body);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await customer.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

// Invoice routes
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    // Parse items JSON for each invoice
    const parsedInvoices = invoices.map(invoice => {
      if (invoice.items && typeof invoice.items === 'string') {
        try {
          invoice.items = JSON.parse(invoice.items);
        } catch (e) {
          invoice.items = [];
        }
      }
      return invoice;
    });
    res.json(parsedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    // Parse items JSON if needed
    if (invoice.items && typeof invoice.items === 'string') {
      try {
        invoice.items = JSON.parse(invoice.items);
      } catch (e) {
        invoice.items = [];
      }
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({
      where: { invoiceNumber: req.body.invoiceNumber }
    });
    
    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }
    
    // Convert items to JSON string if it's an array
    const invoiceData = {
      ...req.body,
      items: Array.isArray(req.body.items) ? JSON.stringify(req.body.items) : req.body.items
    };
    
    const newInvoice = await Invoice.create(invoiceData);
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    await invoice.update(req.body);
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Error updating invoice' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    await invoice.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Error deleting invoice' });
  }
});

// Serve static files from the client build (if it exists)
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Catch-all route for client-side routing in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
