import axios from "axios";
import { load, save } from "../utils/storage";
import { dispatchInventoryUpdate } from "../utils/events";
import { InventoryItem, SaleRecord, ActivityLog, MonthlySalesData } from "../types/inventory";

const INVENTORY_KEY = "inventoryItemsWithProductType";
const SALES_KEY = "inventorySalesRecords";
const MONTHLY_KEY = "inventoryMonthlySalesData";
const LOGS_KEY = "inventoryActivityLogs";

export const handleInvoiceItemAdd = async (itemId: string, quantity: number, invoiceId: string, user = "Current User") => {
  try {
    const inventoryItems = load<InventoryItem[]>(INVENTORY_KEY, []);
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) throw new Error(`Item with ID ${itemId} not found`);
    if (item.quantity < quantity) throw new Error(`Not enough stock for ${item.name}`);

    // Update inventory
    const newQuantity = item.quantity - quantity;
    await axios.put(`/api/inventory/${itemId}`, { ...item, quantity: newQuantity });
    const updatedItems = inventoryItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
    save(INVENTORY_KEY, updatedItems);

    // Add sales record
    const salesRecords = load<SaleRecord[]>(SALES_KEY, []);
    const newSale: SaleRecord = {
      id: Date.now().toString(),
      itemId, itemName: item.name, quantity,
      price: item.price, total: quantity * item.price,
      timestamp: new Date().toISOString(),
      invoiceId
    };
    save(SALES_KEY, [newSale, ...salesRecords]);

    // Update monthly data
    const monthlyData = load<MonthlySalesData[]>(MONTHLY_KEY, []);
    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear().toString();
    const idx = monthlyData.findIndex(d => d.itemId === itemId && d.month === month && d.year === year);

    if (idx >= 0) {
      monthlyData[idx].quantitySold += quantity;
      monthlyData[idx].revenue += quantity * item.price;
    } else {
      monthlyData.push({ itemId, itemName: item.name, quantitySold: quantity, revenue: quantity * item.price, month, year });
    }
    save(MONTHLY_KEY, monthlyData);

    // Log activity
    const logs = load<ActivityLog[]>(LOGS_KEY, []);
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      itemId, itemName: item.name, action: "sale",
      previousQuantity: item.quantity, newQuantity,
      timestamp: new Date().toISOString(),
      user, invoiceId
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    save(LOGS_KEY, updatedLogs);

    // Dispatch update
    dispatchInventoryUpdate({ updatedItems, activityLog: newLog });

    return true;
  } catch (err) {
    console.error("Error adding invoice item:", err);
    return false;
  }
};

export const handleInvoiceItemRemove = async (itemId: string, quantity: number, invoiceId: string, user = "Current User") => {
  try {
    const inventoryItems = load<InventoryItem[]>(INVENTORY_KEY, []);
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) throw new Error(`Item with ID ${itemId} not found`);

    // Update inventory (add back the quantity)
    const newQuantity = item.quantity + quantity;
    await axios.put(`/api/inventory/${itemId}`, { ...item, quantity: newQuantity });
    const updatedItems = inventoryItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
    save(INVENTORY_KEY, updatedItems);

    // Remove the sales record
    const salesRecords = load<SaleRecord[]>(SALES_KEY, []);
    const updatedSales = salesRecords.filter(record => !(record.itemId === itemId && record.invoiceId === invoiceId));
    save(SALES_KEY, updatedSales);

    // Update monthly sales data (subtract the quantity)
    const monthlyData = load<MonthlySalesData[]>(MONTHLY_KEY, []);
    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear().toString();
    const idx = monthlyData.findIndex(d => d.itemId === itemId && d.month === month && d.year === year);

    if (idx >= 0) {
      monthlyData[idx].quantitySold = Math.max(0, monthlyData[idx].quantitySold - quantity);
      monthlyData[idx].revenue = Math.max(0, monthlyData[idx].revenue - (quantity * item.price));
    }
    save(MONTHLY_KEY, monthlyData);

    // Log activity
    const logs = load<ActivityLog[]>(LOGS_KEY, []);
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      itemId, itemName: item.name, action: "increment",
      previousQuantity: item.quantity, newQuantity,
      timestamp: new Date().toISOString(),
      user, invoiceId
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    save(LOGS_KEY, updatedLogs);

    // Dispatch update
    dispatchInventoryUpdate({ updatedItems, activityLog: newLog });

    return true;
  } catch (err) {
    console.error("Error removing invoice item:", err);
    return false;
  }
};

export const getMonthlySalesData = (itemId: string, month?: string, year?: string) => {
  const monthlySalesData = load<MonthlySalesData[]>(MONTHLY_KEY, []);

  const now = new Date();
  const targetMonth = month || now.toLocaleString('default', { month: 'long' });
  const targetYear = year || now.getFullYear().toString();

  return monthlySalesData.find(
    data => data.itemId === itemId && data.month === targetMonth && data.year === targetYear
  );
};

export const getMonthlySalesReport = (month?: string, year?: string) => {
  const monthlySalesData = load<MonthlySalesData[]>(MONTHLY_KEY, []);

  const now = new Date();
  const targetMonth = month || now.toLocaleString('default', { month: 'long' });
  const targetYear = year || now.getFullYear().toString();

  return monthlySalesData.filter(
    data => data.month === targetMonth && data.year === targetYear
  );
};
