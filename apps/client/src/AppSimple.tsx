import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import InventoryScreen from './InventoryScreen';
import ProductManagementUpdated from './ProductManagementUpdated';
import InvoiceScreen from './InvoiceScreen';
import CustomerScreen from './CustomerScreen';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Check if user is authenticated
    axios.get('/api/auth/me', { withCredentials: true })
      .then(res => {
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, clear local user state
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>ErpSoul Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Welcome, {user.name}</span>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              Role: {user.role} | Email: {user.email}
            </div>
          </div>
          <button 
            onClick={handleLogout}
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
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        marginBottom: 20, 
        borderBottom: '1px solid #ddd',
        position: 'relative'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: activeTab === 'dashboard' ? '16px 24px' : '6px 24px',
            backgroundColor: activeTab === 'dashboard' ? 'white' : '#f9f9f9',
            border: activeTab === 'dashboard' ? '1px solid #ddd' : '1px solid transparent',
            borderBottom: activeTab === 'dashboard' ? '2px solid white' : '1px solid transparent',
            borderRadius: activeTab === 'dashboard' ? '6px 6px 0 0' : '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal',
            color: activeTab === 'dashboard' ? '#333' : '#666',
            boxShadow: activeTab === 'dashboard' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            position: 'relative',
            top: activeTab === 'dashboard' ? '1px' : '0',
            transition: 'all 0.2s ease',
            zIndex: activeTab === 'dashboard' ? '2' : '1'
          }}
          onMouseOver={(e) => {
            if (activeTab !== 'dashboard') {
              e.currentTarget.style.backgroundColor = '#f1f1f1';
              e.currentTarget.style.color = '#333';
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== 'dashboard') {
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.color = '#666';
            }
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: activeTab === 'inventory' ? '16px 24px' : '6px 24px',
            backgroundColor: activeTab === 'inventory' ? 'white' : '#f9f9f9',
            border: activeTab === 'inventory' ? '1px solid #ddd' : '1px solid transparent',
            borderBottom: activeTab === 'inventory' ? '2px solid white' : '1px solid transparent',
            borderRadius: activeTab === 'inventory' ? '6px 6px 0 0' : '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'inventory' ? 'bold' : 'normal',
            color: activeTab === 'inventory' ? '#333' : '#666',
            boxShadow: activeTab === 'inventory' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            position: 'relative',
            top: activeTab === 'inventory' ? '1px' : '0',
            transition: 'all 0.2s ease',
            zIndex: activeTab === 'inventory' ? '2' : '1'
          }}
          onMouseOver={(e) => {
            if (activeTab !== 'inventory') {
              e.currentTarget.style.backgroundColor = '#f1f1f1';
              e.currentTarget.style.color = '#333';
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== 'inventory') {
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.color = '#666';
            }
          }}
        >
          Product List Tab
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          style={{
            padding: activeTab === 'invoice' ? '16px 24px' : '6px 24px',
            backgroundColor: activeTab === 'invoice' ? 'white' : '#f9f9f9',
            border: activeTab === 'invoice' ? '1px solid #ddd' : '1px solid transparent',
            borderBottom: activeTab === 'invoice' ? '2px solid white' : '1px solid transparent',
            borderRadius: activeTab === 'invoice' ? '6px 6px 0 0' : '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'invoice' ? 'bold' : 'normal',
            color: activeTab === 'invoice' ? '#333' : '#666',
            boxShadow: activeTab === 'invoice' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            position: 'relative',
            top: activeTab === 'invoice' ? '1px' : '0',
            transition: 'all 0.2s ease',
            zIndex: activeTab === 'invoice' ? '2' : '1'
          }}
          onMouseOver={(e) => {
            if (activeTab !== 'invoice') {
              e.currentTarget.style.backgroundColor = '#f1f1f1';
              e.currentTarget.style.color = '#333';
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== 'invoice') {
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.color = '#666';
            }
          }}
        >
          Invoice Generation
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          style={{
            padding: activeTab === 'customers' ? '16px 24px' : '6px 24px',
            backgroundColor: activeTab === 'customers' ? 'white' : '#f9f9f9',
            border: activeTab === 'customers' ? '1px solid #ddd' : '1px solid transparent',
            borderBottom: activeTab === 'customers' ? '2px solid white' : '1px solid transparent',
            borderRadius: activeTab === 'customers' ? '6px 6px 0 0' : '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'customers' ? 'bold' : 'normal',
            color: activeTab === 'customers' ? '#333' : '#666',
            boxShadow: activeTab === 'customers' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            position: 'relative',
            top: activeTab === 'customers' ? '1px' : '0',
            transition: 'all 0.2s ease',
            zIndex: activeTab === 'customers' ? '2' : '1'
          }}
          onMouseOver={(e) => {
            if (activeTab !== 'customers') {
              e.currentTarget.style.backgroundColor = '#f1f1f1';
              e.currentTarget.style.color = '#333';
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== 'customers') {
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.color = '#666';
            }
          }}
        >
          Customer Management
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <Dashboard user={user} onLogout={handleLogout} />}
        {activeTab === 'inventory' && <ProductManagementUpdated />}
        {activeTab === 'invoice' && <InvoiceScreen />}
        {activeTab === 'customers' && <CustomerScreen />}
      </div>
    </div>
  );
}

export default App;