export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  productType?: string;
  sku: string;
  size: string;
  unit: string;
  cpPerPiece: number;
  ratePerInch: number;
  costPricePerInch?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  invoiceId: string;
}

export interface MonthlySalesData {
  itemId: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
  month: string;
  year: string;
}

export interface ActivityLog {
  id: string;
  itemId: string;
  itemName: string;
  action: "sale" | "increment" | "decrement" | "update" | "add" | "delete";
  previousQuantity?: number;
  newQuantity: number;
  timestamp: string;
  user: string;
  invoiceId?: string;
}

export interface InventoryUpdateEvent {
  updatedItems: InventoryItem[];
  activityLog: ActivityLog;
}
