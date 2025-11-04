

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

      // Simple header check - only skip if first row has no SL NO or CUSTOMER NAME
      if (index === 0 && !row["SL NO"] && !row["CUSTOMER NAME"]) {
        console.log(`Skipping header row ${index + 1}`);
        continue;
      }

      // Get customer name from various possible fields
      const customerName = row["CUSTOMER NAME"] || row.Name || row.name || row.NAME || row["CUSTOMERNAME"] || row["Customer Name"] || row["customer_name"];

      // Skip rows without any identifiable customer name or SL NO
      if (!customerName && !row["SL NO"]) {
        console.log(`Skipping row ${index + 1}: No customer data found`);
        continue;
      }

      // If we have SL NO but no name, use a default name
      const finalName = customerName || `Customer ${row["SL NO"] || index + 1}`;
      console.log(`Processing customer: ${finalName}`);

      // Create new customer in database
      try {
        const newCustomer = await db.Customer.create({
          name: finalName,
          email: row.Email || row.email || row.EMAIL,
          phone: row.Phone || row.phone || row.PHONE || row["MOBILE NO."] || row["MOBILE NO. 2"],
          address: row.Address || row.address || row.ADDRESS || row["HOUSE NO./ FLAT NO./ STREET NO."],
          city: row.City || row.city || row.CITY || row["CITY/TOWN/VILLAGE"],
          state: row.State || row.state || row.STATE,
          country: row.Country || row.country || row.COUNTRY,
          postalCode: row['Postal Code'] || row.postalCode || row['POSTAL CODE'] || row["PIN CODE"],
          company: row.Company || row.company || row.COMPANY,
          taxId: row['Tax ID'] || row.taxId || row['TAX ID'],
          notes: row.Notes || row.notes || row.NOTES || row.LANDMARK || row.SOURCE
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
