import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import InventoryScreen from './InventoryScreen';

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
      <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'dashboard' ? '#f8f9fa' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '2px solid #007bff' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'inventory' ? '#f8f9fa' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid #007bff' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'inventory' ? 'bold' : 'normal'
          }}
        >
          Inventory Management
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <Dashboard user={user} onLogout={handleLogout} />}
        {activeTab === 'inventory' && <InventoryScreen />}
      </div>
    </div>
  );
}

export default App;