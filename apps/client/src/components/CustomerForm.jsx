import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space, Upload } from 'antd';
import { User, Mail, Phone, Building, MapPin, Save, UploadCloud } from 'lucide-react';

const { Option } = Select;

const CustomerForm = ({ onFinish, onCancel, initialValues, isSaving, isEditing }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  return (
    // The key ensures the form resets when the modal is re-opened for a new customer
    <Form layout="vertical" form={form} onFinish={onFinish} requiredMark={false} key={initialValues?.id || 'new'}>
      <Form.Item label="Profile Picture">
        <Upload.Dragger
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          beforeUpload={() => false} // Prevent auto-upload
        >
          <p className="ant-upload-drag-icon">
            <UploadCloud />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
        </Upload.Dragger>
      </Form.Item>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: 'Please enter the customer name' }]}
        >
          <Input prefix={<User className="text-gray-400" size={16} />} placeholder="e.g., John Doe" />
        </Form.Item>
        <Form.Item
          label="Email Address"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
        >
          <Input prefix={<Mail className="text-gray-400" size={16} />} placeholder="e.g., john.doe@example.com" />
        </Form.Item>
        <Form.Item label="Phone Number" name="phone">
          <Input prefix={<Phone className="text-gray-400" size={16} />} placeholder="e.g., (555) 123-4567" />
        </Form.Item>
        <Form.Item label="Company" name="company">
          <Input prefix={<Building className="text-gray-400" size={16} />} placeholder="e.g., Acme Inc." />
        </Form.Item>
        <Form.Item label="Address" name="address" className="md:col-span-2">
          <Input prefix={<MapPin className="text-gray-400" size={16} />} placeholder="e.g., 123 Main St, Anytown, USA" />
        </Form.Item>
      </div>
      <Form.Item className="mt-4">
        <Space className="flex justify-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isSaving} icon={<Save size={16} />}>
            {isEditing ? 'Update Customer' : 'Save Customer'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CustomerForm;
