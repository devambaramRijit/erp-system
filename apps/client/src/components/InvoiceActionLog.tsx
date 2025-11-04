
import React, { useState, useEffect } from 'react';
import { Table, Modal, Tag, Typography, Space } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import actionLogService from '../services/actionLogService';
import moment from 'moment';

const { Title, Text } = Typography;

interface ActionLogProps {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string;
  invoiceNumber?: string;
}

interface ActionLogEntry {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  action: string;
  actionDate: string;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && invoiceId) {
      fetchActionLogs();
    }
  }, [visible, invoiceId]);

  const fetchActionLogs = async () => {
    if (!invoiceId) return;

    setLoading(true);
    try {
      const logs = await actionLogService.getActionLogsByInvoiceId(invoiceId);
      setActionLogs(logs);
    } catch (error) {
      console.error('Error fetching action logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'green';
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
      title: 'Date & Time',
      dataIndex: 'actionDate',
      key: 'actionDate',
      render: (date: string) => moment(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: ActionLogEntry, b: ActionLogEntry) => 
        new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime(),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={getActionColor(action)}>
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => username || 'System',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>Action Log for Invoice: {invoiceNumber}</span>
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Table
        columns={columns}
        dataSource={actionLogs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: 'No action logs found for this invoice',
        }}
      />
    </Modal>
  );
};

export default InvoiceActionLog;
