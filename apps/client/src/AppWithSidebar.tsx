
import React, { useState, useEffect } from 'react';
import axios from './api';
import { dataSyncService } from './services/dataSyncService';
import { googleDriveSyncService } from './services/googleDriveSyncService';

import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import InventoryScreen from './InventoryScreen';
import ProductManagementUpdated from './ProductManagementUpdated';
import InvoiceScreen from './InvoiceScreen';
import InvoiceNavigation from './InvoiceNavigation';
import CustomerScreen from './CustomerScreen';
import SalesReportsScreen from './pages/SalesReportsScreen';
import InventoryReportScreen from './pages/InventoryReportScreen';
import ExpensesReportScreen from './pages/ExpensesReportScreen';
import EmployeesScreen from './pages/EmployeesScreen';
import ExpensesScreen from './pages/ExpensesScreen';
import InvoiceHistoryScreen from './pages/InvoiceHistoryScreen';
import InventoryHistoryScreen from './pages/InventoryHistoryScreen';
import UserSettings from './components/UserSettings';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarNavigation from './components/SidebarNavigation';
import DesignSystemProvider from './styles/DesignSystem';
import './styles/global.css';
import 'antd/dist/reset.css';



import AIAgent from './components/AIAgent';
import { Button } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

function AppWithSidebar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isAgentVisible, setIsAgentVisible] = useState(false);

  const handleCollapse = (isCollapsed: boolean) => {
    setCollapsed(isCollapsed);
  };

  const toggleAgent = () => {
    setIsAgentVisible(!isAgentVisible);
  };
  
  useEffect(() => {
    setLoading(true);
    const localUserRaw = localStorage.getItem('user');
    if (localUserRaw) {
      try {
        const localUser = JSON.parse(localUserRaw);
        setUser(localUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        setUser(null);
      }
    }
    setLoading(false);

    const checkAuth = async () => {
      try {
        // We don't need to setLoading(true) here, as we want to avoid a screen flash.
        // The app is already usable with local data.
        const authResponse = await axios.get('/auth/me');
        if (authResponse.data.user) {
          // Server confirmed auth, update user data and save it.
          setUser(authResponse.data.user);
          localStorage.setItem('user', JSON.stringify(authResponse.data.user));
        } else {
            // This case means server is running but says we are not authenticated.
            // This could be due to an expired session. So we log out.
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
      } catch (error: any) {
        // This will happen if we are offline.
        console.log('Authentication check with server failed (possibly offline):', error.message);
        // We don't do anything here, we just let the user continue with the local data.
      }
    };

    checkAuth();
    
    // Initialize the data sync service
    dataSyncService.init();
    
    // Initialize Google Drive service only when online
    if (navigator.onLine) {
      googleDriveSyncService.initializeGapi().then(() => {
        googleDriveSyncService.initializeGis();
      }).catch(error => {
        console.error('Failed to initialize Google Drive service:', error);
      });
    } else {
      console.log("Offline: Skipping Google Drive service initialization.");
    }
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
      await axios.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout API call failed (logging out locally anyway):', error);
    }
    
    setUser(null);

    // Clear all session-related data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('simpleInventoryProducts');
    localStorage.removeItem('customers');
    localStorage.removeItem('erp_inventory'); // Also clear this one to be safe

    // Dispatch custom events to notify components to clear their state
    window.dispatchEvent(new CustomEvent('productsUpdated'));
    window.dispatchEvent(new CustomEvent('customersUpdated'));

    message.success('You have been successfully logged out');
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
      <DesignSystemProvider>
        <LoginForm onLogin={handleLogin} />
      </DesignSystemProvider>
    );
  }

  return (
    <DesignSystemProvider>
      <Router>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <SidebarNavigation 
            user={user} 
            onLogout={handleLogout} 
            collapsed={collapsed}
            onCollapse={handleCollapse}
          />
          <main style={{ 
            flex: 1, 
            padding: '1rem', 
            background: '#f0f2f5', 
            marginLeft: collapsed ? 80 : 200,
            transition: 'margin-left 0.2s',
          }}>
            <div style={{ marginTop: 64, padding: '1rem' }}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
                <Route path="/inventory" element={<ProductManagementUpdated />} />
                <Route path="/inventory-management" element={<InventoryScreen />} />
                <Route path="/invoice" element={<InvoiceNavigation />} />
                <Route path="/invoice-history" element={<InvoiceHistoryScreen />} />
                <Route path="/customers" element={<CustomerScreen />} />
                <Route path="/reports" element={<SalesReportsScreen />} />
                <Route path="/reports/inventory" element={<InventoryReportScreen />} />
                <Route path="/reports/expenses" element={<ExpensesReportScreen />} />
                <Route path="/employees" element={<EmployeesScreen />} />
                <Route path="/expenses" element={<ExpensesScreen />} />
                <Route path="/inventory-history" element={<InventoryHistoryScreen />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </main>
          <Button
            type="primary"
            shape="circle"
            icon={<MessageOutlined />}
            size="large"
            onClick={toggleAgent}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 999
            }}
          />
          {isAgentVisible && <AIAgent />}
        </div>
      </Router>
    </DesignSystemProvider>
  );
}

export default AppWithSidebar;
