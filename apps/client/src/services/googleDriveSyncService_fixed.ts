// Google Drive API integration for data synchronization
import { dataSyncService, DataType } from './dataSyncService';

// Google API configuration
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your actual API key
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your actual client ID
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// File metadata for our app data
const APP_DATA_FOLDER_NAME = 'ErpSoul Data';
const DATA_FILE_NAME = 'erp_data.json';

export enum GoogleDriveSyncStatus {
  NOT_AUTHENTICATED = 'not_authenticated',
  AUTHENTICATED = 'authenticated',
  SYNCING = 'syncing',
  ERROR = 'error',
  SUCCESS = 'success'
}

class GoogleDriveSyncService {
  private tokenClient: any = null;
  private gapiInited = false;
  private gisInited = false;
  private syncStatus: GoogleDriveSyncStatus = GoogleDriveSyncStatus.NOT_AUTHENTICATED;
  private lastSyncTime: string | null = null;
  private fileId: string | null = null;
  private statusChangeCallbacks: Array<(status: GoogleDriveSyncStatus) => void> = [];

  constructor() {
    this.loadSettings();
  }

  // Load settings from localStorage
  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('googleDriveSyncSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        this.lastSyncTime = parsedSettings.lastSyncTime;
        this.fileId = parsedSettings.fileId;
      }
    } catch (error) {
      console.error('Failed to load Google Drive sync settings:', error);
    }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem('googleDriveSyncSettings', JSON.stringify({
        lastSyncTime: this.lastSyncTime,
        fileId: this.fileId
      }));
    } catch (error) {
      console.error('Failed to save Google Drive sync settings:', error);
    }
  }

  // Register a callback to be notified when status changes
  onStatusChange(callback: (status: GoogleDriveSyncStatus) => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  // Notify all registered callbacks of status change
  private notifyStatusChange(): void {
    this.statusChangeCallbacks.forEach(callback => callback(this.syncStatus));
  }

  // Initialize Google APIs
  async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: [DISCOVERY_DOC],
            });
            this.gapiInited = true;
            this.maybeEnableButtons();
            resolve();
          } catch (error) {
            console.error('Error initializing GAPI client:', error);
            reject(error);
          }
        });
      };
      document.body.appendChild(script);
    });
  }

  // Initialize Google Identity Services
  async initializeGis(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        try {
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Will be set later
          });
          this.gisInited = true;
          this.maybeEnableButtons();
          resolve();
        } catch (error) {
          console.error('Error initializing GIS:', error);
          reject(error);
        }
      };
      document.body.appendChild(script);
    });
  }

  // Check if both APIs are ready
  private maybeEnableButtons(): void {
    if (this.gapiInited && this.gisInited) {
      // Check if user is already signed in
      this.checkAuthStatus();
    }
  }

  // Check if user is authenticated
  private async checkAuthStatus(): Promise<void> {
    try {
      const token = window.gapi.client.getToken();
      if (token) {
        this.syncStatus = GoogleDriveSyncStatus.AUTHENTICATED;
        this.notifyStatusChange();
        // Try to find existing file
        await this.findExistingFile();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.syncStatus = GoogleDriveSyncStatus.NOT_AUTHENTICATED;
      this.notifyStatusChange();
    }
  }

  // Find existing data file in Google Drive
  private async findExistingFile(): Promise<void> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${DATA_FILE_NAME}' and trashed=false`,
        fields: 'files(id, name, modifiedTime)',
      });

      if (response.result.files.length > 0) {
        this.fileId = response.result.files[0].id;
        this.saveSettings();
      }
    } catch (error) {
      console.error('Error finding existing file:', error);
    }
  }

  // Authenticate with Google
  async authenticate(): Promise<void> {
    if (!this.tokenClient) {
      throw new Error('Google Identity Services not initialized');
    }

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = async (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          try {
            await window.gapi.client.setToken(tokenResponse);
            this.syncStatus = GoogleDriveSyncStatus.AUTHENTICATED;
            this.notifyStatusChange();
            await this.findExistingFile();
            resolve();
          } catch (error) {
            console.error('Error setting token:', error);
            reject(error);
          }
        } else {
          reject(new Error('Authentication failed'));
        }
      };

      this.tokenClient.requestAccessToken();
    });
  }

  // Sign out from Google
  signOut(): void {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      this.syncStatus = GoogleDriveSyncStatus.NOT_AUTHENTICATED;
      this.fileId = null;
      this.notifyStatusChange();
      this.saveSettings();
    }
  }

  // Get all data to sync
  private getAllDataToSync(): any {
    const data: any = {};

    // Get data types from our main sync service
    const settings = dataSyncService.getSettings();
    settings.dataTypesToSync.forEach(dataType => {
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

  // Upload data to Google Drive
  async syncToGoogleDrive(): Promise<void> {
    if (this.syncStatus !== GoogleDriveSyncStatus.AUTHENTICATED) {
      throw new Error('Not authenticated with Google Drive');
    }

    this.syncStatus = GoogleDriveSyncStatus.SYNCING;
    this.notifyStatusChange();

    try {
      const data = this.getAllDataToSync();
      const jsonData = JSON.stringify(data);

      // If file exists, update it; otherwise create it
      if (this.fileId) {
        // Update existing file
        await window.gapi.client.drive.files.update({
          fileId: this.fileId,
          media: {
            mimeType: 'application/json',
            body: jsonData,
          },
        });
      } else {
        // Create new file
        // First, check if app folder exists
        let folderId = null;
        try {
          const folderResponse = await window.gapi.client.drive.files.list({
            q: `name='${APP_DATA_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id)',
          });

          if (folderResponse.result.files.length > 0) {
            folderId = folderResponse.result.files[0].id;
          } else {
            // Create folder
            const folderResponse = await window.gapi.client.drive.files.create({
              resource: {
                name: APP_DATA_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
              },
              fields: 'id',
            });
            folderId = folderResponse.result.id;
          }
        } catch (error) {
          console.error('Error creating/find folder:', error);
        }

        // Create file in folder
        const fileResponse = await window.gapi.client.drive.files.create({
          resource: {
            name: DATA_FILE_NAME,
            parents: folderId ? [folderId] : undefined,
          },
          media: {
            mimeType: 'application/json',
            body: jsonData,
          },
          fields: 'id',
        });

        this.fileId = fileResponse.result.id;
      }

      this.lastSyncTime = new Date().toISOString();
      this.saveSettings();
      this.syncStatus = GoogleDriveSyncStatus.SUCCESS;
      this.notifyStatusChange();

      // Dispatch event to notify UI
      window.dispatchEvent(new CustomEvent('googleDriveSyncCompleted', {
        detail: { 
          direction: 'toGoogleDrive', 
          timestamp: this.lastSyncTime 
        }
      }));

    } catch (error) {
      console.error('Error syncing to Google Drive:', error);
      this.syncStatus = GoogleDriveSyncStatus.ERROR;
      this.notifyStatusChange();
      throw error;
    }
  }

  // Download data from Google Drive
  async syncFromGoogleDrive(): Promise<void> {
    if (this.syncStatus !== GoogleDriveSyncStatus.AUTHENTICATED) {
      throw new Error('Not authenticated with Google Drive');
    }

    if (!this.fileId) {
      throw new Error('No data file found in Google Drive');
    }

    this.syncStatus = GoogleDriveSyncStatus.SYNCING;
    this.notifyStatusChange();

    try {
      // Download file
      const response = await window.gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media',
      });

      const data = JSON.parse(response.body);

      // Update localStorage with downloaded data
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, JSON.stringify(data[key]));
      });

      this.lastSyncTime = new Date().toISOString();
      this.saveSettings();
      this.syncStatus = GoogleDriveSyncStatus.SUCCESS;
      this.notifyStatusChange();

      // Dispatch events to notify components of data changes
      window.dispatchEvent(new CustomEvent('dataSynced', { detail: data }));

      // Dispatch event to notify UI
      window.dispatchEvent(new CustomEvent('googleDriveSyncCompleted', {
        detail: { 
          direction: 'fromGoogleDrive', 
          timestamp: this.lastSyncTime 
        }
      }));

    } catch (error) {
      console.error('Error syncing from Google Drive:', error);
      this.syncStatus = GoogleDriveSyncStatus.ERROR;
      this.notifyStatusChange();
      throw error;
    }
  }

  // Get current sync status
  getSyncStatus(): {
    status: GoogleDriveSyncStatus;
    lastSyncTime: string | null;
    fileId: string | null;
  } {
    return {
      status: this.syncStatus,
      lastSyncTime: this.lastSyncTime,
      fileId: this.fileId
    };
  }

  // Check if Google Drive sync is available
  isAvailable(): boolean {
    return this.gapiInited && this.gisInited;
  }
}

// Create and export singleton instance
export const googleDriveSyncService = new GoogleDriveSyncService();
