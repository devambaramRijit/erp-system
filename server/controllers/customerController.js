

const db = require('../models');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await db.Customer.findAll();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await db.Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, country, postalCode, company, taxId, notes } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Create new customer in database
    const newCustomer = await db.Customer.create({
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      company,
      taxId,
      notes
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, country, postalCode, company, taxId, notes } = req.body;

    // Find the customer in the database
    const customer = await db.Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Update the customer
    await customer.update({
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      company,
      taxId,
      notes
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deleted = await db.Customer.destroy({
      where: { id: req.params.id }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

// Column mappings for Excel import
const columnMappings = {
  customerName: ['customerName', 'name', 'customer name', 'CUSTOMER NAME'],
  mobileNumber1: ['mobileNumber1', 'phone', 'phone number', 'mobile', 'MOBILE NO.'],
  mobileNumber2: ['mobileNumber2', 'phone2', 'phone number 2', 'mobile2', 'MOBILE NO. 2'],
  email: ['email', 'e-mail', 'EMAIL'],
  addressLine1: ['addressLine1', 'address', 'street', 'HOUSE NO./ FLAT NO./ STREET NO.'],
  city: ['city', 'town', 'CITY', 'CITY/TOWN/VILLAGE'],
  state: ['state', 'province', 'STATE'],
  country: ['country', 'nation', 'COUNTRY'],
  postalCode: ['postalCode', 'postal code', 'zip', 'pincode', 'PIN CODE'],
  district: ['district', 'P.O/DISTRICT'],
  source: ['source', 'SOURCE'],
  notes: ['notes', 'remarks', 'comments', 'LANDMARK']
};

// Function to get the correct column name
const getColumnName = (header) => {
  const lowerHeader = header.toLowerCase().trim();
  for (const [field, variations] of Object.entries(columnMappings)) {
    if (variations.some(v => v.toLowerCase() === lowerHeader)) {
      return field;
    }
  }
  return null;
};

// Update the required fields validation
const validateCustomerData = (customer) => {
  const errors = [];
  
  // Check for customerName instead of Name
  if (!customer.customerName || customer.customerName.trim() === '') {
    errors.push('Customer name is required');
  }
  
  // Check for mobileNumber1 instead of Phone
  if (!customer.mobileNumber1 || customer.mobileNumber1.trim() === '') {
    errors.push('Phone number is required');
  }
  
  // Validate email format if provided
  if (customer.email && customer.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      errors.push('Invalid email format');
    }
  }
  
  return errors;
};

// Function to process customer data
const processCustomerData = (row) => {
  const customer = {};

  // Map fields with case-insensitive matching
  const fieldMappings = {
    customerName: ['customerName', 'name', 'customer name'],
    mobileNumber1: ['mobileNumber1', 'phone', 'phone number', 'mobile'],
    email: ['email', 'e-mail'],
    addressLine1: ['addressLine1', 'address', 'street'],
    city: ['city', 'town'],
    state: ['state', 'province'],
    country: ['country', 'nation'],
    postalCode: ['postalCode', 'postal code', 'zip', 'pincode']
  };
  
  // Process each field
  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();
    for (const [field, variations] of Object.entries(fieldMappings)) {
      if (variations.some(v => v.toLowerCase() === normalizedKey)) {
        customer[field] = String(value).trim();
        break;
      }
    }
  });
  
  // Validate the processed data
  const validationErrors = validateCustomerData(customer);
  if (validationErrors.length > 0) {
    console.log(`Skipping row: ${validationErrors.join(', ')}`);
    return null;
  }

  // Set default values for optional fields
  customer.country = customer.country || 'USA';
  customer.source = customer.source || 'Direct';
  customer.notes = customer.notes || '';

  return customer;
};

// Import customers from Excel
// Bulk import customers from Excel - optimized for larger files
exports.bulkImportCustomersFromExcel = async (req, res) => {
  try {
    console.log('Bulk customer Excel import request received');

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        message: 'No file uploaded',
        success: false
      });
    }

    console.log(`File received: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);

    const importedCustomers = [];
    const skippedRows = [];

    // Read Excel file
    let workbook, worksheet, data;
    try {
      workbook = xlsx.readFile(req.file.path);
      console.log('Workbook sheets:', workbook.SheetNames);

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in Excel file');
      }

      const sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Worksheet "${sheetName}" not found`);
      }

      data = xlsx.utils.sheet_to_json(worksheet);
      console.log(`Excel parsing complete. Found ${data.length} rows.`);

      if (data.length > 0) {
        console.log('First row data:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('No data rows found in Excel file');
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }

    // Process the Excel data with batch processing for better performance
    const batchSize = 100; // Process in batches of 100
    for (let batchStart = 0; batchStart < data.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, data.length);
      const batch = data.slice(batchStart, batchEnd);
      
      for (let index = batchStart; index < batchEnd; index++) {
        const row = data[index];
        console.log(`Processing row ${index + 1}:`, JSON.stringify(row, null, 2));

        // Process the customer data using our function
        const customerData = processCustomerData(row);

        if (!customerData) {
          skippedRows.push(index + 1);
          continue; // Skip invalid rows
        }

        // Create new customer in database
        try {
          const newCustomer = await db.Customer.create({
            name: customerData.customerName,
            email: customerData.email || '',
            phone: customerData.mobileNumber1,
            address: customerData.addressLine1 || '',
            city: customerData.city || '',
            state: customerData.state || '',
            country: customerData.country || 'USA',
            postalCode: customerData.postalCode || '',
            notes: customerData.notes || ''
          });

          importedCustomers.push(newCustomer);
        } catch (error) {
          console.error(`Error creating customer for row ${index + 1}:`, error.message);
          skippedRows.push(index + 1);
          // Continue with other items even if one fails
        }
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    console.log(`Temporary file deleted: ${req.file.path}`);

    // Return the imported customers
    console.log(`Bulk import successful. Added ${importedCustomers.length} customers.`);
    res.status(201).json({
      message: `Bulk import completed. Added ${importedCustomers.length} customers. Skipped ${skippedRows.length} rows.`,
      success: true,
      customers: importedCustomers,
      skippedRows: skippedRows
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      message: 'Bulk import failed: ' + error.message,
      success: false,
      error: error.message
    });
  }
};

