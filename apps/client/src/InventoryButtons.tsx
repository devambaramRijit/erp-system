// Fix for + and - buttons in inventory management

// This code snippet shows how to fix the + and - buttons to use localStorage
// instead of API calls

// For the - button:
const handleDecrement = (record: any, setInventoryItems: Function) => {
  if (record.quantity > 0) {
    // Update in shared data source
    const updatedItem = {
      ...record,
      quantity: record.quantity - 1
    };
    localStorageService.updateItem('inventory', record.id, updatedItem);

    // Update local state
    setInventoryItems(prevItems => 
      prevItems.map(item => 
        item.id === record.id ? updatedItem : item
      ));

    // Log activity
    logActivity(record.id, record.name, 'decrement', record.quantity, record.quantity - 1);
  }
};

// For the + button:
const handleIncrement = (record: any, setInventoryItems: Function) => {
  // Update in shared data source
  const updatedItem = {
    ...record,
    quantity: record.quantity + 1
  };
  localStorageService.updateItem('inventory', record.id, updatedItem);

  // Update local state
  setInventoryItems(prevItems => 
    prevItems.map(item => 
      item.id === record.id ? updatedItem : item
    ));

  // Log activity
  logActivity(record.id, record.name, 'increment', record.quantity, record.quantity + 1);
};