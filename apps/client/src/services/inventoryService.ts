import axios from 'axios';
import config from './config';

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  lastUpdated: string;
}

class InventoryService {
  private baseURL = '';
  private timeout = 10000;

  constructor() {
    // Set the base URL from config or default
    // Remove the trailing /api if it exists to avoid double /api in URLs
    this.baseURL = config.apiURL.replace(/\/api$/, '');
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

  // Get all inventory items
  async getInventoryItems(): Promise<InventoryItem[]> {
    // First try to get from localStorage
    const storedItems = localStorage.getItem('inventoryItemsWithProductType');
    if (storedItems) {
      try {
        return JSON.parse(storedItems);
      } catch (parseError) {
        console.error('Error parsing stored inventory items:', parseError);
      }
    }

    // If localStorage fails, try API
    try {
      const response = await this.get<InventoryItem[]>('/api/inventory');
      // Save to localStorage for future use
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Failed to fetch inventory from API:', error);
      return [];
    }
  }

  // Get a single inventory item by ID
  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    try {
      const response = await this.get<InventoryItem>(`/api/inventory/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch inventory item:', error);
      return null;
    }
  }

  // Add a new inventory item
  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    try {
      const newItem = {
        ...item,
        lastUpdated: new Date().toISOString()
      };

      const response = await this.post<InventoryItem>('/api/inventory', newItem);

      // Update localStorage
      await this.updateLocalStorageInventory();

      return response;
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      throw error;
    }
  }

  // Update an inventory item
  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const updateData = {
        ...item,
        lastUpdated: new Date().toISOString()
      };

      // Get items from localStorage first
      const storedItems = localStorage.getItem('inventoryItemsWithProductType');
      let items: InventoryItem[] = [];

      if (storedItems) {
        try {
          items = JSON.parse(storedItems);
        } catch (parseError) {
          console.error('Error parsing stored inventory items:', parseError);
        }
      }

      // Find the item in localStorage
      const itemIndex = items.findIndex(i => i.id === id);

      if (itemIndex !== -1) {
        // Update the item in localStorage
        items[itemIndex] = { ...items[itemIndex], ...updateData };
        localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(items));
        return items[itemIndex];
      }

      // If item not found in localStorage, try API
      try {
        const response = await this.put<InventoryItem>(`/api/inventory/${id}`, updateData);
        return response;
      } catch (apiError) {
        console.log('API not available and item not found in localStorage');
        throw new Error(`Item with id ${id} not found in localStorage and API unavailable`);
      }
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      throw error;
    }
  }

  // Delete an inventory item
  async deleteInventoryItem(id: string): Promise<void> {
    try {
      await this.delete(`/api/inventory/${id}`);

      // Update localStorage
      await this.updateLocalStorageInventory();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      throw error;
    }
  }

  // Update stock level for an item
  async updateStockLevel(itemCode: string, quantityChange: number): Promise<InventoryItem | null> {
    try {
      // Get items from localStorage
      let items: InventoryItem[] = [];
      try {
        const storedItems = localStorage.getItem('inventoryItemsWithProductType');
        if (storedItems) {
          items = JSON.parse(storedItems);
        }
      } catch (error) {
        console.error('Error parsing stored inventory items:', error);
      }

      // Find the item by item code
      let item = items.find(i => i.id === itemCode || i.itemCode === itemCode);

      if (!item) {
        // If item doesn't exist, create it in localStorage
        const newItem: InventoryItem = {
          id: itemCode,
          itemCode: itemCode,
          itemName: itemCode,
          category: 'General',
          unit: 'pcs',
          currentStock: quantityChange,
          minStockLevel: 0,
          maxStockLevel: 100,
          lastUpdated: new Date().toISOString()
        };

        // Add to localStorage
        items.push(newItem);
        localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(items));

        return newItem;
      }

      // Update existing item
      const updatedStock = item.currentStock + quantityChange;
      const updatedItem = {
        ...item,
        currentStock: updatedStock,
        lastUpdated: new Date().toISOString()
      };

      // Update localStorage directly
      const updatedItems = items.map(i => 
        i.id === item.id ? updatedItem : i
      );
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));

      // Skip API call to avoid connection errors
      console.log('Updated stock level in localStorage:', updatedItem.itemName, 'New stock:', updatedStock);

      return updatedItem;
    } catch (error) {
      console.error('Failed to update stock level:', error);
      // Don't throw the error, just return null to allow the process to continue
      return null;
    }
  }

  // Update localStorage with latest inventory data
  private async updateLocalStorageInventory(): Promise<void> {
    try {
      const items = await this.getInventoryItems();
      localStorage.setItem('inventory', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to update localStorage inventory:', error);
    }
  }

  // Initialize with sample data
  async initializeWithSampleData(): Promise<InventoryItem[]> {
    const sampleItems: InventoryItem[] = [
      {
        id: '1',
        itemCode: 'D0001',
        itemName: 'Sample Product 1',
        description: 'This is a sample product',
        category: 'Electronics',
        unit: 'pcs',
        currentStock: 10,
        minStockLevel: 5,
        maxStockLevel: 50,
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        itemCode: 'D0002',
        itemName: 'Sample Product 2',
        description: 'This is another sample product',
        category: 'Clothing',
        unit: 'pcs',
        currentStock: 20,
        minStockLevel: 10,
        maxStockLevel: 100,
        lastUpdated: new Date().toISOString()
      }
    ];

    try {
      localStorage.setItem('inventory', JSON.stringify(sampleItems));
      return sampleItems;
    } catch (error) {
      console.error('Error initializing sample inventory data:', error);
      return [];
    }
  }

  // Log activity for inventory items
  logActivity(
    itemId: string,
    itemName: string,
    action: 'increment' | 'decrement' | 'update' | 'add' | 'delete' | 'sale' | 'finalize',
    previousQuantity?: number,
    newQuantity?: number,
    invoiceId?: string
  ): void {
    try {
      // Get existing activity logs
      const savedLogs = localStorage.getItem('inventoryActivityLogs');
      const activityLogs = savedLogs ? JSON.parse(savedLogs) : [];

      // Create a properly formatted timestamp
      const now = new Date();
      const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

      const newLog = {
        id: Date.now().toString(),
        itemId,
        itemName,
        action,
        previousQuantity,
        newQuantity: newQuantity || 0,
        timestamp,
        user: 'Current User', // In a real app, this would be the logged-in user
        invoiceId
      };

      const updatedLogs = [newLog, ...activityLogs].slice(0, 100); // Keep only the last 100 logs
      localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
}

export const inventoryService = new InventoryService();
