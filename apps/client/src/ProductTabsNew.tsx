import React from 'react';
import SecondProductListTab from './SecondProductListTab';

const ProductTabs: React.FC = () => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#2196F3', margin: '0 0 10px 0' }}>Product Management</h2>
      </div>

      <div>
        <SecondProductListTab />
      </div>
    </div>
  );
};

export default ProductTabs;