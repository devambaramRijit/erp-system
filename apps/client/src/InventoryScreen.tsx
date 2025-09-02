import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  size: string;
  unit: string;
  quantity: number;
  price: number;
  productType: string;
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<string[]>(() => {
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    return savedProductTypes ? JSON.parse(savedProductTypes) : ['Standard', 'Premium', 'Custom'];
  });
  const [showProductTypeDialog, setShowProductTypeDialog] = useState(false);
  const [newProductType, setNewProductType] = useState('');
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    size: '',
    unit: 'pieces',
    quantity: 0,
    price: 0,
    productType: '',  
  });

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
          productType: existingItem?.productType || apiItem.productType || ''
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

  const handleAddItem = async () => {
    if (!newItem.sku.trim() || !newItem.name.trim() || !newItem.size.trim() || !newItem.unit || newItem.quantity === null || newItem.quantity === undefined || newItem.price === null || newItem.price === undefined) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Ensure productType is included in the request
      const itemToSave = {
        ...newItem,
        productType: newItem.productType || ''
      };
      const response = await axios.post('/api/inventory', itemToSave, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // Ensure the response includes productType field
      const newItemWithProductType = {
        ...response.data,
        productType: response.data.productType || newItem.productType
      };
      console.log('Adding new item with productType:', newItemWithProductType);
      console.log('New item productType specifically:', newItemWithProductType.productType);
      const updatedItems = [...inventoryItems, newItemWithProductType];
      setInventoryItems(updatedItems);
      // Save updated items to localStorage
      console.log('Saving updated items to localStorage:', updatedItems);
      // Log each item's productType specifically
      updatedItems.forEach((item, index) => {
        console.log(`Item ${index} productType:`, item.productType);
      });
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));
      setNewItem({
        sku: '',
        name: '',
        size: '',
        unit: 'pieces',
        quantity: 0,
        price: 0,
        productType: ''
      });
      setEditingItemId(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding item:', err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(`Failed to add item: ${err.response.data.message}`);
      } else {
        alert('Failed to add item');
      }
    }
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
      setNewItem({
        sku: itemToEdit.sku,
        name: itemToEdit.name,
        size: itemToEdit.size,
        unit: itemToEdit.unit,
        quantity: itemToEdit.quantity,
        price: itemToEdit.price,
        productType: itemToEdit.productType || ''
      });
      setEditingItemId(id);
      setShowAddForm(true);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItemId || !newItem.sku.trim() || !newItem.name.trim() || !newItem.size.trim() || !newItem.unit || newItem.quantity === null || newItem.quantity === undefined || newItem.price === null || newItem.price === undefined) {
      alert('Please fill all required fields');
      return;
    }

    try {
      // Ensure productType is included in the request
      const itemToUpdate = {
        ...newItem,
        productType: newItem.productType || ''
      };
      const response = await axios.put(`/api/inventory/${editingItemId}`, itemToUpdate);
      // Ensure the response includes productType field
      const updatedItemWithProductType = {
        ...response.data,
        productType: response.data.productType || newItem.productType
      };
      console.log('Updating item with productType:', updatedItemWithProductType);
      console.log('Updated item productType specifically:', updatedItemWithProductType.productType);
      const updatedItems = inventoryItems.map(item => 
        item.id === editingItemId ? updatedItemWithProductType : item
      );
      setInventoryItems(updatedItems);
      // Save updated items to localStorage
      console.log('Saving updated items to localStorage:', updatedItems);
      // Log each item's productType specifically
      updatedItems.forEach((item, index) => {
        console.log(`Item ${index} productType:`, item.productType);
      });
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));
      setNewItem({
        sku: '',
        name: '',
        size: '',
        unit: 'pieces',
        quantity: 0,
        price: 0,
        productType: ''
      });
      setEditingItemId(null);
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error updating item:', err);
      alert(`Failed to update item: ${err.response.data.message}`);
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
    setNewItem({...newItem, productType: newProductType.trim()});
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
        <button 
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add New Item
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ 
          flex: 1, 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          borderLeft: '4px solid #2196F3'
        }}>
          <h3 style={{marginTop: '0', marginBottom: '10px', color: '#333'}}>Total Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#333' }}>{inventoryItems.length}</p>
        </div>
        <div style={{ 
          flex: 1, 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          borderLeft: '4px solid #FF9800'
        }}>
          <h3 style={{marginTop: '0', marginBottom: '10px', color: '#333'}}>Total Value</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#333' }}>₹{totalValue.toFixed(2)}</p>
        </div>
        <div style={{ 
          flex: 1, 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          borderLeft: '4px solid #F44336'
        }}>
          <h3 style={{marginTop: '0', marginBottom: '10px', color: '#333'}}>Low Stock Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#333' }}>{lowStockItems}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd', color: '#333' }}>SKU</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', color: '#333' }}>Name</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', color: '#333' }}>Size</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', color: '#333' }}>Unit</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', color: '#333' }}>Product Type</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', color: '#333' }}>CP per inch</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', color: '#333' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map(item => (
            <tr key={item.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.sku}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.size}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.unit}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.productType || '-'}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{item.price.toFixed(2)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <button 
                  onClick={() => handleEditItem(item.id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: 'white',
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
                    padding: '5px 10px',
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

      {/* Add Item Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            color: '#333'  // Add text color for better contrast
          }}>
            <h2 style={{color: '#333', marginTop: '0'}}>{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold'}}>SKU *</label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold'}}>Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold'}}>Size *</label>
                <input
                  type="text"
                  value={newItem.size}
                  onChange={(e) => setNewItem({...newItem, size: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold'}}>Unit *</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Liters (l)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="m">Meters (m)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="box">Boxes</option>
                    <option value="pack">Packs</option>
                    <option value="set">Sets</option>
                    <option value="dozen">Dozens</option>
                    <option value="inch">Inches</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold'}}>Product Type</label>
                <select
                  value={newItem.productType}
                  onChange={(e) => {
                    if (e.target.value === 'add_new') {
                      setShowProductTypeDialog(true);
                    } else {
                      setNewItem({...newItem, productType: e.target.value});
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select a product type</option>
                  {productTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="add_new">+ Add new product type</option>
                </select>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold'}}>CP per inch *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setEditingItemId(null);
                  setShowAddForm(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              {editingItemId ? (
                <button
                  onClick={handleUpdateItem}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Update Item
                </button>
              ) : (
                <button
                  onClick={handleAddItem}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add Item
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Product Type Dialog */}
      {showProductTypeDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            color: '#333'
          }}>
            <h2 style={{color: '#333', marginTop: '0'}}>Add New Product Type</h2>
            <div style={{ marginTop: '15px' }}>
              <label style={{display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold'}}>Product Type Name</label>
              <input
                type="text"
                value={newProductType}
                onChange={(e) => setNewProductType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter product type name"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setNewProductType('');
                  setShowProductTypeDialog(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProductType}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Product Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryScreen;