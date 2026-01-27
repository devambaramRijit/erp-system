import React, { useState } from 'react';

import InventoryScreen from './InventoryScreen';

import SimpleProductTab from './SimpleProductTab';

const ProductManagementUpdated: React.FC = () => {
  const [activeTab, setActiveTab] = useState('simple');

  return (
    <div style={{ width: '100%' }}>

      <div>
        {activeTab === 'standard' && <InventoryScreen />}
        {activeTab === 'simple' && <SimpleProductTab />}
      </div>
    </div>
  );
};

export default ProductManagementUpdated;