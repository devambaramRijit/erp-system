import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Upload, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { TextArea } = Input;

const INVOICE_SETTINGS_KEY = 'invoiceSettings';

interface InvoiceSettingsData {
  logo: string;
  sellerName: string;
  sellerPhone: string;
  sellerAddress: string;
}

// Function to get the base64 representation of a file
const getBase64 = (img: File, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

const InvoiceSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    // Load existing settings from localStorage
    const savedSettings = localStorage.getItem(INVOICE_SETTINGS_KEY);
    if (savedSettings) {
      const settings: InvoiceSettingsData = JSON.parse(savedSettings);
      form.setFieldsValue(settings);
      if (settings.logo) {
        setLogoUrl(settings.logo);
      }
    } else {
        // Set default hardcoded values if no settings found
        const defaultSettings = {
            sellerName: 'Pooja Kreations',
            sellerPhone: '9749928722',
            sellerAddress: 'Cinema Hall Road, Durgapur
West Bengal, PIN - 713201
(near Shiv Mandir)',
            logo: '/pk-logo.png'
        };
        form.setFieldsValue(defaultSettings);
        setLogoUrl(defaultSettings.logo);
    }
  }, [form]);

  const onFinish = (values: Omit<InvoiceSettingsData, 'logo'>) => {
    const newSettings: InvoiceSettingsData = {
        ...values,
        logo: logoUrl, // Use the logo from the state
    };
    localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(newSettings));
    message.success('Invoice settings saved successfully!');
  };

  const uploadProps: UploadProps = {
    name: 'logo',
    listType: 'picture',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      // Convert image to base64 and set it in state
      getBase64(file, (url) => {
        setLogoUrl(url);
      });
      return false; // Prevent automatic upload
    },
  };

  return (
    <Card title="Invoice & Seller Information">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item label="Company Logo">
          <Space direction="vertical">
            {logoUrl && <Image width={200} src={logoUrl} />}
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Space>
        </Form.Item>
        
        <Form.Item
          name="sellerName"
          label="Seller Name"
          rules={[{ required: true, message: 'Please enter the seller name' }ті]}
        >
          <Input placeholder="e.g., Pooja Kreations" />
        </Form.Item>

        <Form.Item
          name="sellerPhone"
          label="Seller Phone"
          rules={[{ required: true, message: 'Please enter the seller phone number' }]}
        >
          <Input placeholder="e.g., 9876543210" />
        </Form.Item>

        <Form.Item
          name="sellerAddress"
          label="Seller Address"
          rules={[{ required: true, message: 'Please enter the seller address' }]}
        >
          <TextArea rows={4} placeholder="Enter the full seller address, each part on a new line" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save Settings
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default InvoiceSettings;
