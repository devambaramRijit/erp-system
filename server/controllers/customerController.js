
const db = require('../models');
const fs = require('fs');
const xlsx = require('xlsx');

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

// Import customers from Excel
exports.importCustomersFromExcel = async (req, res) => {
  try {
    console.log('Customer Excel import request received');

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log(`File received: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);

    const importedCustomers = [];

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Excel parsing complete. Found ${data.length} rows.`);

    // Process the Excel data
    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      console.log(`Processing row ${index + 1}:`, JSON.stringify(row, null, 2));

      // Skip header row if it exists (check for common header field names)
      if (index === 0 && (row.Name || row.name || row.NAME)) {
        continue;
      }

      // Validate required fields
      if (!row.Name && !row.name && !row.NAME) {
        console.log(`Skipping row ${index + 1}: Missing required field 'Name'`);
        continue;
      }

      // Create new customer in database
      try {
        const newCustomer = await db.Customer.create({
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
          notes: row.Notes || row.notes || row.NOTES
        });

        importedCustomers.push(newCustomer);
      } catch (error) {
        console.error(`Error creating customer for row ${index + 1}:`, error.message);
        // Continue with other items even if one fails
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    console.log(`Temporary file deleted: ${req.file.path}`);

    // Return the imported customers
    console.log(`Import successful. Added ${importedCustomers.length} customers.`);
    res.status(201).json({
      message: `Successfully imported ${importedCustomers.length} customers`,
      customers: importedCustomers
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ message: `Error processing file: ${error.message}` });
  }
};
