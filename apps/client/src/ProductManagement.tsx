import React, { useState } from 'react';
import SecondProductListTab from './SecondProductListTab';
import InventoryScreen from './InventoryScreen';
import AdvancedInventoryTab from './AdvancedInventoryTab';

const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('standard');

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#2196F3', margin: '0 0 10px 0' }}>Product Management</h2>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('standard')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'standard' ? '#f1f1f1' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'standard' ? '2px solid #4CAF50' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'standard' ? 'bold' : 'normal',
            color: activeTab === 'standard' ? '#4CAF50' : '#666'
          }}
        >
          Standard Inventory
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'advanced' ? '#f1f1f1' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'advanced' ? '2px solid #FF9800' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'advanced' ? 'bold' : 'normal',
            color: activeTab === 'advanced' ? '#FF9800' : '#666'
          }}
        >
          Advanced Inventory
        </button>
      </div>

      <div>
        {activeTab === 'standard' && <SecondProductListTab />}
        {activeTab === 'advanced' && <AdvancedInventoryTab />}
      </div>
    </div>
  );
};

export default ProductManagement;