exports.importCustomersFromExcel = async (req, res) => {
  try {
    console.log('Customer Excel import request received');

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ 
        message: 'No file uploaded',
        success: false
      });
    }

    console.log(`File received: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);

    const importedCustomers = [];
    const skippedRows = [];

    // Read Excel file
    let workbook, worksheet, data;
    try {
      workbook = xlsx.readFile(req.file.path);
      console.log('Workbook sheets:', workbook.SheetNames);

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in Excel file');
      }

      const sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Worksheet "${sheetName}" not found`);
      }

      data = xlsx.utils.sheet_to_json(worksheet);
      console.log(`Excel parsing complete. Found ${data.length} rows.`);

      if (data.length > 0) {
        console.log('First row data:', JSON.stringify(data[0], null, 2));
        if (data.length > 1) {
          console.log('Second row data:', JSON.stringify(data[1], null, 2));
        }
      } else {
        console.log('No data rows found in Excel file');
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }

    // Process the Excel data
    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      console.log(`Processing row ${index + 1}:`, JSON.stringify(row, null, 2));

      // Process the customer data using our new function
      const customerData = processCustomerData(row);

      if (!customerData) {
        skippedRows.push(index + 1);
        continue; // Skip invalid rows
      }

      // Create new customer in database
      try {
        const newCustomer = await db.Customer.create({
          name: customerData.customerName,
          email: customerData.email || '',
          phone: customerData.mobileNumber1,
          address: customerData.addressLine1 || '',
          city: customerData.city || '',
          state: customerData.state || '',
          country: customerData.country || 'USA',
          postalCode: customerData.postalCode || '',
          notes: customerData.notes || ''
        });

        importedCustomers.push(newCustomer);
      } catch (error) {
        console.error(`Error creating customer for row ${index + 1}:`, error.message);
        skippedRows.push(index + 1);
        // Continue with other items even if one fails
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    console.log(`Temporary file deleted: ${req.file.path}`);

    // Return the imported customers
    console.log(`Import successful. Added ${importedCustomers.length} customers.`);
    res.status(201).json({
      message: `Import completed. Added ${importedCustomers.length} customers. Skipped ${skippedRows.length} rows.`,
      success: true,
      customers: importedCustomers,
      skippedRows: skippedRows
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      message: 'Import failed: ' + error.message,
      success: false,
      error: error.message 
    });
  }
};

// Download customer template
exports.downloadCustomerTemplate = async (req, res) => {
  try {
    console.log('Template download request received');
    console.log('User session:', req.session.user);

    const templatePath = path.join(__dirname, '../templates/customer_template.csv');

    console.log('Template path:', templatePath);

    // Check if the template file exists
    if (!fs.existsSync(templatePath)) {
      console.error('Template file not found at:', templatePath);
      return res.status(404).json({ message: 'Template file not found' });
    }

    console.log('Template file found, sending response');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_template.csv');
    res.status(200).sendFile(templatePath);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: `Error generating template: ${error.message}` });
  }
};
