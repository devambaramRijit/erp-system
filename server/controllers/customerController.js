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
    const { customerName, name, email, mobileNumber1, phone, houseNumber, address, city, state, country, pinCode, postalCode, district, company, taxId, notes, landmark } = req.body;

    // Validate required fields
    if (!customerName && !name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Create new customer in database
    const newCustomer = await db.Customer.create({
      name: customerName || name,
      email,
      phone: mobileNumber1 || phone,
      address: houseNumber || address,
      city,
      state,
      country,
      postalCode: pinCode || postalCode,
      district,
      company,
      taxId,
      notes,
      landmark
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    console.log('Update customer request body:', req.body);
    const { customerName, name, email, mobileNumber1, phone, houseNumber, address, city, state, country, pinCode, postalCode, district, company, taxId, notes, landmark } = req.body;

    // Find the customer in the database
    const customer = await db.Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customerName && !name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Update the customer
    await customer.update({
      name: customerName || name,
      email,
      phone: mobileNumber1 || phone,
      address: houseNumber || address,
      city,
      state,
      country,
      postalCode: pinCode || postalCode,
      district,
      company,
      taxId,
      notes,
      landmark
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer', error: error.message });
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

// Bulk update customers
exports.bulkUpdateCustomers = async (req, res) => {
  const customersToUpdate = req.body;
  if (!Array.isArray(customersToUpdate) || customersToUpdate.length === 0) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  let updatedCount = 0;
  const notFound = [];
  const errors = [];

  for (const customerData of customersToUpdate) {
    try {
      if (!customerData.phone) {
        notFound.push(customerData);
        continue;
      }

      const customer = await db.Customer.findOne({ where: { phone: customerData.phone } });

      if (customer) {
        await customer.update({
          name: customerData.name || customer.name,
          address: customerData.address || customer.address,
          city: customerData.city || customer.city,
          district: customerData.district || customer.district,
          state: customerData.state || customer.state,
          postalCode: customerData.postalCode || customer.postalCode,
          landmark: customerData.landmark || customer.landmark,
          mobileNumber2: customerData.mobileNumber2 || customer.mobileNumber2,
          source: customerData.source || customer.source,
        });
        updatedCount++;
      } else {
        notFound.push(customerData);
      }
    } catch (error) {
      errors.push({ customerData, error: error.message });
    }
  }

  res.status(200).json({
    message: `Bulk update completed. Updated ${updatedCount} customers.`,
    updatedCount,
    notFound: notFound.length,
    errors: errors.length,
    notFoundCustomers: notFound,
    errorDetails: errors,
  });
};


// Column mappings for Excel import
const columnMappings = {
  customerName: ['customerName', 'name', 'customer name', 'CUSTOMER NAME', 'Name'],
  mobileNumber1: ['mobileNumber1', 'phone', 'phone number', 'mobile', 'MOBILE NO.', 'Phone'],
  mobileNumber2: ['mobileNumber2', 'phone2', 'phone number 2', 'mobile2', 'MOBILE NO. 2', 'Alternate Phone'],
  email: ['email', 'e-mail', 'EMAIL', 'Email'],
  houseNumber: ['houseNumber', 'address', 'street', 'HOUSE NO./ FLAT NO./ STREET NO.', 'addressLine1', 'House Number'],
  city: ['city', 'town', 'CITY', 'CITY/TOWN/VILLAGE', 'City'],
  district: ['district', 'P.O/DISTRICT', 'District'],
  state: ['state', 'province', 'STATE', 'State'],
  country: ['country', 'nation', 'COUNTRY', 'Country'],
  postalCode: ['postalCode', 'postal code', 'zip', 'pincode', 'PIN CODE', 'pin code', 'PIN Code'],
  source: ['source', 'SOURCE', 'Source'],
  notes: ['notes', 'remarks', 'comments', 'Notes'],
  landmark: ['landmark', 'LANDMARK', 'Landmark']
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
  
  // Check for customerName
  if (!customer.customerName || customer.customerName.trim() === '') {
    errors.push('Customer name is required');
  }
  
  // Check for mobileNumber1
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
    customerName: ['customerName', 'name', 'customer name', 'Name'],
    mobileNumber1: ['mobileNumber1', 'phone', 'phone number', 'mobile', 'Phone', 'Mobile'],
    mobileNumber2: ['mobileNumber2', 'phone2', 'phone number 2', 'mobile2', 'Alternate Phone', 'Alternate Phone'],
    email: ['email', 'e-mail', 'Email'],
    houseNumber: ['houseNumber', 'house number', 'address', 'street', 'addressLine1', 'House Number'],
    city: ['city', 'town', 'City'],
    district: ['district', 'P.O/DISTRICT', 'District'],
    state: ['state', 'province', 'State'],
    country: ['country', 'nation', 'Country'],
    postalCode: ['postalCode', 'postal code', 'zip', 'pincode', 'pin code', 'PIN Code'],
    source: ['source', 'Source'],
    notes: ['notes', 'remarks', 'comments', 'Notes'],
    landmark: ['landmark', 'Landmark']
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
    console.log('Skipping row:');
    return null;
  }

  // Set default values for optional fields
  customer.country = customer.country || 'India';
  customer.source = customer.source || 'Direct';
  customer.notes = customer.notes || '';
  customer.landmark = customer.landmark || '';

  return customer;
};

// Import customers from Excel
// Bulk import customers from Excel - optimized for larger files
exports.bulkImportCustomersFromExcel = async (req, res) => {
  try {
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
        throw new Error(`Worksheet not found`);
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
        console.log(`Processing row :`, JSON.stringify(row, null, 2));

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
            address: customerData.houseNumber || '',
            city: customerData.city || '',
            state: customerData.state || '',
            country: customerData.country || 'India',
            postalCode: customerData.postalCode || '',
            district: customerData.district || '',
            notes: customerData.notes || '',
            landmark: customerData.landmark || ''
          });

          importedCustomers.push(newCustomer);
        } catch (error) {
          console.error(`Error creating customer for row :`, error.message);
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
        throw new Error(`Worksheet not found`);
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
      console.log(`Processing row :`, JSON.stringify(row, null, 2));

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
          address: customerData.houseNumber || '',
          city: customerData.city || '',
          state: customerData.state || '',
          country: customerData.country || 'India',
          postalCode: customerData.postalCode || '',
          district: customerData.district || '',
          notes: customerData.notes || '',
          landmark: customerData.landmark || ''
        });

        importedCustomers.push(newCustomer);
      } catch (error) {
        console.error(`Error creating customer for row :`, error.message);
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
