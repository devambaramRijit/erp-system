const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

console.log('=== USING SIMPLE-SERVER.JS ===');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Mock inventory data
let inventoryItems = [
  {
    id: '1',
    sku: 'ITEM001',
    name: 'Laptop Computer',
    description: 'High-performance laptop for business use',
    quantity: 15,
    price: 999.99,
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    sku: 'ITEM002',
    name: 'Office Chair',
    description: 'Ergonomic office chair with lumbar support',
    quantity: 32,
    price: 249.99,
    category: 'Furniture',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    sku: 'ITEM003',
    name: 'Wireless Mouse',
    description: 'Bluetooth wireless mouse with precision tracking',
    quantity: 75,
    price: 29.99,
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    sku: 'ITEM004',
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness',
    quantity: 24,
    price: 49.99,
    category: 'Office Supplies',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  // Simple mock authentication - accept any email/password
  const { email, password } = req.body;

  if (email && password) {
    const user = {
      id: '1',
      name: 'Demo User',
      email: email,
      role: 'admin'
    };

    req.session.user = user;
    res.json({
      user,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      message: 'Invalid email or password'
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
app.get('/api/inventory', (req, res) => {
  res.json(inventoryItems);
});

app.get('/api/inventory/:id', (req, res) => {
  const item = inventoryItems.find(item => item.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  res.json(item);
});

app.post('/api/inventory', (req, res) => {
  // Log wrapper to show received and expected data
  console.log('=== INVENTORY POST REQUEST ===');
  console.log('Received data:', JSON.stringify(req.body, null, 2));
  console.log('Expected fields: sku, name, category');
  console.log('Optional fields: description, quantity, price');
  
  const { sku, name, description, quantity, price, category } = req.body;

  if (!sku || !name || !category) {
    console.log('Validation failed. Missing required fields.');
    console.log('Missing:', {
      sku: !sku ? 'SKU is missing' : 'OK',
      name: !name ? 'Name is missing' : 'OK',
      category: !category ? 'Category is missing' : 'OK'
    });
    return res.status(400).json({ message: 'SKU, name, and category are required' });
  }
  
  console.log('Validation passed. All required fields are present.');

  const newItem = {
    id: Math.random().toString(36).substr(2, 9),
    sku,
    name,
    description: description || '',
    quantity: Number(quantity) || 0,
    price: Number(price) || 0,
    category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  inventoryItems.push(newItem);
  
  // Log response being sent to frontend
  console.log('Sending response to frontend:', JSON.stringify(newItem, null, 2));
  console.log('=== END INVENTORY POST REQUEST ===\n');
  
  res.status(201).json(newItem);
});

app.put('/api/inventory/:id', (req, res) => {
  const { sku, name, description, quantity, price, category } = req.body;
  const itemIndex = inventoryItems.findIndex(item => item.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  if (!sku || !name || !category) {
    return res.status(400).json({ message: 'SKU, name, and category are required' });
  }

  inventoryItems[itemIndex] = {
    ...inventoryItems[itemIndex],
    sku,
    name,
    description: description || inventoryItems[itemIndex].description,
    quantity: Number(quantity) || inventoryItems[itemIndex].quantity,
    price: Number(price) || inventoryItems[itemIndex].price,
    category,
    updatedAt: new Date().toISOString()
  };

  res.json(inventoryItems[itemIndex]);
});

app.delete('/api/inventory/:id', (req, res) => {
  const itemIndex = inventoryItems.findIndex(item => item.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  inventoryItems.splice(itemIndex, 1);
  res.status(204).send();
});

// Import products from CSV
app.post('/api/products/import-csv', upload.single('file'), (req, res) => {
  console.log('CSV import request received');
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log(`File received: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);
  
  const results = [];
  const importedProducts = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      console.log(`CSV parsing complete. Found ${results.length} rows.`);
      
      // Process the CSV data
      results.forEach((row, index) => {
        console.log(`Processing row ${index + 1}:`, JSON.stringify(row, null, 2));
        
        // Skip header row if it exists
        if (index === 0 && row.SKU === 'SKU') return;
        
        // Validate required fields
        if (!row.SKU || !row.Name || !row['Product Type'] || !row['Product Category']) {
          console.log(`Skipping row ${index + 1}: Missing required fields`);
          console.log(`Missing fields: SKU=${!!row.SKU}, Name=${!!row.Name}, Product Type=${!!row['Product Type']}, Product Category=${!!row['Product Category']}`);
          return;
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
          id: Math.random().toString(36).substr(2, 9),
          sku: row.SKU,
          name: row.Name,
          description: '', // No description field in CSV
          quantity: parseInt(row.Quantity) || 0,
          price: price,
          category: row['Product Category'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        inventoryItems.push(newItem);
        importedProducts.push(newItem);
      });

      // Delete the temporary file
      fs.unlinkSync(req.file.path);
      console.log(`Temporary file deleted: ${req.file.path}`);

      // Return the imported products
      console.log(`Import successful. Added ${importedProducts.length} products.`);
      res.status(201).json({
        message: `Successfully imported ${importedProducts.length} products`,
        products: importedProducts
      });
    })
    .on('error', (error) => {
      console.error('Error processing CSV:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      res.status(500).json({ message: `Error processing file: ${error.message}` });
    });
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