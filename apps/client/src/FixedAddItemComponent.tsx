import React, { useState } from 'react';
import axios from 'axios';

interface FixedAddItemProps {
  onItemAdded: (item: any) => void;
}

const FixedAddItemComponent: React.FC<FixedAddItemProps> = ({ onItemAdded }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    quantity: 0,
    price: 0,
    productType: 'Traded', // Default to Traded
    productCategory: 'General', // Default to General
    cpPerPiece: 0,
    ratePerInch: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: name === 'quantity' || name === 'price' || name === 'cpPerPiece' || name === 'ratePerInch' 
        ? Number(value) 
        : value
    });
  };

  const handleAddItem = async () => {
    // No validation - all fields are optional
    // Set default values for empty fields

    try {
      // Prepare item based on product category - only send fields the server expects
      // Set default values for empty fields
      const itemToSave = {
        sku: newItem.sku || 'SKU-' + Date.now(),
        name: newItem.name || 'Unnamed Item',
        quantity: newItem.quantity || 0,
        price: 0,
        productType: newItem.productType
      };

      // Set price based on product type and category
      if (newItem.productType === 'Manufactured' && newItem.productCategory === 'Laddu Gopal Base') {
        // For Laddu Gopal Base, price is CP per inch
        itemToSave.price = newItem.price || 0;
        itemToSave.costPricePerInch = newItem.price || 0;
        itemToSave.ratePerInch = newItem.ratePerInch || 0;
      } else {
        // For other types, set price to cpPerPiece
        itemToSave.price = newItem.cpPerPiece || 0;
      }

      // Log data being sent to backend
      console.log('Sending data to backend:', JSON.stringify(itemToSave, null, 2));
      
      const response = await axios.post('/api/inventory', itemToSave, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Log response from backend
      console.log('Response from backend:', JSON.stringify(response.data, null, 2));

      // Add the client-specific fields to the response
      const newItemWithClientFields = {
        ...response.data,
        productType: newItem.productType,
        ratePerInch: newItem.ratePerInch
      };

      onItemAdded(newItemWithClientFields);

      // Reset form
      setNewItem({
        sku: '',
        name: '',
        quantity: 0,
        price: 0,
        productType: '',
        productCategory: 'traded',
        cpPerPiece: 0,
        ratePerInch: 0,
      });

      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding item:', err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(`Failed to add item: ${err.response.data.message}`);
      } else {
        alert('Failed to add item');
      }
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        {showAddForm ? 'Cancel' : 'Add New Item'}
      </button>

      {showAddForm && (
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '20px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Add New Inventory Item</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>SKU</label>
              <input
                type="text"
                name="sku"
                value={newItem.sku}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                placeholder="Enter SKU"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Name</label>
              <input
                type="text"
                name="name"
                value={newItem.name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Product Category</label>
              <select
                name="productCategory"
                value={newItem.productCategory}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="traded">Traded</option>
                <option value="manufactured">Manufactured</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Product Type</label>
              <select
                name="productType"
                value={newItem.productType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="Traded">Traded</option>
                <option value="Manufactured">Manufactured</option>
              </select>
            </div>

            {newItem.productType === 'Manufactured' && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Product Category</label>
                <select
                  name="productCategory"
                  value={newItem.productCategory}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                >
                  <option value="">Select a category</option>
                  <option value="Laddu Gopal Base">Laddu Gopal Base</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}






            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={newItem.quantity}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                min="0"
              />
            </div>

            {newItem.productType === 'Manufactured' && newItem.productCategory === 'Laddu Gopal Base' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Cost Price per Inch</label>
                  <input
                    type="number"
                    name="price"
                    value={newItem.price}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Rate per Inch</label>
                  <input
                    type="number"
                    name="ratePerInch"
                    value={newItem.ratePerInch}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </>
            )}



            {(newItem.productType !== 'Manufactured' || newItem.productCategory !== 'Laddu Gopal Base') && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Cost Price Per Piece</label>
                <input
                  type="number"
                  name="cpPerPiece"
                  value={newItem.cpPerPiece}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedAddItemComponent;
