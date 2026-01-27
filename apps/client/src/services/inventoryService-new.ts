import { localStorageService } from './localStorageService';

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

class InventoryService {
  // Get all inventory items
  async getItems(): Promise<InventoryItem[]> {
    try {
      return localStorageService.getItems('inventory');
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
  }

  // Get a single item by ID
  async getItem(id: string): Promise<InventoryItem | null> {
    try {
      const items = localStorageService.getItems('inventory');
      return items.find((item: any) => item.id === id) || null;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      return null;
    }
  }

  // Get a single item by code
  async getItemByCode(code: string): Promise<InventoryItem | null> {
    try {
      const items = localStorageService.getItems('inventory');
      return items.find((item: any) => item.code === code) || null;
    } catch (error) {
      console.error('Error fetching inventory item by code:', error);
      return null;
    }
  }

  // Add a new item
  async addItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    try {
      const newItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorageService.addItem('inventory', newItem);
      return newItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Update an existing item
  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const updatedItem = {
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };

      localStorageService.updateItem('inventory', id, updatedItem);
      return updatedItem as InventoryItem;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Delete an item
  async deleteItem(id: string): Promise<void> {
    try {
      localStorageService.deleteItem('inventory', id);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Update quantities for multiple items
  async updateQuantities(updates: { id: string; quantity: number }[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.updateItem(update.id, { quantity: update.quantity });
      }
    } catch (error) {
      console.error('Error updating quantities:', error);
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
