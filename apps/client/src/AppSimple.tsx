import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { checkServerHealth } from './services/config';

// Set correct API URL
axios.defaults.baseURL = 'http://localhost:3000/api';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import InventoryScreen from './InventoryScreen';
import ProductManagementUpdated from './ProductManagementUpdated';
import InvoiceScreen from './InvoiceScreen';
import InvoiceNavigation from './InvoiceNavigation';
import CustomerScreen from './CustomerScreen';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Check if user is authenticated and fetch app data
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if server is running
        const serverIsRunning = await checkServerHealth();
        if (!serverIsRunning) {
          console.error('Cannot connect to server. Please check if the server is running.');
          setLoading(false);
          return;
        }

        // First check if user is authenticated
        const authResponse = await axios.get('/auth/me', { withCredentials: true });
        if (authResponse.data.user) {
          setUser(authResponse.data.user);

          // Then fetch app data (products and customers)
          try {
            const appDataResponse = await axios.get('/auth/app-data', { withCredentials: true });

            // Store data in localStorage for offline access
            if (appDataResponse.data.products) {
              localStorage.setItem('simpleInventoryProducts', JSON.stringify(appDataResponse.data.products));
              // Dispatch custom event to notify SimpleProductTab component
              window.dispatchEvent(new CustomEvent('productsUpdated'));
            }

            if (appDataResponse.data.customers) {
              localStorage.setItem('customers', JSON.stringify(appDataResponse.data.customers));
              // Dispatch custom event to notify CustomerScreen component
              window.dispatchEvent(new CustomEvent('customersUpdated'));
            }
          } catch (appDataError) {
            console.error('Failed to fetch app data:', appDataError);
            // Try to fetch data directly from API endpoints if app-data fails
            try {
              // Fetch products directly
              const productsResponse = await axios.get('/inventory', { withCredentials: true });
              if (productsResponse.data) {
                localStorage.setItem('simpleInventoryProducts', JSON.stringify(productsResponse.data));
                window.dispatchEvent(new CustomEvent('productsUpdated'));
              }

              // Fetch customers directly
              const customersResponse = await axios.get('/customers', { withCredentials: true });
              if (customersResponse.data) {
                localStorage.setItem('customers', JSON.stringify(customersResponse.data));
                window.dispatchEvent(new CustomEvent('customersUpdated'));
              }
            } catch (directFetchError) {
              console.error('Failed to fetch data directly:', directFetchError);
            }
          }
        }
      } catch (error) {
        console.log('Authentication check failed:', error);
        setUser(null);
        // Continue with app initialization even without authentication
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Listen for authentication events and refresh data when needed
  useEffect(() => {
    const handleAuthRefresh = () => {
      checkAuth();
    };

    window.addEventListener('authRefresh', handleAuthRefresh);

    return () => {
      window.removeEventListener('authRefresh', handleAuthRefresh);
    };
  }, []);

  const handleLogin = (userData: any, products?: any[], customers?: any[]) => {
    setUser(userData);

    // Store products and customers data in localStorage for offline access
    if (products) {
      localStorage.setItem('simpleInventoryProducts', JSON.stringify(products));
      // Dispatch custom event to notify SimpleProductTab component
      window.dispatchEvent(new CustomEvent('productsUpdated'));
    }

    if (customers) {
      localStorage.setItem('customers', JSON.stringify(customers));
      // Dispatch custom event to notify CustomerScreen component
      window.dispatchEvent(new CustomEvent('customersUpdated'));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);

      // Clear products and customers data from localStorage
      localStorage.removeItem('simpleInventoryProducts');
      localStorage.removeItem('customers');

      // Dispatch custom events to notify components
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      window.dispatchEvent(new CustomEvent('customersUpdated'));
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, clear local user state
      setUser(null);

      // Still clear localStorage data
      localStorage.removeItem('simpleInventoryProducts');
      localStorage.removeItem('customers');

      // Dispatch custom events to notify components
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      window.dispatchEvent(new CustomEvent('customersUpdated'));
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
          onClick={() => {
            setActiveTab('inventory');
            // Trigger products refresh
            window.dispatchEvent(new CustomEvent('productsUpdated'));
          }}
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
          onClick={() => setActiveTab('inventory-management')}
          style={{
            padding: activeTab === 'inventory-management' ? '16px 24px' : '6px 24px',
            backgroundColor: activeTab === 'inventory-management' ? 'white' : '#f9f9f9',
            border: activeTab === 'inventory-management' ? '1px solid #ddd' : '1px solid transparent',
            borderBottom: activeTab === 'inventory-management' ? '2px solid white' : '1px solid transparent',
            borderRadius: activeTab === 'inventory-management' ? '6px 6px 0 0' : '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'inventory-management' ? 'bold' : 'normal',
            color: activeTab === 'inventory-management' ? '#333' : '#666',
            boxShadow: activeTab === 'inventory-management' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none',
            position: 'relative',
            top: activeTab === 'inventory-management' ? '1px' : '0',
            transition: 'all 0.2s ease',
            zIndex: activeTab === 'inventory-management' ? '2' : '1'
          }}
          onMouseOver={(e) => {
            if (activeTab !== 'inventory-management') {
              e.currentTarget.style.backgroundColor = '#f1f1f1';
              e.currentTarget.style.color = '#333';
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== 'inventory-management') {
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.color = '#666';
            }
          }}
        >
          Inventory Management
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
          onClick={() => {
            setActiveTab('customers');
            // Trigger customers refresh
            window.dispatchEvent(new CustomEvent('customersUpdated'));
          }}
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
        {activeTab === 'inventory-management' && <InventoryScreen />}
        {activeTab === 'invoice' && <InvoiceNavigation />}
        {activeTab === 'customers' && <CustomerScreen />}
      </div>
    </div>
  );
}

export default App;
