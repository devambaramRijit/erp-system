import React, { useState } from 'react';

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: '1',
      sku: 'ITEM001',
      name: 'Laptop Computer',
      description: 'High-performance laptop for business use',
      quantity: 15,
      price: 999.99,
      category: 'Electronics'
    },
    {
      id: '2',
      sku: 'ITEM002',
      name: 'Office Chair',
      description: 'Ergonomic office chair with lumbar support',
      quantity: 32,
      price: 249.99,
      category: 'Furniture'
    },
    {
      id: '3',
      sku: 'ITEM003',
      name: 'Wireless Mouse',
      description: 'Bluetooth wireless mouse with precision tracking',
      quantity: 75,
      price: 29.99,
      category: 'Electronics'
    },
    {
      id: '4',
      sku: 'ITEM004',
      name: 'Desk Lamp',
      description: 'LED desk lamp with adjustable brightness',
      quantity: 24,
      price: 49.99,
      category: 'Office Supplies'
    }
  ]);

  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    description: '',
    quantity: 0,
    price: 0,
    category: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity < 10).length;

  const handleAddItem = () => {
    if (!newItem.sku || !newItem.name || !newItem.category) {
      alert('Please fill in all required fields');
      return;
    }

    const itemToAdd: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...newItem
    };

    setInventoryItems([...inventoryItems, itemToAdd]);
    setNewItem({
      sku: '',
      name: '',
      description: '',
      quantity: 0,
      price: 0,
      category: ''
    });
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventoryItems(inventoryItems.filter(item => item.id !== id));
    }
  };

  const DashboardView = () => (
    <div>
      <h2>Dashboard Overview</h2>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
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

      <div style={{ marginBottom: '20px' }}>
        <h3>Recent Inventory Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>SKU</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Quantity</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Price</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.slice(0, 5).map(item => (
              <tr key={item.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.sku}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.quantity}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>${item.price.toFixed(2)}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const InventoryView = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Inventory Management</h2>
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
                    cursor: 'pointer',
                    marginRight: '5px'
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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>ErpSoul ERP System</h1>
          <p style={{ margin: 0, color: '#666' }}>Welcome, {user.name}</p>
        </div>
        <button 
          onClick={onLogout}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'dashboard' ? '#f0f0f0' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '2px solid #4CAF50' : 'none',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'inventory' ? '#f0f0f0' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid #4CAF50' : 'none',
            cursor: 'pointer'
          }}
        >
          Inventory Management
        </button>
      </div>

      {/* Main Content */}
      <div>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'inventory' && <InventoryView />}
      </div>
    </div>
  );
}
