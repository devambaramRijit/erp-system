import axios from 'axios';

// Set correct API URL
axios.defaults.baseURL = 'http://localhost:3000/api';
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
  private baseURL = '';
  private timeout = 10000;

  constructor() {
    // Set the base URL from config or default
    this.baseURL = config.apiURL;
  }

  // Generic request method with retry logic
  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await axios({
          method,
          url: `${this.baseURL}${url}`,
          data,
          timeout: this.timeout,
          withCredentials: true,
          ...config
        });

        return response.data;
      } catch (error) {
        retryCount++;
        console.log(`Request attempt ${retryCount} failed:`, error);

        if (retryCount >= maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries reached');
  }

  async get<T>(url: string, config?: any): Promise<T> {
    return this.request<T>('get', url, undefined, config);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('post', url, data, config);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('put', url, data, config);
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.request<T>('delete', url, undefined, config);
  }

  // Get all invoices
  async getInvoices(): Promise<Invoice[]> {
    try {
      // First try to get from API
      const response = await this.get<Invoice[]>('/invoices');
      return response;
    } catch (error) {
      console.error('Failed to fetch invoices from API, using localStorage:', error);

      // Fallback to localStorage
      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        try {
          return JSON.parse(storedInvoices);
        } catch (parseError) {
          console.error('Error parsing stored invoices:', parseError);
          return [];
        }
      }
      return [];
    }
  }

  // Get a single invoice by ID
  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const response = await this.get<Invoice>(`/invoices/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      return null;
    }
  }

  // Add a new invoice
  async addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const newInvoice = {
        ...invoice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await this.post<Invoice>('/invoices', newInvoice);

      // Update localStorage
      await this.updateLocalStorageInvoices();

      // Update inventory stock levels
      if (response.status === 'sent' || response.status === 'paid') {
        await this.updateInventoryFromInvoice(response.items);
      }

      return response;
    } catch (error) {
      console.error('Failed to add invoice:', error);
      throw error;
    }
  }

  // Update an invoice
  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      // Get the original invoice to compare items
      const originalInvoice = await this.getInvoice(id);

      const updateData = {
        ...invoice,
        updatedAt: new Date().toISOString()
      };

      const response = await this.put<Invoice>(`/invoices/${id}`, updateData);

      // Update localStorage
      await this.updateLocalStorageInvoices();

      // Update inventory stock levels if status changed to sent or paid
      if (originalInvoice && 
          (originalInvoice.status !== 'sent' && originalInvoice.status !== 'paid') && 
          (response.status === 'sent' || response.status === 'paid')) {
        await this.updateInventoryFromInvoice(response.items);
      }

      return response;
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw error;
    }
  }

  // Delete an invoice
  async deleteInvoice(id: string): Promise<void> {
    try {
      // Get the invoice before deleting to restore inventory
      const invoice = await this.getInvoice(id);

      await this.delete(`/invoices/${id}`);

      // Update localStorage
      await this.updateLocalStorageInvoices();

      // Restore inventory stock levels if invoice was sent or paid
      if (invoice && (invoice.status === 'sent' || invoice.status === 'paid')) {
        await this.restoreInventoryFromInvoice(invoice.items);
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      throw error;
    }
  }

  // Update inventory levels based on invoice items
  private async updateInventoryFromInvoice(items: InvoiceItem[]): Promise<void> {
    try {
      for (const item of items) {
        // Reduce stock for each item in the invoice
        await inventoryService.updateStockLevel(item.itemCode, -item.quantity);
      }
    } catch (error) {
      console.error('Failed to update inventory from invoice:', error);
      throw error;
    }
  }

  // Restore inventory levels when an invoice is deleted
  private async restoreInventoryFromInvoice(items: InvoiceItem[]): Promise<void> {
    try {
      for (const item of items) {
        // Increase stock for each item that was in the invoice
        await inventoryService.updateStockLevel(item.itemCode, item.quantity);
      }
    } catch (error) {
      console.error('Failed to restore inventory from invoice:', error);
      throw error;
    }
  }

  // Update localStorage with latest invoice data
  private async updateLocalStorageInvoices(): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      localStorage.setItem('invoices', JSON.stringify(invoices));
    } catch (error) {
      console.error('Failed to update localStorage invoices:', error);
    }
  }

  // Initialize with sample data
  async initializeWithSampleData(): Promise<Invoice[]> {
    const sampleInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-001',
        customerId: '1',
        customerName: 'John Doe',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            id: '1',
            invoiceId: '1',
            itemCode: 'D0001',
            itemName: 'Sample Product 1',
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200
          }
        ],
        subtotal: 200,
        tax: 20,
        total: 220,
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    try {
      localStorage.setItem('invoices', JSON.stringify(sampleInvoices));
      return sampleInvoices;
    } catch (error) {
      console.error('Error initializing sample invoice data:', error);
      return [];
    }
  }
}

// Function to handle invoice finalization and create activity log entry
export const handleInvoiceFinalize = async (invoiceItems: any[], invoiceId: string, user = "Current User") => {
  try {
    // Get current inventory items
    const inventoryItems = load<InventoryItem[]>('inventoryItemsWithProductType', []);
    
    // Get current activity logs
    const activityLogs = load<ActivityLog[]>('inventoryActivityLogs', []);
    
    // Create a summary log entry for the finalized invoice
    const summaryLog: ActivityLog = {
      id: Date.now().toString(),
      itemId: 'INVOICE_SUMMARY',
      itemName: `Invoice ${invoiceId}`,
      action: 'sale',
      previousQuantity: 0,
      newQuantity: invoiceItems.length,
      timestamp: new Date().toISOString(),
      user,
      invoiceId
    };
    
    // Add the summary log to the activity logs
    const updatedLogs = [summaryLog, ...activityLogs].slice(0, 100);
    save('inventoryActivityLogs', updatedLogs);
    
    // Dispatch event to update the UI
    dispatchInventoryUpdate({ 
      updatedItems: inventoryItems, 
      activityLog: summaryLog 
    });
    
    return true;
  } catch (error) {
    console.error('Error finalizing invoice:', error);
    return false;
  }
};

export const invoiceService = new InvoiceService();
