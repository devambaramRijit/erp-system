import React, { useState } from 'react';
import SecondProductListTab from './SecondProductListTab';
import InventoryScreenWithFixedAdd from './InventoryScreenWithFixedAdd';
import AdvancedInventoryTab from './AdvancedInventoryTab';
import SimpleProductTab from './SimpleProductTab';

const ProductTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('first');
  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('first')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'first' ? '#f1f1f1' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'first' ? '2px solid #4CAF50' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'first' ? 'bold' : 'normal',
            color: activeTab === 'first' ? '#4CAF50' : '#666'
          }}
        >
          Standard Inventory
        </button>
        <button
          onClick={() => setActiveTab('second')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'second' ? '#f1f1f1' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'second' ? '2px solid #2196F3' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'second' ? 'bold' : 'normal',
            color: activeTab === 'second' ? '#2196F3' : '#666'
          }}
        >
          Product Management
        </button>
        <button
          onClick={() => setActiveTab('third')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'third' ? '#f1f1f1' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'third' ? '2px solid #FF9800' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'third' ? 'bold' : 'normal',
            color: activeTab === 'third' ? '#FF9800' : '#666'
          }}
        >
          Advanced Inventory
        </button>
        <button
          onClick={() => setActiveTab('fourth')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'fourth' ? '#f1f1f1' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'fourth' ? '2px solid #9C27B0' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'fourth' ? 'bold' : 'normal',
            color: activeTab === 'fourth' ? '#9C27B0' : '#666'
          }}
        >
          Simple View
        </button>
      </div>

      <div>
        {activeTab === 'first' && <InventoryScreenWithFixedAdd />}
        {activeTab === 'second' && <SecondProductListTab />}
        {activeTab === 'third' && <AdvancedInventoryTab />}
        {activeTab === 'fourth' && <SimpleProductTab />}
      </div>
    </div>
  );
};

export default ProductTabs;
