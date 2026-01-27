
import React, { useState, useEffect } from 'react';
import { Table, Modal, Tag, Typography, Space } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

interface ActionLogProps {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
}

interface ActionLogEntry {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  action: string;
  timestamp: string;
  userId?: number;
  username?: string;
  details?: string;
}

const InvoiceActionLog: React.FC<ActionLogProps> = ({ 
  visible, 
  onClose, 
  invoiceId, 
  invoiceNumber 
}) => {
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);

  useEffect(() => {
    if (visible) {
      loadActionLogs();
    }
  }, [visible, invoiceId]);

  const loadActionLogs = () => {
    try {
      const allLogs = JSON.parse(localStorage.getItem('action_logs') || '[]') as ActionLogEntry[];
      let filteredLogs = allLogs;
      if (invoiceId) {
        filteredLogs = allLogs.filter(log => log.invoiceId === invoiceId);
      }
      // Sort by most recent first
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActionLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading action logs from localStorage:', error);
      setActionLogs([]);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'green';
      case 'editted':
      case 'updated':
        return 'blue';
      case 'deleted':
        return 'red';
      case 'finalized':
        return 'purple';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Date of Action',
      dataIndex: 'timestamp',
      key: 'dateOfAction',
      render: (date: string) => moment(date).format('YYYY-MM-DD'),
      sorter: (a: ActionLogEntry, b: ActionLogEntry) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Time of Action',
      dataIndex: 'timestamp',
      key: 'timeOfAction',
      render: (date: string) => moment(date).format('HH:mm:ss'),
    },
    {
        title: 'Status',
        dataIndex: 'action',
        key: 'action',
        render: (action: string) => {
          const statusText = action.charAt(0).toUpperCase() + action.slice(1);
          return (
            <Tag color={getActionColor(action)}>
              {statusText}
            </Tag>
          );
        }
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => username || 'System',
    },
    {
        title: 'Invoice Number',
        dataIndex: 'invoiceNumber',
        key: 'invoiceNumber',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
  ];
  
  // If we are viewing logs for a single invoice, don't show the invoice number column
  const finalColumns = invoiceId ? columns.filter(c => c.key !== 'invoiceNumber') : columns;

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>{invoiceId ? `Action Log for Invoice: ${invoiceNumber}` : 'All Action Logs'}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={invoiceId ? 800 : 1000}
    >
      <Table
        columns={finalColumns}
        dataSource={actionLogs}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: 'No action logs found',
        }}
      />
    </Modal>
  );
};

export default InvoiceActionLog;
