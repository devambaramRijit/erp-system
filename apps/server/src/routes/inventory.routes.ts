import { Router } from 'express';
import { InventoryItem } from '@shared/schema/inventory';

const router = Router();

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

export default router;