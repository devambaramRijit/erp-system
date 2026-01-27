import React, { useState, useEffect } from 'react';
import { Card, Switch, Select, Button, Divider, Space, message, Row, Col, Typography, Tag, Alert, Tabs, Input, Upload, Form } from 'antd';
import { SyncOutlined, CloudSyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { dataSyncService, SyncFrequency, DataType } from '../services/dataSyncService';
import GoogleDriveSettings from './GoogleDriveSettings';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const UserSettings: React.FC = () => {
  const [settings, setSettings] = useState(dataSyncService.getSettings());
  const [syncStatus, setSyncStatus] = useState(dataSyncService.getSyncStatus());
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Invoice settings state
  const [invoiceSettings, setInvoiceSettings] = useState(() => {
    const savedSettings = localStorage.getItem('invoiceSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    // Default values
    return {
      sellerName: 'Pooja Kreations',
      sellerPhone: '9749928722',
      sellerAddress: {
        line1: 'Cinema Hall Road, Durgapur',
        line2: 'West Bengal, PIN - 713201',
        line3: '(near Shiv Mandir)'
      },
      companyLogo: '/pk-logo.png'
    };
  });

  // UI Settings state
  const [uiSettings, setUiSettings] = useState(() => {
    const saved = localStorage.getItem('uiSettings');
    return saved ? JSON.parse(saved) : { showDuplicateButton: true }; // Default to true
  });
  
  const [invoiceForm] = Form.useForm();
  const [logoFileList, setLogoFileList] = useState<any[]>([]);

  // Handler for changing UI settings
  const handleUiSettingChange = (key: string, value: any) => {
    const newUiSettings = { ...uiSettings, [key]: value };
    setUiSettings(newUiSettings);
    localStorage.setItem('uiSettings', JSON.stringify(newUiSettings));
    message.success('UI setting saved!');
  };

  // Update sync status periodically
  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(dataSyncService.getSyncStatus());
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for sync events
    const handleSyncCompleted = (event: CustomEvent) => {
      updateStatus();
      setLastSyncResult({
        success: true,
        message: `Data successfully synced ${event.detail.direction === 'toBackend' ? 'to' : 'from'} the server at ${new Date(event.detail.timestamp).toLocaleTimeString()}`
      });
    };

    window.addEventListener('syncCompleted', handleSyncCompleted as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('syncCompleted', handleSyncCompleted as EventListener);
    };
  }, []);

  // Handle setting changes
  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    dataSyncService.updateSettings(newSettings);
  };

  // Handle data type selection
  const handleDataTypeChange = (checkedValues: string[]) => {
    const newSettings = { ...settings, dataTypesToSync: checkedValues };
    setSettings(newSettings);
    dataSyncService.updateSettings(newSettings);
  };

  // Manual sync to backend
  const handleSyncToBackend = async () => {
    setSyncInProgress(true);
    try {
      await dataSyncService.syncToBackend();
      setLastSyncResult({
        success: true,
        message: 'Data successfully synced to the server'
      });
    } catch (error) {
      console.error('Manual sync failed:', error);
      setLastSyncResult({
        success: false,
        message: 'Failed to sync data to the server'
      });
    } finally {
      setSyncInProgress(false);
      setSyncStatus(dataSyncService.getSyncStatus());
    }
  };

  // Manual sync from backend
  const handleSyncFromBackend = async () => {
    setSyncInProgress(true);
    try {
      await dataSyncService.syncFromBackend();
      setLastSyncResult({
        success: true,
        message: 'Data successfully synced from the server'
      });
    } catch (error) {
      console.error('Manual sync failed:', error);
      setLastSyncResult({
        success: false,
        message: 'Failed to sync data from the server'
      });
    } finally {
      setSyncInProgress(false);
      setSyncStatus(dataSyncService.getSyncStatus());
    }
  };

  // Format last sync time
  const formatLastSyncTime = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    return new Date(syncStatus.lastSyncTime).toLocaleString();
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    if (syncStatus.hasUnsyncedChanges) {
      return <CloudSyncOutlined style={{ color: '#faad14' }} />;
    }
    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  };

  // Get status text
  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.hasUnsyncedChanges) return 'Changes pending sync';
    return 'All data synced';
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>User Settings</Title>
      <Tabs defaultActiveKey="sync" tabPosition="top">
        <TabPane tab="Data Sync" key="sync">

      {/* Sync Status Card */}
      <Card 
        title={
          <Space>
            <SyncOutlined />
            Data Synchronization Status
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Status:</Text>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    {getStatusIcon()}
                    <Text>{getStatusText()}</Text>
                  </Space>
                </div>
              </div>

              <div>
                <Text strong>Auto-sync:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={syncStatus.autoSyncEnabled ? 'green' : 'red'}>
                    {syncStatus.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                  </Tag>
                </div>
              </div>
            </Space>
          </Col>

          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Last Sync:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{formatLastSyncTime()}</Text>
                </div>
              </div>

              <div>
                <Text strong>Manual Sync:</Text>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<CloudSyncOutlined />}
                      onClick={handleSyncToBackend}
                      loading={syncInProgress}
                      disabled={!syncStatus.isOnline}
                    >
                      Sync to Server
                    </Button>
                    <Button 
                      onClick={handleSyncFromBackend}
                      loading={syncInProgress}
                      disabled={!syncStatus.isOnline}
                    >
                      Sync from Server
                    </Button>
                  </Space>
                </div>
              </div>
            </Space>
          </Col>
        </Row>

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
      </Card>

      {/* Sync Settings Card */}
      <Card title="Sync Settings" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Enable Auto-sync:</Text>
            <div style={{ marginTop: 8 }}>
              <Switch
                checked={settings.autoSync}
                onChange={(checked) => handleSettingChange('autoSync', checked)}
              />
              <Text style={{ marginLeft: 8 }}>
                Automatically sync data with the server
              </Text>
            </div>
          </div>

          <div>
            <Text strong>Sync Frequency:</Text>
            <div style={{ marginTop: 8 }}>
              <Select
                value={settings.syncFrequency}
                onChange={(value) => handleSettingChange('syncFrequency', value)}
                style={{ width: 200 }}
                disabled={!settings.autoSync}
              >
                <Option value={SyncFrequency.NEVER}>Never</Option>
                <Option value={SyncFrequency.MANUAL}>Manual Only</Option>
                <Option value={SyncFrequency.EVERY_5_MINUTES}>Every 5 minutes</Option>
                <Option value={SyncFrequency.EVERY_15_MINUTES}>Every 15 minutes</Option>
                <Option value={SyncFrequency.EVERY_30_MINUTES}>Every 30 minutes</Option>
                <Option value={SyncFrequency.EVERY_HOUR}>Every hour</Option>
              </Select>
            </div>
          </div>

          <div>
            <Text strong>Sync on Data Change:</Text>
            <div style={{ marginTop: 8 }}>
              <Switch
                checked={settings.syncOnDataChange}
                onChange={(checked) => handleSettingChange('syncOnDataChange', checked)}
                disabled={!settings.autoSync}
              />
              <Text style={{ marginLeft: 8 }}>
                Automatically sync when data is modified
              </Text>
            </div>
          </div>
        </Space>
      </Card>

      {/* Data Types to Sync Card */}
      <Card title="Data Types to Sync">
        <Text>Select which data types should be synchronized:</Text>
        <div style={{ marginTop: 16 }}>
          <Space wrap>
            {Object.values(DataType).map(dataType => (
              <Tag.CheckableTag
                key={dataType}
                checked={settings.dataTypesToSync.includes(dataType)}
                onChange={(checked) => {
                  const newValues = checked
                    ? [...settings.dataTypesToSync, dataType]
                    : settings.dataTypesToSync.filter(t => t !== dataType);
                  handleDataTypeChange(newValues);
                }}
              >
                {dataType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Tag.CheckableTag>
            ))}
          </Space>
        </div>
      </Card>
        </TabPane>
        <TabPane tab="Google Drive" key="gdrive">
          <GoogleDriveSettings />
        </TabPane>
        <TabPane tab="Invoice Settings" key="invoice">
          <Card
            title="Invoice Configuration"
            extra={
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={() => {
                  invoiceForm.validateFields().then(values => {
                    setInvoiceSettings(values);
                    localStorage.setItem('invoiceSettings', JSON.stringify(values));
                    message.success('Invoice settings saved successfully!');
                  });
                }}
              >
                Save Settings
              </Button>
            }
          >
            <Form
              form={invoiceForm}
              layout="vertical"
              initialValues={invoiceSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="sellerName"
                    label="Seller Name"
                    rules={[{ required: true, message: 'Please input seller name!' }]}
                  >
                    <Input placeholder="Enter seller name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sellerPhone"
                    label="Seller Phone"
                    rules={[{ required: true, message: 'Please input seller phone!' }]}
                  >
                    <Input placeholder="Enter seller phone number" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider>Seller Address</Divider>
              
              <Form.Item
                name={['sellerAddress', 'line1']}
                label="Address Line 1"
                rules={[{ required: true, message: 'Please input address line 1!' }]}
              >
                <Input placeholder="Enter address line 1" />
              </Form.Item>
              
              <Form.Item
                name={['sellerAddress', 'line2']}
                label="Address Line 2"
                rules={[{ required: true, message: 'Please input address line 2!' }]}
              >
                <Input placeholder="Enter address line 2" />
              </Form.Item>
              
              <Form.Item
                name={['sellerAddress', 'line3']}
                label="Address Line 3"
              >
                <Input placeholder="Enter address line 3 (optional)" />
              </Form.Item>
              
              <Divider>Company Logo</Divider>
              
              <Form.Item
                name="companyLogo"
                label="Company Logo URL"
                rules={[{ required: true, message: 'Please input company logo URL!' }]}
              >
                <Input placeholder="Enter company logo URL" />
              </Form.Item>
              
              <Form.Item label="Upload Company Logo">
                <Upload
                  name="logo"
                  listType="picture"
                  maxCount={1}
                  showUploadList={false} // Hide the default upload list
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      if (e.target && typeof e.target.result === 'string') {
                        invoiceForm.setFieldsValue({ companyLogo: e.target.result });
                      }
                    };
                    reader.readAsDataURL(file);
                    return false; // Prevent actual upload
                  }}
                >
                  <Button icon={<UploadOutlined />}>Click to upload</Button>
                </Upload>
                <div style={{ marginTop: 8 }}>
                  {invoiceForm.getFieldValue('companyLogo') && (
                    <img 
                      src={invoiceForm.getFieldValue('companyLogo')} 
                      alt="Company Logo Preview" 
                      style={{ maxWidth: "200px", maxHeight: "100px" }} 
                    />
                  )}
                </div>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        <TabPane tab="UI Settings" key="ui">
          <Card title="Invoice Screen">
              <Row align="middle">
                  <Col span={18}>
                      <Text strong>Show "Duplicate Item" Button</Text>
                      <div style={{ color: '#888', fontSize: '12px' }}>
                          Show or hide the button for duplicating items in the invoice item summary table.
                      </div>
                  </Col>
                  <Col span={6} style={{ textAlign: 'right' }}>
                      <input
                          type="checkbox"
                          checked={uiSettings.showDuplicateButton}
                          onChange={(e) => handleUiSettingChange('showDuplicateButton', e.target.checked)}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                  </Col>
              </Row>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserSettings;
