const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Customer } = require('./sqlite-server');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Customer import endpoint
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

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
          notes: row['Notes'] || row['notes'] || '',
          createdAt: new Date(),
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

module.exports = router;