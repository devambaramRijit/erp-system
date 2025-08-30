const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

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
  const { sku, name, description, quantity, price, category } = req.body;

  if (!sku || !name || !category) {
    return res.status(400).json({ message: 'SKU, name, and category are required' });
  }

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