import { ActivityLog } from "../types/inventory";
import axios from "axios";

// Function to handle invoice finalization and create activity log entry
export const handleInvoiceFinalize = async (invoiceItems: any[], invoiceId: string, user = "Current User") => {
  try {
    // Get current inventory items from the correct source
    const savedItems = localStorage.getItem('erp_inventory');
    const inventoryItems = savedItems ? JSON.parse(savedItems) : [];

    // Get current activity logs
    const savedLogs = localStorage.getItem('inventoryActivityLogs');
    const activityLogs = savedLogs ? JSON.parse(savedLogs) : [];

    // Calculate total amount of the invoice
    const totalAmount = invoiceItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);

    // Update inventory in database and localStorage
    const updatedInventoryItems = [...inventoryItems];
    for (const item of invoiceItems) {
      const itemIndex = updatedInventoryItems.findIndex(i => i.id === item.itemCode || i.id === item.id);
      if (itemIndex !== -1) {
        const currentItem = updatedInventoryItems[itemIndex];
        let newQuantity;

        if (currentItem.productType === 'Manufactured') {
          newQuantity = currentItem.quantity + item.quantity;
        } else {
          newQuantity = currentItem.quantity - item.quantity;
        }
        
        // Update in database
        await axios.put(`/api/inventory/${currentItem.id}`, { ...currentItem, quantity: newQuantity });
        
        // Update in localStorage
        updatedInventoryItems[itemIndex] = { ...currentItem, quantity: newQuantity };
      }
    }
    
    // Save updated inventory to the correct source in localStorage
    localStorage.setItem('erp_inventory', JSON.stringify(updatedInventoryItems));
    
    // Create a summary log entry for the finalized invoice
    const summaryLog: ActivityLog = {
      id: Date.now().toString(),
      itemId: invoiceId,
      itemName: `Invoice #${invoiceId}`,
      action: 'finalize',
      previousQuantity: 0,
      newQuantity: invoiceItems.length,
      timestamp: new Date().toISOString(),
      user,
      invoiceId
    };
    
    // Add individual item logs for each item in the invoice
    const itemLogs = invoiceItems.map((item: any) => {
      return {
        id: Date.now().toString() + '_' + item.id,
        itemId: item.itemCode || item.id,
        itemName: item.name || 'Unknown Item',
        action: 'sale' as const,
        previousQuantity: 0,
        newQuantity: item.quantity,
        timestamp: new Date().toISOString(),
        user,
        invoiceId
      };
    });
    
    // Add all logs to the activity logs
    const updatedLogs = [summaryLog, ...itemLogs, ...activityLogs].slice(0, 100);
    localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));

    // Dispatch event to update the UI
    window.dispatchEvent(new CustomEvent('inventoryUpdated', {
      detail: {
        updatedItems: updatedInventoryItems,
        activityLog: summaryLog
      }
    }));

    return true;
  } catch (error) {
    console.error('Error finalizing invoice:', error);
    return false;
  }
};
