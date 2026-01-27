import axios from '../api';
import { googleDriveSyncService } from './googleDriveSyncService';

// Sync frequency options in minutes
export enum SyncFrequency {
  NEVER = 'never',
  EVERY_5_MINUTES = '5',
  EVERY_15_MINUTES = '15',
  EVERY_30_MINUTES = '30',
  EVERY_HOUR = '60',
  MANUAL = 'manual'
}

// Data types that can be synced
export enum DataType {
  INVOICES = 'invoices',
  PRODUCTS = 'simpleInventoryProducts',
  CUSTOMERS = 'customers',
  PRODUCT_TYPES = 'inventoryProductTypes'
}

// Default settings
const DEFAULT_SYNC_SETTINGS = {
  autoSync: true,
  syncFrequency: SyncFrequency.EVERY_15_MINUTES,
  lastSyncTime: null,
  syncOnDataChange: true,
  dataTypesToSync: [
    DataType.INVOICES,
    DataType.PRODUCTS,
    DataType.CUSTOMERS,
    DataType.PRODUCT_TYPES
  ]
};

class DataSyncService {
  private syncInterval: number | null = null;
  private syncSettings = DEFAULT_SYNC_SETTINGS;
  private isOnline = navigator.onLine;

  constructor() {
    // Load settings from localStorage
    this.loadSettings();

    // Set up online/offline event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.syncSettings.autoSync) {
        this.syncToBackend();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Load sync settings from localStorage
  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('syncSettings');
      if (savedSettings) {
        this.syncSettings = { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Failed to load sync settings:', error);
    }
  }

  // Save sync settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem('syncSettings', JSON.stringify(this.syncSettings));
    } catch (error) {
      console.error('Failed to save sync settings:', error);
    }
  }

  // Get all sync settings
  getSettings() {
    return { ...this.syncSettings };
  }

  // Update sync settings
  updateSettings(newSettings: Partial<typeof DEFAULT_SYNC_SETTINGS>): void {
    this.syncSettings = { ...this.syncSettings, ...newSettings };
    this.saveSettings();

    // Restart auto-sync if needed
    if (this.syncSettings.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  // Start automatic synchronization
  startAutoSync(): void {
    this.stopAutoSync(); // Clear any existing interval

    if (!this.isOnline || this.syncSettings.syncFrequency === SyncFrequency.MANUAL) {
      return;
    }

    const intervalMs = parseInt(this.syncSettings.syncFrequency) * 60 * 1000;
    this.syncInterval = window.setInterval(async () => {
      if (this.isOnline) {
        try {
          await this.syncToBackend();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    }, intervalMs);
  }

  // Stop automatic synchronization
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get all relevant localStorage data
  private getAllLocalStorageData(): any {
    const data: any = {};

    // Only include data types that are marked for syncing
    this.syncSettings.dataTypesToSync.forEach(dataType => {
      const value = localStorage.getItem(dataType);
      if (value) {
        try {
          data[dataType] = JSON.parse(value);
        } catch (error) {
          console.error(`Failed to parse ${dataType} from localStorage:`, error);
        }
      }
    });

    return data;
  }

  // Send data to backend
  private async sendDataToBackend(data: any): Promise<void> {
    try {
      await axios.post('/sync/upload', data);
      this.syncSettings.lastSyncTime = new Date().toISOString();
      this.saveSettings();
    } catch (error) {
      console.error('Failed to send data to backend:', error);
      throw error;
    }
  }

  // Fetch data from backend
  private async fetchDataFromBackend(): Promise<any> {
    try {
      const response = await axios.get('/api/sync/download');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch data from backend:', error);
      throw error;
    }
  }

  // Update localStorage with backend data
  private updateLocalStorage(data: any): void {
    Object.keys(data).forEach(key => {
      if (this.syncSettings.dataTypesToSync.includes(key as DataType)) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    });

    // Dispatch events to notify components of data changes
    window.dispatchEvent(new CustomEvent('dataSynced', { detail: data }));
  }

  // Sync all localStorage data to backend
  async syncToBackend(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      const allData = this.getAllLocalStorageData();
      await this.sendDataToBackend(allData);
      this.syncSettings.lastSyncTime = new Date().toISOString();
      this.saveSettings();

      // Dispatch event to notify UI
      window.dispatchEvent(new CustomEvent('syncCompleted', {
        detail: { 
          direction: 'toBackend', 
          timestamp: this.syncSettings.lastSyncTime 
        }
      }));
    } catch (error) {
      console.error('Sync to backend failed:', error);
      throw error;
    }
  }

  // Sync data from backend to localStorage
  async syncFromBackend(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      const backendData = await this.fetchDataFromBackend();
      this.updateLocalStorage(backendData);
      this.syncSettings.lastSyncTime = new Date().toISOString();
      this.saveSettings();

      // Dispatch event to notify UI
      window.dispatchEvent(new CustomEvent('syncCompleted', {
        detail: { 
          direction: 'fromBackend', 
          timestamp: this.syncSettings.lastSyncTime 
        }
      }));
    } catch (error) {
      console.error('Sync from backend failed:', error);
      throw error;
    }
  }

  // Sync all localStorage data to Google Drive
  async syncToGoogleDrive(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      await googleDriveSyncService.syncToGoogleDrive();
      this.syncSettings.lastSyncTime = new Date().toISOString();
      this.saveSettings();

      // Dispatch event to notify UI
      window.dispatchEvent(new CustomEvent('syncCompleted', {
        detail: {
          direction: 'toGoogleDrive',
          timestamp: this.syncSettings.lastSyncTime
        }
      }));
    } catch (error) {
      console.error('Sync to Google Drive failed:', error);
      throw error;
    }
  }

  // Check if there are unsynced changes
  hasUnsyncedChanges(): boolean {
    if (!this.syncSettings.lastSyncTime) return true;

    // Get last modified timestamps for each data type
    const lastModified: Record<string, string> = {};

    this.syncSettings.dataTypesToSync.forEach(dataType => {
      const value = localStorage.getItem(`${dataType}_lastModified`);
      if (value) {
        lastModified[dataType] = value;
      }
    });

    // Check if any data type has been modified since last sync
    return Object.values(lastModified).some(
      timestamp => new Date(timestamp) > new Date(this.syncSettings.lastSyncTime!)
    );
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean;
    lastSyncTime: string | null;
    hasUnsyncedChanges: boolean;
    autoSyncEnabled: boolean;
  } {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.syncSettings.lastSyncTime,
      hasUnsyncedChanges: this.hasUnsyncedChanges(),
      autoSyncEnabled: this.syncSettings.autoSync
    };
  }

  // Initialize the service
  init(): void {
    if (this.syncSettings.autoSync) {
      this.startAutoSync();
    }
  }
}

// Create and export singleton instance
export const dataSyncService = new DataSyncService();
