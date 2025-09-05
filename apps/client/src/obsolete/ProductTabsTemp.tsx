import React, { useState } from 'react';

import InventoryScreenWithFixedAdd from './InventoryScreenWithFixedAdd';

import SimpleProductTab from './SimpleProductTab';

const ProductTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fourth');
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#2196F3', margin: '0 0 10px 0' }}>Product Management</h2>
      </div>

      <div>
        {activeTab === 'first' && <InventoryScreenWithFixedAdd />}

        {activeTab === 'fourth' && <SimpleProductTab />}
      </div>
    </div>
  );
};

export default ProductTabs;
