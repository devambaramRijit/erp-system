
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set correct API URL
axios.defaults.baseURL = 'http://192.168.0.107:3000/api';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import InventoryScreen from './InventoryScreen';
import ProductManagementUpdated from './ProductManagementUpdated';
import InvoiceScreen from './InvoiceScreen';
import InvoiceNavigation from './InvoiceNavigation';
import CustomerScreen from './CustomerScreen';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, message } from 'antd';
import MainLayout from './components/MainLayout';
import { DesignSystem, antdTheme } from './styles/DesignSystem';
import './styles/global.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Check if user is authenticated and fetch app data
    const checkAuth = async () => {
      try {
        setLoading(true);

        // First check if user is authenticated
        const authResponse = await axios.get('/api/auth/me', { withCredentials: true });
        if (authResponse.data.user) {
          setUser(authResponse.data.user);

          // Then fetch app data (products and customers)
          try {
            const appDataResponse = await axios.get('/api/auth/app-data', { withCredentials: true });

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
              const productsResponse = await axios.get('/api/inventory', { withCredentials: true });
              if (productsResponse.data) {
                localStorage.setItem('simpleInventoryProducts', JSON.stringify(productsResponse.data));
                window.dispatchEvent(new CustomEvent('productsUpdated'));
              }

              // Fetch customers directly
              const customersResponse = await axios.get('/api/customers', { withCredentials: true });
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
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);

      // Clear products and customers data from localStorage
      localStorage.removeItem('simpleInventoryProducts');
      localStorage.removeItem('customers');

      // Dispatch custom events to notify components
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      window.dispatchEvent(new CustomEvent('customersUpdated'));

      message.success('You have been successfully logged out');
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
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Loading ErpSoul...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ConfigProvider theme={antdTheme}>
        <DesignSystem>
          <LoginForm onLogin={handleLogin} />
        </DesignSystem>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <DesignSystem>
        <Router>
          <MainLayout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
              <Route path="/inventory" element={<ProductManagementUpdated />} />
              <Route path="/inventory-management" element={<InventoryScreen />} />
              <Route path="/invoice" element={<InvoiceNavigation />} />
              <Route path="/customers" element={<CustomerScreen />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </DesignSystem>
    </ConfigProvider>
  );
}

export default App;
