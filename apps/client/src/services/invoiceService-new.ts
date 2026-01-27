import { localStorageService } from './localStorageService';
import { inventoryService } from './inventoryService';
import config from './config';
import { ActivityLog, InventoryItem } from "../types/inventory";
import { load, save } from "../utils/storage";
import { dispatchInventoryUpdate } from "../utils/events";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

class InvoiceService {
  // Get all invoices
  async getInvoices(): Promise<Invoice[]> {
    try {
      return localStorageService.getItems('invoices');
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  // Get a single invoice by ID
  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const invoices = localStorageService.getItems('invoices');
      return invoices.find((invoice: any) => invoice.id === id) || null;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  // Add a new invoice
  async addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const newInvoice = {
        ...invoice,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorageService.addItem('invoices', newInvoice);

      // Update inventory stock levels if invoice is sent or paid
      if (newInvoice.status === 'sent' || newInvoice.status === 'paid') {
        await this.updateInventoryFromInvoice(newInvoice.items);
      }

      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Update an existing invoice
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const updatedInvoice = {
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };

      localStorageService.updateItem('invoices', id, updatedInvoice);

      // Update inventory stock levels if invoice status changed to sent or paid
      if (updatedInvoice.status === 'sent' || updatedInvoice.status === 'paid') {
        await this.updateInventoryFromInvoice(updatedInvoice.items);
      }

      return updatedInvoice as Invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Delete an invoice
  async deleteInvoice(id: string): Promise<void> {
    try {
      const invoice = await this.getInvoice(id);
      if (invoice) {
        // Restore inventory if invoice is deleted
        if (invoice.status === 'sent' || invoice.status === 'paid') {
          await this.restoreInventoryFromInvoice(invoice.items);
        }
        localStorageService.deleteItem('invoices', id);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Update inventory when invoice is created/updated
  private async updateInventoryFromInvoice(items: InvoiceItem[]) {
    try {
      for (const item of items) {
        const inventoryItem = await inventoryService.getItemByCode(item.itemCode);
        if (inventoryItem) {
          const newQuantity = inventoryItem.quantity - item.quantity;
          await inventoryService.updateItem(inventoryItem.id, {
            quantity: newQuantity
          });
        }
      }
    } catch (error) {
      console.error('Error updating inventory from invoice:', error);
    }
  }

  // Restore inventory when invoice is deleted
  private async restoreInventoryFromInvoice(items: InvoiceItem[]) {
    try {
      for (const item of items) {
        const inventoryItem = await inventoryService.getItemByCode(item.itemCode);
        if (inventoryItem) {
          const newQuantity = inventoryItem.quantity + item.quantity;
          await inventoryService.updateItem(inventoryItem.id, {
            quantity: newQuantity
          });
        }
      }
    } catch (error) {
      console.error('Error restoring inventory from invoice:', error);
    }
  }
}

export const invoiceService = new InvoiceService();
