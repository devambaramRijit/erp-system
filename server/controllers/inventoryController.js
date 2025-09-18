const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const db = require('../models');

// Get all inventory items
exports.getAllInventory = async (req, res) => {
  try {
    const items = await db.Inventory.findAll();
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
};

// Get inventory item by ID
exports.getInventoryById = async (req, res) => {
  try {
    const item = await db.Inventory.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
};

// Create new inventory item
exports.createInventoryItem = async (req, res) => {
  try {
    const { sku, name, description, quantity, price, category } = req.body;

    // Validate required fields
    if (!sku || !name || !category) {
      return res.status(400).json({ message: 'SKU, name, and category are required' });
    }

    // Create new item in database
    const newItem = await db.Inventory.create({
      sku,
      name,
      description: description || '',
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
      category
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  try {
    const { sku, name, description, quantity, price, category } = req.body;

    // Find the item in the database
    const item = await db.Inventory.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!sku || !name || !category) {
      return res.status(400).json({ message: 'SKU, name, and category are required' });
    }

    // Update the item
    await item.update({
      sku,
      name,
      description: description || item.description,
      quantity: Number(quantity) || item.quantity,
      price: Number(price) || item.price,
      category
    });

    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    const deleted = await db.Inventory.destroy({
      where: { id: req.params.id }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};

// Import products from CSV
exports.importProductsFromCSV = async (req, res) => {
  try {
    console.log('CSV import request received');

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log(`File received: ${req.file.originalname}, size: ${req.file.size}, path: ${req.file.path}`);

    const results = [];
    const importedProducts = [];

    // Process CSV file
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
          .on('error', (error) => {
            reject(error);
          });
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

      // Create new inventory item in database
      try {
        const newItem = await db.Inventory.create({
          sku: row.SKU,
          name: row.Name,
          description: '', // No description field in CSV
          quantity: parseInt(row.Quantity) || 0,
          price: price,
          category: row['Product Category']
        });

        importedProducts.push(newItem);
      } catch (error) {
        console.error(`Error creating item for row ${index + 1}:`, error.message);
        // Continue with other items even if one fails
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
    res.status(500).json({ message: `Error processing file: ${error.message}` });
  }
};
