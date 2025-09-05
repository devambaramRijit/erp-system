import { Router } from 'express';
import { InventoryItem } from '@shared/schema/inventory';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Mock inventory data
let inventoryItems: InventoryItem[] = [
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

// Get all inventory items
router.get('/', (req, res) => {
  res.json(inventoryItems);
});

// Get a specific inventory item by ID
router.get('/:id', (req, res) => {
  const item = inventoryItems.find(item => item.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  res.json(item);
});

// Add a new inventory item
router.post('/', (req, res) => {
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

  const newItem: InventoryItem = {
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

// Update an inventory item
router.put('/:id', (req, res) => {
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

// Delete an inventory item
router.delete('/:id', (req, res) => {
  const itemIndex = inventoryItems.findIndex(item => item.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }

  inventoryItems.splice(itemIndex, 1);
  res.status(204).send();
});

// Import products from Excel/CSV
router.post('/import-excel', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results: any[] = [];
  const importedProducts: InventoryItem[] = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      // Process the CSV data
      results.forEach((row, index) => {
        // Skip header row if it exists
        if (index === 0 && row.sku === 'SKU') return;
        
        // Validate required fields
        if (!row.sku || !row.name || !row['Product Type'] || !row['Product Category']) {
          console.log(`Skipping row ${index + 1}: Missing required fields`);
          return;
        }

        // Create new inventory item
        const newItem: InventoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          sku: row.sku,
          name: row.name,
          description: row.description || '',
          quantity: parseInt(row.quantity) || 0,
          price: parseFloat(row['Rate Per Piece']) || 0,
          category: row['Product Category'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        inventoryItems.push(newItem);
        importedProducts.push(newItem);
      });

      // Delete the temporary file
      fs.unlinkSync(req.file.path);

      // Return the imported products
      res.status(201).json({
        message: `Successfully imported ${importedProducts.length} products`,
        products: importedProducts
      });
    })
    .on('error', (error) => {
      console.error('Error processing CSV:', error);
      res.status(500).json({ message: 'Error processing file' });
    });
});

export default router;