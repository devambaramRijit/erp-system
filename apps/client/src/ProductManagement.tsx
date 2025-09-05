import React, { useState } from 'react';

import InventoryScreen from './InventoryScreen';


const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('simple');

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#2196F3', margin: '0 0 10px 0' }}>Product Management</h2>
      </div>



      <div>
        {activeTab === 'standard' && <InventoryScreen />}
      </div>
    </div>
  );
};

export default ProductManagement;