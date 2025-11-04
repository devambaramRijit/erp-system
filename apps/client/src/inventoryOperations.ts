import axios from 'axios';

// Interfaces for type safety
interface ActivityLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'increment' | 'decrement' | 'update' | 'add' | 'delete' | 'sale';
  previousQuantity?: number;
  newQuantity: number;
  timestamp: string;
  user: string;
  invoiceId?: string;
}

interface SalesRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  invoiceId: string;
}

interface MonthlySalesData {
  itemId: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
  month: string;
  year: string;
}

// Exported functions that can be used by other components
export const getMonthlySalesData = (itemId: string, month?: string, year?: string) => {
  const savedData = localStorage.getItem('inventoryMonthlySalesData');
  const monthlySalesData = savedData ? JSON.parse(savedData) : [];

  const now = new Date();
  const targetMonth = month || now.toLocaleString('default', { month: 'long' });
  const targetYear = year || now.getFullYear().toString();

  return monthlySalesData.find(
    data => data.itemId === itemId && data.month === targetMonth && data.year === targetYear
  );
};

export const getMonthlySalesReport = (month?: string, year?: string) => {
  const savedData = localStorage.getItem('inventoryMonthlySalesData');
  const monthlySalesData = savedData ? JSON.parse(savedData) : [];

  const now = new Date();
  const targetMonth = month || now.toLocaleString('default', { month: 'long' });
  const targetYear = year || now.getFullYear().toString();

  return monthlySalesData.filter(
    data => data.month === targetMonth && data.year === targetYear
  );
};

export const handleInvoiceItemAdd = async (itemId: string, quantity: number, invoiceId: string) => {
  try {
    const savedItems = localStorage.getItem('inventoryItemsWithProductType');
    const inventoryItems = savedItems ? JSON.parse(savedItems) : [];

    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) {
      console.error(`Item with ID ${itemId} not found`);
      return false;
    }

    if (item.quantity < quantity) {
      console.error(`Not enough stock for item ${item.name}. Available: ${item.quantity}, Requested: ${quantity}`);
      return false;
    }

    // Update inventory
    const newQuantity = item.quantity - quantity;
    await axios.put(`/api/inventory/${itemId}`, { 
      ...item, 
      quantity: newQuantity 
    });

    // Update local state
    const updatedItems = inventoryItems.map(i => 
      i.id === itemId ? { ...i, quantity: newQuantity } : i
    );
    localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));

    // Record the sale
    const savedSales = localStorage.getItem('inventorySalesRecords');
    const salesRecords = savedSales ? JSON.parse(savedSales) : [];

    const newSale = {
      id: Date.now().toString(),
      itemId,
      itemName: item.name,
      quantity,
      price: item.price,
      total: quantity * item.price,
      timestamp: new Date().toISOString(),
      invoiceId
    };

    const updatedSales = [newSale, ...salesRecords];
    localStorage.setItem('inventorySalesRecords', JSON.stringify(updatedSales));

    // Update monthly sales data
    const savedMonthlyData = localStorage.getItem('inventoryMonthlySalesData');
    const monthlySalesData = savedMonthlyData ? JSON.parse(savedMonthlyData) : [];

    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear().toString();

    const existingEntryIndex = monthlySalesData.findIndex(
      data => data.itemId === itemId && data.month === month && data.year === year
    );

    if (existingEntryIndex >= 0) {
      // Update existing entry
      const updatedData = [...monthlySalesData];
      updatedData[existingEntryIndex] = {
        ...updatedData[existingEntryIndex],
        quantitySold: updatedData[existingEntryIndex].quantitySold + quantity,
        revenue: updatedData[existingEntryIndex].revenue + (quantity * item.price)
      };
      localStorage.setItem('inventoryMonthlySalesData', JSON.stringify(updatedData));
    } else {
      // Create new entry
      const newEntry = {
        itemId,
        itemName: item.name,
        quantitySold: quantity,
        revenue: quantity * item.price,
        month,
        year
      };
      localStorage.setItem('inventoryMonthlySalesData', JSON.stringify([...monthlySalesData, newEntry]));
    }

    // Log the activity
    const savedLogs = localStorage.getItem('inventoryActivityLogs');
    const activityLogs = savedLogs ? JSON.parse(savedLogs) : [];

    const newLog = {
      id: Date.now().toString(),
      itemId,
      itemName: item.name,
      action: 'sale',
      previousQuantity: item.quantity,
      newQuantity: newQuantity,
      timestamp: new Date().toISOString(),
      user: 'Current User',
      invoiceId
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 100);
    localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));

    return true;
  } catch (error) {
    console.error('Error handling invoice item add:', error);
    return false;
  }
};

export const handleInvoiceItemRemove = async (itemId: string, quantity: number, invoiceId: string) => {
  try {
    const savedItems = localStorage.getItem('inventoryItemsWithProductType');
    const inventoryItems = savedItems ? JSON.parse(savedItems) : [];

    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) {
      console.error(`Item with ID ${itemId} not found`);
      return false;
    }

    // Update inventory (add back the quantity)
    const newQuantity = item.quantity + quantity;
    await axios.put(`/api/inventory/${itemId}`, { 
      ...item, 
      quantity: newQuantity 
    });

    // Update local state
    const updatedItems = inventoryItems.map(i => 
      i.id === itemId ? { ...i, quantity: newQuantity } : i
    );
    localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));

    // Remove the sales record
    const savedSales = localStorage.getItem('inventorySalesRecords');
    const salesRecords = savedSales ? JSON.parse(savedSales) : [];

    const updatedSales = salesRecords.filter(
      record => !(record.itemId === itemId && record.invoiceId === invoiceId)
    );
    localStorage.setItem('inventorySalesRecords', JSON.stringify(updatedSales));

    // Log the activity
    const savedLogs = localStorage.getItem('inventoryActivityLogs');
    const activityLogs = savedLogs ? JSON.parse(savedLogs) : [];

    const newLog = {
      id: Date.now().toString(),
      itemId,
      itemName: item.name,
      action: 'increment',
      previousQuantity: item.quantity,
      newQuantity: newQuantity,
      timestamp: new Date().toISOString(),
      user: 'Current User'
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 100);
    localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));

    return true;
  } catch (error) {
    console.error('Error handling invoice item remove:', error);
    return false;
  }
};
