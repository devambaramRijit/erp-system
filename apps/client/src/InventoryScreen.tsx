import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    description: '',
    quantity: 0,
    price: 0,
    category: ''
  });

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory');
      setInventoryItems(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError('Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.sku || !newItem.name || !newItem.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await axios.post('/api/inventory', newItem);
      setInventoryItems([...inventoryItems, response.data]);
      setNewItem({
        sku: '',
        name: '',
        description: '',
        quantity: 0,
        price: 0,
        category: ''
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item');
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
          <h3>Total Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{inventoryItems.length}</p>
        </div>
        <div style={{ 
          flex: 1, 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          borderLeft: '4px solid #FF9800'
        }}>
          <h3>Total Value</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>${totalValue.toFixed(2)}</p>
        </div>
        <div style={{ 
          flex: 1, 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          borderLeft: '4px solid #F44336'
        }}>
          <h3>Low Stock Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{lowStockItems}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>SKU</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Description</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Quantity</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Price</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Category</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map(item => (
            <tr key={item.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.sku}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.description}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.quantity}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>${item.price.toFixed(2)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.category}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
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
            overflowY: 'auto'
          }}>
            <h2>Add New Item</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label>SKU *</label>
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
                <label>Name *</label>
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
                <label>Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    minHeight: '80px'
                  }}
                />
              </div>
              <div>
                <label>Category *</label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
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
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Price</label>
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
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowAddForm(false)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryScreen;