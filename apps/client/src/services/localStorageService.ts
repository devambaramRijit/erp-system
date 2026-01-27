// Local Storage Service for offline data management
class LocalStorageService {
  // Get all items from a collection
  getItems(collection: string): any[] {
    try {
      const items = localStorage.getItem(collection);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error(`Error getting items from ${collection}:`, error);
      return [];
    }
  }

  // Save items to a collection
  saveItems(collection: string, items: any[]): void {
    try {
      localStorage.setItem(collection, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving items to ${collection}:`, error);
    }
  }

  // Add a single item to a collection
  addItem(collection: string, item: any): void {
    const items = this.getItems(collection);
    items.push(item);
    this.saveItems(collection, items);
  }

  // Update an item in a collection
  updateItem(collection: string, id: string, updates: any): void {
    const items = this.getItems(collection);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.saveItems(collection, items);
    }
  }

  // Delete an item from a collection
  deleteItem(collection: string, id: string): void {
    const items = this.getItems(collection);
    const filtered = items.filter(item => item.id !== id);
    this.saveItems(collection, filtered);
  }

  // Clear all items from a collection
  clearCollection(collection: string): void {
    localStorage.removeItem(collection);
  }

  // Initialize default data if collection is empty
  initializeDefaults(collection: string, defaultData: any[]): void {
    if (!localStorage.getItem(collection)) {
      this.saveItems(collection, defaultData);
    }
  }
}

export const localStorageService = new LocalStorageService();
