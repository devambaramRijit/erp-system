# How to Fix + and - Buttons in Inventory Management

## Problem
The + and - buttons in inventory management are not working because they're trying to make API calls instead of using localStorage.

## Solution
Replace the onClick handlers for the + and - buttons with these functions:

### For the - button (decrement):
```tsx
onClick={() => {
  if (quantity > 0) {
    // Update in shared data source
    const updatedItem = {
      ...record,
      quantity: quantity - 1
    };
    localStorageService.updateItem('inventory', record.id, updatedItem);

    // Update local state
    setInventoryItems(inventoryItems.map(item => 
      item.id === record.id ? updatedItem : item
    ));

    // Log activity
    logActivity(record.id, record.name, 'decrement', quantity, quantity - 1);
  }
}
```

### For the + button (increment):
```tsx
onClick={() => {
  // Update in shared data source
  const updatedItem = {
    ...record,
    quantity: quantity + 1
  };
  localStorageService.updateItem('inventory', record.id, updatedItem);

  // Update local state
  setInventoryItems(inventoryItems.map(item => 
    item.id === record.id ? updatedItem : item
  ));

  // Log activity
  logActivity(record.id, record.name, 'increment', quantity, quantity + 1);
}
```

## Files to Modify
1. `InventoryScreen.tsx` - Replace the onClick handlers for the + and - buttons in the table

## Key Changes
1. Remove API calls to `/api/inventory/${record.id}`
2. Add localStorage updates using `localStorageService.updateItem()`
3. Update local state to immediately reflect changes
4. Remove unnecessary `fetchInventoryItems()` calls