import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FixedAddItemComponent from './FixedAddItemComponent';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  size: string;
  unit: string;
  quantity: number;
  price: number;
  productType: string;
  cpPerPiece: number;
  ratePerInch: number;
  createdAt: string;
  updatedAt: string;
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const savedItems = localStorage.getItem('inventoryItemsWithProductType');
    console.log('Loading from localStorage:', savedItems);
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<string[]>(() => {
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    return savedProductTypes ? JSON.parse(savedProductTypes) : ['Standard', 'Premium', 'Custom'];
  });
  const [showProductTypeDialog, setShowProductTypeDialog] = useState(false);
  const [newProductType, setNewProductType] = useState('');

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory');
      // Get existing items from localStorage to preserve productType values
      const existingItems = JSON.parse(localStorage.getItem('inventoryItemsWithProductType') || '[]');

      // Merge API data with localStorage data to preserve productType values
      const mergedItems = response.data.map((apiItem: any) => {
        const existingItem = existingItems.find((item: any) => item.id === apiItem.id);
        return {
          ...apiItem,
          productType: existingItem?.productType || apiItem.productType || '',
          cpPerPiece: existingItem?.cpPerPiece || 0,
          ratePerInch: existingItem?.ratePerInch || 0
        };
      });

      setInventoryItems(mergedItems);
      // Save to localStorage for tab switching persistence
      console.log('Saving merged items to localStorage:', mergedItems);
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(mergedItems));
      setError('');
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError('Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemAdded = (newItem: any) => {
    console.log('Adding new item with productType:', newItem);
    console.log('New item productType specifically:', newItem.productType);
    const updatedItems = [...inventoryItems, newItem];
    setInventoryItems(updatedItems);
    // Save updated items to localStorage
    console.log('Saving updated items to localStorage:', updatedItems);
    // Log each item's productType specifically
    updatedItems.forEach((item, index) => {
      console.log(`Item ${index} productType:`, item.productType);
    });
    localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        setInventoryItems(inventoryItems.filter(item => item.id !== id));
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      }
    }
  };

  const handleEditItem = (id: string) => {
    const itemToEdit = inventoryItems.find(item => item.id === id);
    if (itemToEdit) {
      // For now, we'll just log the edit request
      console.log('Edit item:', itemToEdit);
      alert('Edit functionality will be implemented in the next update');
    }
  };

  const handleAddProductType = () => {
    if (newProductType.trim() === '') {
      alert('Please enter a product type');
      return;
    }

    if (productTypes.includes(newProductType.trim())) {
      alert('Product type already exists');
      return;
    }

    const updatedProductTypes = [...productTypes, newProductType.trim()];
    setProductTypes(updatedProductTypes);
    localStorage.setItem('inventoryProductTypes', JSON.stringify(updatedProductTypes));
    setNewProductType('');
    setShowProductTypeDialog(false);
  };

  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity < 10).length;

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading inventory...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Inventory Management</h1>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <div style={{ marginRight: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', minWidth: '200px' }}>
          <h3>Total Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{inventoryItems.length}</p>
        </div>
        <div style={{ marginRight: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', minWidth: '200px' }}>
          <h3>Total Value</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>${totalValue.toFixed(2)}</p>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', minWidth: '200px' }}>
          <h3>Low Stock Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{lowStockItems}</p>
        </div>
      </div>

      <FixedAddItemComponent onItemAdded={handleItemAdded} />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>SKU</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Size</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Unit</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Quantity</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Price</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Product Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{item.sku}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{item.name}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{item.size}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{item.unit}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{item.quantity}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>${item.price.toFixed(2)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{item.productType}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <button
                    onClick={() => handleEditItem(item.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ffc107',
                      color: 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '5px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inventoryItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
          No inventory items found. Click "Add New Item" to add your first item.
        </div>
      )}

      {showProductTypeDialog && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '5px',
            width: '300px'
          }}>
            <h3 style={{ marginTop: '0' }}>Add New Product Type</h3>
            <input
              type="text"
              value={newProductType}
              onChange={(e) => setNewProductType(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
              placeholder="Enter product type"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowProductTypeDialog(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProductType}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryScreen;
