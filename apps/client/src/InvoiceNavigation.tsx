
import React, { useState } from 'react';
import { Tabs, Card, Typography, Row, Col, Space } from 'antd';
import { 
  FileTextOutlined, 
  PlusCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import InvoiceScreen from './InvoiceScreen';

const { Title, Text } = Typography;

const InvoiceNavigation: React.FC = () => {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <Card 
        bordered={false} 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ padding: '24px 24px 16px' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space align="center">
                <AppstoreOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
                <div>
                  <Title level={3} style={{ margin: 0 }}>Invoice Management</Title>
                  <Text type="secondary">Manage and generate invoices for your customers</Text>
                </div>
              </Space>
            </Col>
          </Row>
        </div>
        
        <div style={{ padding: '0 24px 24px' }}>
          <InvoiceScreen />
        </div>
      </Card>
    </div>
  );
};

export default InvoiceNavigation;
