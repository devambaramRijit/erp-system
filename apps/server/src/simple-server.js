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
const host = process.env.HOST || 'localhost';

// Middleware
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON:', buf.toString());
      res.status(400).json({ error: 'Invalid JSON' });
      throw e;
    }
  }
}));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any origin
    return callback(null, true);
  },
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Load inventory data from file or use empty array
let inventoryItems = [];

// Function to save inventory data to file
function saveInventoryData() {
  fs.writeFileSync('inventory-data.json', JSON.stringify(inventoryItems, null, 2));
}

// Load inventory data from file if it exists
if (fs.existsSync('inventory-data.json')) {
  try {
    const data = fs.readFileSync('inventory-data.json', 'utf8');
    inventoryItems = JSON.parse(data);
  } catch (err) {
    console.error('Error loading inventory data:', err);
    inventoryItems = [];
  }
} else {
  // Create initial empty file
  saveInventoryData();
}

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

// Database health check endpoint
app.get('/api/health', (req, res) => {
  console.log('=== HEALTH CHECK REQUEST ===');

  try {
    // Check if customer data file exists and is readable
    const customerDataExists = fs.existsSync('customer-data.json');
    let customerDataHealthy = false;
    let customerDataSize = 0;

    if (customerDataExists) {
      try {
        const stats = fs.statSync('customer-data.json');
        customerDataSize = stats.size;
        customerDataHealthy = true;
      } catch (err) {
        console.error('Error checking customer data file stats:', err);
      }
    }

    // Check if inventory data file exists and is readable
    const inventoryDataExists = fs.existsSync('inventory-data.json');
    let inventoryDataHealthy = false;
    let inventoryDataSize = 0;

    if (inventoryDataExists) {
      try {
        const stats = fs.statSync('inventory-data.json');
        inventoryDataSize = stats.size;
        inventoryDataHealthy = true;
      } catch (err) {
        console.error('Error checking inventory data file stats:', err);
      }
    }

    // Return health status
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        customerData: {
          exists: customerDataExists,
          healthy: customerDataHealthy,
          size: customerDataSize,
          count: customers.length
        },
        inventoryData: {
          exists: inventoryDataExists,
          healthy: inventoryDataHealthy,
          size: inventoryDataSize,
          count: inventoryItems.length
        }
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('Health check result:', JSON.stringify(healthStatus, null, 2));
    console.log('=== END HEALTH CHECK REQUEST ===');

    res.json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    console.log('=== END HEALTH CHECK REQUEST ===');

    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Inventory routes
app.get('/api/inventory', (req, res) => {
  console.log('=== INVENTORY GET REQUEST ===');
  console.log('Returning inventory items:', JSON.stringify(inventoryItems, null, 2));
  console.log('=== END INVENTORY GET REQUEST ===\n');
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

  const newItem = {
    id: Math.random().toString(36).substr(2, 9),
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
    ratePerInch: Number(req.body.ratePerInch) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log('Created new item:', JSON.stringify(newItem, null, 2));

  inventoryItems.push(newItem);
  
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
  
  // Save to file
  saveInventoryData();
  

  

  
  res.status(201).json(newItem);
});

app.put('/api/inventory/:id', (req, res) => {
  const { sku, name, description, quantity, price, category, productType, costPricePerPiece, ratePerPiece, costPricePerInch, ratePerInch } = req.body;
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
    productType: productType || inventoryItems[itemIndex].productType || 'Traded',
    costPricePerPiece: costPricePerPiece !== undefined ? Number(costPricePerPiece) : (inventoryItems[itemIndex].costPricePerPiece !== undefined ? inventoryItems[itemIndex].costPricePerPiece : 0),
    ratePerPiece: ratePerPiece !== undefined ? Number(ratePerPiece) : (inventoryItems[itemIndex].ratePerPiece !== undefined ? inventoryItems[itemIndex].ratePerPiece : 0),
    costPricePerInch: costPricePerInch !== undefined ? Number(costPricePerInch) : (inventoryItems[itemIndex].costPricePerInch !== undefined ? inventoryItems[itemIndex].costPricePerInch : 0),
    ratePerInch: ratePerInch !== undefined ? Number(ratePerInch) : (inventoryItems[itemIndex].ratePerInch !== undefined ? inventoryItems[itemIndex].ratePerInch : 0),
    updatedAt: new Date().toISOString()
  };
  
  console.log('Updated item:', JSON.stringify(inventoryItems[itemIndex], null, 2));
  
  // Save to file
  saveInventoryData();

  res.json(inventoryItems[itemIndex]);
});

app.delete('/api/inventory/:id', (req, res) => {
  const itemIndex = inventoryItems.findIndex(item => item.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  inventoryItems.splice(itemIndex, 1);
  
  // Save to file
  saveInventoryData();
  
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

// Customer data storage
let customers = [];

// Function to save customer data to file
function saveCustomerData() {
  fs.writeFileSync('customer-data.json', JSON.stringify(customers, null, 2));
}

// Load customer data from file if it exists
if (fs.existsSync('customer-data.json')) {
  try {
    const data = fs.readFileSync('customer-data.json', 'utf8');
    customers = JSON.parse(data);
    console.log(`Loaded ${customers.length} customers from file`);
  } catch (err) {
    console.error('Error loading customer data:', err);
    customers = [];
  }
} else {
  // Create sample customer data
  customers = [
    {
      id: '1',
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
      id: '2',
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
      id: '3',
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
  ];

  // Save initial data
  saveCustomerData();
  console.log('Created initial customer data');
}

// Customer routes
app.get('/api/customers', (req, res) => {
  console.log('=== CUSTOMERS GET REQUEST ===');

  // Transform data to match client's expected format
  const transformedCustomers = customers.map(customer => ({
    id: customer.id,
    customerName: customer.name,
    mobileNumber1: customer.phone,
    email: customer.email,
    addressLine1: customer.address,
    city: customer.city,
    state: customer.state,
    country: customer.country,
    postalCode: customer.postalCode,
    company: customer.company,
    gstNumber: customer.taxId,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  }));

  console.log('Returning customers:', JSON.stringify(transformedCustomers, null, 2));
  console.log('=== END CUSTOMERS GET REQUEST ===');
  res.json(transformedCustomers);
});

app.get('/api/customers/:id', (req, res) => {
  const customer = customers.find(c => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // Transform data to match client's expected format
  const transformedCustomer = {
    id: customer.id,
    customerName: customer.name,
    mobileNumber1: customer.phone,
    email: customer.email,
    addressLine1: customer.address,
    city: customer.city,
    state: customer.state,
    country: customer.country,
    postalCode: customer.postalCode,
    company: customer.company,
    gstNumber: customer.taxId,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  };

  res.json(transformedCustomer);
});

app.post('/api/customers', (req, res) => {
  console.log('=== CUSTOMERS POST REQUEST ===');
  console.log('Received data:', JSON.stringify(req.body, null, 2));

  // Handle both client field names and internal field names
  const { 
    customerName, 
    name, 
    mobileNumber1, 
    phone, 
    email, 
    addressLine1, 
    address, 
    city, 
    state, 
    country, 
    postalCode, 
    company, 
    gstNumber, 
    taxId, 
    notes 
  } = req.body;

  // Use client field names if available, otherwise use internal field names
  const finalName = customerName || name;
  const finalPhone = mobileNumber1 || phone;
  const finalAddress = addressLine1 || address;
  const finalTaxId = gstNumber || taxId;

  if (!finalName) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const newCustomer = {
    id: Math.random().toString(36).substr(2, 9),
    name: finalName,
    email,
    phone: finalPhone,
    address: finalAddress,
    city,
    state,
    country,
    postalCode,
    company,
    taxId: finalTaxId,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  customers.push(newCustomer);
  saveCustomerData();

  console.log('Created new customer:', JSON.stringify(newCustomer, null, 2));
  console.log('=== END CUSTOMERS POST REQUEST ===');

  // Transform the response to match client's expected format
  const transformedCustomer = {
    id: newCustomer.id,
    customerName: newCustomer.name,
    mobileNumber1: newCustomer.phone,
    email: newCustomer.email,
    addressLine1: newCustomer.address,
    city: newCustomer.city,
    state: newCustomer.state,
    country: newCustomer.country,
    postalCode: newCustomer.postalCode,
    company: newCustomer.company,
    gstNumber: newCustomer.taxId,
    notes: newCustomer.notes,
    createdAt: newCustomer.createdAt,
    updatedAt: newCustomer.updatedAt
  };

  res.status(201).json(transformedCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  // Handle both client field names and internal field names
  const { 
    customerName, 
    name, 
    mobileNumber1, 
    phone, 
    email, 
    addressLine1, 
    address, 
    city, 
    state, 
    country, 
    postalCode, 
    company, 
    gstNumber, 
    taxId, 
    notes 
  } = req.body;

  const customerIndex = customers.findIndex(c => c.id === req.params.id);

  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // Use client field names if available, otherwise use internal field names
  const finalName = customerName || name;
  const finalPhone = mobileNumber1 || phone;
  const finalAddress = addressLine1 || address;
  const finalTaxId = gstNumber || taxId;

  if (!finalName) {
    return res.status(400).json({ message: 'Name is required' });
  }

  customers[customerIndex] = {
    ...customers[customerIndex],
    name: finalName,
    email,
    phone: finalPhone,
    address: finalAddress,
    city,
    state,
    country,
    postalCode,
    company,
    taxId: finalTaxId,
    notes,
    updatedAt: new Date().toISOString()
  };

  saveCustomerData();

  console.log('Updated customer:', JSON.stringify(customers[customerIndex], null, 2));

  // Transform the response to match client's expected format
  const updatedCustomer = customers[customerIndex];
  const transformedCustomer = {
    id: updatedCustomer.id,
    customerName: updatedCustomer.name,
    mobileNumber1: updatedCustomer.phone,
    email: updatedCustomer.email,
    addressLine1: updatedCustomer.address,
    city: updatedCustomer.city,
    state: updatedCustomer.state,
    country: updatedCustomer.country,
    postalCode: updatedCustomer.postalCode,
    company: updatedCustomer.company,
    gstNumber: updatedCustomer.taxId,
    notes: updatedCustomer.notes,
    createdAt: updatedCustomer.createdAt,
    updatedAt: updatedCustomer.updatedAt
  };

  res.json(transformedCustomer);
});

app.delete('/api/customers/:id', (req, res) => {
  const customerIndex = customers.findIndex(c => c.id === req.params.id);

  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customers.splice(customerIndex, 1);
  saveCustomerData();

  res.status(204).send();
});

// Import customers from Excel
app.post('/api/customers/import-excel', upload.single('file'), (req, res) => {
  console.log('Customer Excel import request received');

  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log(`File received: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);

  const importedCustomers = [];

  try {
    // Read Excel file
    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Excel parsing complete. Found ${data.length} rows.`);

    // Process the Excel data
    data.forEach((row, index) => {
      console.log(`Processing row ${index + 1}:`, JSON.stringify(row, null, 2));

      // Skip header row if it exists
      if (index === 0 && (row.Name || row.name || row.NAME)) {
        return;
      }

      // Validate required fields
      if (!row.Name && !row.name && !row.NAME) {
        console.log(`Skipping row ${index + 1}: Missing required field 'Name'`);
        return;
      }

      // Create new customer
      const newCustomer = {
        id: Math.random().toString(36).substr(2, 9),
        name: row.Name || row.name || row.NAME,
        email: row.Email || row.email || row.EMAIL,
        phone: row.Phone || row.phone || row.PHONE,
        address: row.Address || row.address || row.ADDRESS,
        city: row.City || row.city || row.CITY,
        state: row.State || row.state || row.STATE,
        country: row.Country || row.country || row.COUNTRY,
        postalCode: row['Postal Code'] || row.postalCode || row['POSTAL CODE'],
        company: row.Company || row.company || row.COMPANY,
        taxId: row['Tax ID'] || row.taxId || row['TAX ID'],
        notes: row.Notes || row.notes || row.NOTES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      customers.push(newCustomer);
      importedCustomers.push(newCustomer);
    });

    // Save to file
    saveCustomerData();

    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    console.log(`Temporary file deleted: ${req.file.path}`);

    // Transform the imported customers to match client's expected format
    const transformedImportedCustomers = importedCustomers.map(customer => ({
      id: customer.id,
      customerName: customer.name,
      mobileNumber1: customer.phone,
      email: customer.email,
      addressLine1: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      postalCode: customer.postalCode,
      company: customer.company,
      gstNumber: customer.taxId,
      notes: customer.notes,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }));

    // Return the imported customers
    console.log(`Import successful. Added ${importedCustomers.length} customers.`);
    res.status(201).json({
      message: `Successfully imported ${importedCustomers.length} customers`,
      customers: transformedImportedCustomers
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Delete the temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: `Error processing file: ${error.message}` });
  }
});

// Invoice data storage
let invoices = [];

// Function to save invoice data to file
function saveInvoiceData() {
  try {
    fs.writeFileSync('invoices-data.json', JSON.stringify(invoices, null, 2));
  } catch (error) {
    console.error('Error saving invoice data:', error);
    throw error;
  }
}

// Load invoice data from file if it exists
if (fs.existsSync('invoices-data.json')) {
  try {
    const data = fs.readFileSync('invoices-data.json', 'utf8');
    invoices = JSON.parse(data);
    console.log(`Loaded ${invoices.length} invoices from file`);
  } catch (err) {
    console.error('Error loading invoice data:', err);
    invoices = [];
  }
}

// Invoice routes
app.get('/api/invoices', (req, res) => {
  console.log('=== INVOICES GET REQUEST ===');
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
  console.log('Returning invoices:', JSON.stringify(parsedInvoices, null, 2));
  console.log('=== END INVOICES GET REQUEST ===');
  res.json(parsedInvoices);
});

app.get('/api/invoices/:id', (req, res) => {
  const invoice = invoices.find(inv => inv.id === req.params.id);
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
});

app.post('/api/invoices', (req, res) => {
  console.log('=== INVOICE POST REQUEST ===');
  console.log('Received data:', JSON.stringify(req.body, null, 2));
  
  // Check if invoice number already exists
  const existingInvoice = invoices.find(inv => inv.invoiceNumber === req.body.invoiceNumber);
  if (existingInvoice) {
    return res.status(400).json({ error: 'Invoice number already exists' });
  }
  
  const newInvoice = {
    id: Math.random().toString(36).substr(2, 9),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  invoices.push(newInvoice);
  saveInvoiceData();
  
  console.log('Created new invoice:', JSON.stringify(newInvoice, null, 2));
  console.log('=== END INVOICE POST REQUEST ===');
  
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id', (req, res) => {
  console.log('=== INVOICE UPDATE REQUEST ===');
  console.log('Invoice ID:', req.params.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  // Check if request body exists
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('No request body received');
    return res.status(400).json({ message: 'No invoice data provided' });
  }
  
  const invoiceIndex = invoices.findIndex(inv => inv.id === req.params.id);
  
  if (invoiceIndex === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  
  invoices[invoiceIndex] = {
    ...invoices[invoiceIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  saveInvoiceData();
  
  console.log('Updated invoice:', JSON.stringify(invoices[invoiceIndex], null, 2));
  
  res.json(invoices[invoiceIndex]);
});

app.delete('/api/invoices/:id', (req, res) => {
  const invoiceIndex = invoices.findIndex(inv => inv.id === req.params.id);
  
  if (invoiceIndex === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  
  invoices.splice(invoiceIndex, 1);
  saveInvoiceData();
  
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
  console.error('=== SERVER ERROR ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  console.error('Error Stack:', err.stack);
  console.error('Error Message:', err.message);
  console.error('=== END SERVER ERROR ===');

  // Determine error status code
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Not Found';
  }

  // Send error response
  res.status(statusCode).json({
    error: errorMessage,
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`=== REQUEST LOG ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Headers:`, req.headers);
  console.log(`Body: ${JSON.stringify(req.body)}`);
  console.log(`=== END REQUEST LOG ===`);
  next();
});

// 404 handler
app.use((req, res, next) => {
  console.log(`=== 404 NOT FOUND ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`=== END 404 NOT FOUND ===`);

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

app.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}`);
  console.log(`Health check endpoint: http://${host}:${port}/health`);
  console.log(`API endpoints: http://${host}:${port}/api`);
});