import React, { useState, useEffect } from 'react';
import { Card, Switch, Button, Space, message, Typography, Alert, Divider, Tag } from 'antd';
import { GoogleOutlined, CloudSyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { googleDriveSyncService, GoogleDriveSyncStatus } from '../services/googleDriveSyncService';

const { Title, Text, Paragraph } = Typography;

const GoogleDriveSettings: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState(googleDriveSyncService.getSyncStatus());
  const [isAvailable, setIsAvailable] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize Google Drive API
  useEffect(() => {
    const initializeGoogleAPIs = async () => {
      try {
        await googleDriveSyncService.initializeGapi();
        await googleDriveSyncService.initializeGis();
        setIsAvailable(true);
      } catch (error) {
        console.error('Failed to initialize Google APIs:', error);
        setIsAvailable(false);
      }
    };

    initializeGoogleAPIs();
  }, []);

  // Listen for status changes
  useEffect(() => {
    const handleStatusChange = () => {
      setSyncStatus(googleDriveSyncService.getSyncStatus());
    };

    googleDriveSyncService.onStatusChange(handleStatusChange);

    return () => {
      // Note: In a real app, you'd want to implement a way to remove the callback
    };
  }, []);

  // Listen for sync completion events
  useEffect(() => {
    const handleSyncCompleted = (event: CustomEvent) => {
      setSyncInProgress(false);
      setLastSyncResult({
        success: true,
        message: `Data successfully synced ${event.detail.direction === 'toGoogleDrive' ? 'to' : 'from'} Google Drive at ${new Date(event.detail.timestamp).toLocaleTimeString()}`
      });
    };

    window.addEventListener('googleDriveSyncCompleted', handleSyncCompleted as EventListener);

    return () => {
      window.removeEventListener('googleDriveSyncCompleted', handleSyncCompleted as EventListener);
    };
  }, []);

  // Handle authentication
  const handleAuthenticate = async () => {
    try {
      await googleDriveSyncService.authenticate();
      message.success('Successfully authenticated with Google Drive');
    } catch (error) {
      console.error('Authentication failed:', error);
      message.error('Failed to authenticate with Google Drive');
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    googleDriveSyncService.signOut();
    message.success('Signed out from Google Drive');
  };

  // Handle sync to Google Drive
  const handleSyncToGoogleDrive = async () => {
    setSyncInProgress(true);
    try {
      await googleDriveSyncService.syncToGoogleDrive();
      setLastSyncResult({
        success: true,
        message: 'Data successfully synced to Google Drive'
      });
    } catch (error) {
      console.error('Sync to Google Drive failed:', error);
      setLastSyncResult({
        success: false,
        message: 'Failed to sync data to Google Drive'
      });
    } finally {
      setSyncInProgress(false);
      setSyncStatus(googleDriveSyncService.getSyncStatus());
    }
  };

  // Handle sync from Google Drive
  const handleSyncFromGoogleDrive = async () => {
    setSyncInProgress(true);
    try {
      await googleDriveSyncService.syncFromGoogleDrive();
      setLastSyncResult({
        success: true,
        message: 'Data successfully synced from Google Drive'
      });
    } catch (error) {
      console.error('Sync from Google Drive failed:', error);
      setLastSyncResult({
        success: false,
        message: 'Failed to sync data from Google Drive'
      });
    } finally {
      setSyncInProgress(false);
      setSyncStatus(googleDriveSyncService.getSyncStatus());
    }
  };

  // Format last sync time
  const formatLastSyncTime = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    return new Date(syncStatus.lastSyncTime).toLocaleString();
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case GoogleDriveSyncStatus.NOT_AUTHENTICATED:
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case GoogleDriveSyncStatus.AUTHENTICATED:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case GoogleDriveSyncStatus.SYNCING:
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case GoogleDriveSyncStatus.ERROR:
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case GoogleDriveSyncStatus.SUCCESS:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (syncStatus.status) {
      case GoogleDriveSyncStatus.NOT_AUTHENTICATED:
        return 'Not authenticated';
      case GoogleDriveSyncStatus.AUTHENTICATED:
        return 'Authenticated';
      case GoogleDriveSyncStatus.SYNCING:
        return 'Syncing...';
      case GoogleDriveSyncStatus.ERROR:
        return 'Error';
      case GoogleDriveSyncStatus.SUCCESS:
        return 'Sync successful';
      default:
        return 'Unknown status';
    }
  };

  return (
    <Card
      title={
        <Space>
          <GoogleOutlined />
          Google Drive Synchronization
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      {!isAvailable ? (
        <Alert
          message="Google Drive API not available"
          description="Failed to initialize Google Drive API. Please check your internet connection and try again."
          type="error"
          showIcon
        />
      ) : (
        <>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Status:</Text>
              <div style={{ marginTop: 8 }}>
                <Space>
                  {getStatusIcon()}
                  <Text>{getStatusText()}</Text>
                  <Tag color={syncStatus.status === GoogleDriveSyncStatus.AUTHENTICATED ? 'green' : 'red'}>
                    {syncStatus.status === GoogleDriveSyncStatus.AUTHENTICATED ? 'Connected' : 'Disconnected'}
                  </Tag>
                </Space>
              </div>
            </div>

            <div>
              <Text strong>Last Sync:</Text>
              <div style={{ marginTop: 8 }}>
                <Text>{formatLastSyncTime()}</Text>
              </div>
            </div>

            <Divider />

            <div>
              <Text strong>Authentication:</Text>
              <div style={{ marginTop: 8 }}>
                {syncStatus.status === GoogleDriveSyncStatus.NOT_AUTHENTICATED ? (
                  <Button
                    type="primary"
                    icon={<GoogleOutlined />}
                    onClick={handleAuthenticate}
                  >
                    Connect to Google Drive
                  </Button>
                ) : (
                  <Space>
                    <Button
                      onClick={handleSignOut}
                      disabled={syncStatus.status === GoogleDriveSyncStatus.SYNCING}
                    >
                      Disconnect
                    </Button>
                    <Text>Connected to Google Drive</Text>
                  </Space>
                )}
              </div>
            </div>

            {syncStatus.status === GoogleDriveSyncStatus.AUTHENTICATED && (
              <>
                <Divider />

                <div>
                  <Text strong>Manual Sync:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<CloudSyncOutlined />}
                        onClick={handleSyncToGoogleDrive}
                        loading={syncInProgress}
                        disabled={syncStatus.status === GoogleDriveSyncStatus.SYNCING}
                      >
                        Sync to Google Drive
                      </Button>
                      <Button
                        onClick={handleSyncFromGoogleDrive}
                        loading={syncInProgress}
                        disabled={syncStatus.status === GoogleDriveSyncStatus.SYNCING}
                      >
                        Sync from Google Drive
                      </Button>
                    </Space>
                  </div>
                </div>
              </>
            )}

            {lastSyncResult && (
              <Alert
                style={{ marginTop: 16 }}
                message={lastSyncResult.message}
                type={lastSyncResult.success ? 'success' : 'error'}
                showIcon
                closable
                onClose={() => setLastSyncResult(null)}
              />
            )}

            <Divider />

            <div>
              <Paragraph>
                <Text strong>About Google Drive Sync:</Text>
                <br />
                Google Drive sync allows you to back up your ErpSoul data to your Google Drive account. 
                This provides an additional layer of backup and allows you to access your data from multiple devices.
                Your data is stored in a dedicated "ErpSoul Data" folder in your Google Drive.
              </Paragraph>
            </div>
          </Space>
        </>
      )}
    </Card>
  );
};

export default GoogleDriveSettings;
