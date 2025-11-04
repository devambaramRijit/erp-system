const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize models
const db = require('./models');
const { Invoice, User, sequelize } = db;

// Configure session store
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
  expiration: 24 * 60 * 60 * 1000  // The maximum age (in milliseconds) of a valid session.
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
  },
  store: sessionStore
}));

// Fix the path to the client build directory
app.use(express.static(path.join(__dirname, '../apps/client/dist')));

// Import routes
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoice');
const inventoryRoutes = require('./routes/inventory');
const customerRoutes = require('./routes/customer');
const actionLogRoutes = require('./routes/actionLog');

// Sync database models
db.sequelize.sync({ force: false }).then(() => {
  console.log('Database synchronized');

  // Sync the session store
  sessionStore.sync();

  // Create a default admin user if none exists
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 8);

  User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    }
  }).then(([user, created]) => {
    if (created) {
      console.log('Default admin user created');
    } else {
      // Update the password for existing admin user to ensure it's correct
      user.update({ password: adminPassword });
      console.log('Admin user password updated');
    }
  });

  // Create initial inventory data if none exists
  const { Inventory } = db;

  // Check if we have any inventory items
  Inventory.count().then(count => {
    if (count === 0) {
      // Create sample inventory items
      Inventory.bulkCreate([
        {
          sku: 'ITEM001',
          name: 'Laptop Computer',
          description: 'High-performance laptop for business use',
          quantity: 15,
          price: 999.99,
          category: 'Electronics'
        },
        {
          sku: 'ITEM002',
          name: 'Office Chair',
          description: 'Ergonomic office chair with lumbar support',
          quantity: 32,
          price: 249.99,
          category: 'Furniture'
        },
        {
          sku: 'ITEM003',
          name: 'Wireless Mouse',
          description: 'Bluetooth wireless mouse with precision tracking',
          quantity: 75,
          price: 29.99,
          category: 'Electronics'
        },
        {
          sku: 'ITEM004',
          name: 'Desk Lamp',
          description: 'LED desk lamp with adjustable brightness',
          quantity: 24,
          price: 49.99,
          category: 'Office Supplies'
        }
      ]).then(() => {
        console.log('Initial inventory data created');
      }).catch(error => {
        console.error('Error creating initial inventory data:', error);
      });
    } else {
      console.log(`Found ${count} existing inventory items`);
    }
  }).catch(error => {
    console.error('Error checking inventory count:', error);
  });

  // Create initial customer data if none exists
  const { Customer } = db;

  // Check if we have any customers
  Customer.count().then(count => {
    if (count === 0) {
      // Create sample customers
      Customer.bulkCreate([
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          country: 'USA',
          postalCode: '12345',
          company: 'Doe Enterprises',
          taxId: 'TAX123456',
          notes: 'Regular customer, prefers email communication'
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '555-987-6543',
          address: '456 Oak Ave',
          city: 'Somewhere',
          state: 'NY',
          country: 'USA',
          postalCode: '67890',
          company: 'Smith & Co',
          taxId: 'TAX789012',
          notes: 'VIP customer, prefers phone communication'
        },
        {
          name: 'Robert Johnson',
          email: 'robert.j@example.com',
          phone: '555-456-7890',
          address: '789 Pine Rd',
          city: 'Elsewhere',
          state: 'TX',
          country: 'USA',
          postalCode: '54321',
          company: 'Johnson Inc',
          taxId: 'TAX345678',
          notes: 'New customer, potential for large orders'
        }
      ]).then(() => {
        console.log('Initial customer data created');
      }).catch(error => {
        console.error('Error creating initial customer data:', error);
      });
    } else {
      console.log(`Found ${count} existing customers`);
    }
  }).catch(error => {
    console.error('Error checking customer count:', error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to ERP Soul API' });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', inventoryRoutes); // Alias for inventory routes
app.use('/api/customers', customerRoutes);
app.use('/api/action-logs', actionLogRoutes);

// Debug: Log registered routes
console.log('Registered customer routes:');
const customerStack = customerRoutes.stack;
for (const layer of customerStack) {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods)
      .filter(method => layer.route.methods[method])
      .join(', ').toUpperCase();
    console.log(`${methods} /api/customers${layer.route.path}`);
  }
}

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
  console.log(`Customer routes available at: /api/customers`);
  console.log(`Template download endpoint: /api/customers/download-template`);
});
