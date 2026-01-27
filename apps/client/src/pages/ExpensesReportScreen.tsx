import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Table, Row, Col, Card, Statistic, Switch, Button, Modal, Checkbox, Space, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { SettingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Expense {
  key: React.Key;
  date: string;
  category: string;
  amount: number;
  description: string;
}

const ExpensesReportScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rawMaterialCategories, setRawMaterialCategories] = useState<string[]>([]);
  const [showRawMaterialsOnly, setShowRawMaterialsOnly] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[any, any]>([null, null]);

  useEffect(() => {
    const storedExpenses = localStorage.getItem('expensesData');
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    const storedCategories = localStorage.getItem('rawMaterialCategories');
    if (storedCategories) setRawMaterialCategories(JSON.parse(storedCategories));
  }, []);

  useEffect(() => {
    localStorage.setItem('rawMaterialCategories', JSON.stringify(rawMaterialCategories));
  }, [rawMaterialCategories]);

  const uniqueCategories = useMemo(() => [...new Set(expenses.map(e => e.category))], [expenses]);

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    if (showRawMaterialsOnly) {
      filtered = filtered.filter(e => rawMaterialCategories.includes(e.category));
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      filtered = filtered.filter(e => {
        const expenseDate = dayjs(e.date);
        return !expenseDate.isBefore(startDate) && !expenseDate.isAfter(endDate);
      });
    }
    return filtered;
  }, [expenses, showRawMaterialsOnly, rawMaterialCategories, dateRange]);

  const summary = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const rawMaterialExpenses = filteredExpenses
      .filter(e => rawMaterialCategories.includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);
    return { totalExpenses, rawMaterialExpenses };
  }, [filteredExpenses, rawMaterialCategories]);

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() },
    { title: 'Category', dataIndex: 'category', key: 'category', sorter: (a, b) => a.category.localeCompare(b.category) },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (a: number) => `₹${a.toFixed(2)}`, sorter: (a, b) => a.amount - b.amount },
  ];

  return (
    <div>
      <Title level={2}>Expenses Report</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}><Card><Statistic title="Total Expenses" value={`₹${summary.totalExpenses.toFixed(2)}`} /></Card></Col>
        <Col span={12}><Card><Statistic title="Raw Material Expenses" value={`₹${summary.rawMaterialExpenses.toFixed(2)}`} /></Card></Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <DatePicker.RangePicker onChange={(dates) => setDateRange(dates as [any, any])} />
            <Switch checked={showRawMaterialsOnly} onChange={setShowRawMaterialsOnly} />
            <Text>Show Only Raw Materials</Text>
          </Space>
          <Button icon={<SettingOutlined />} onClick={() => setIsSettingsModalVisible(true)}>
            Define Raw Materials
          </Button>
        </Space>
        <Table columns={columns} dataSource={filteredExpenses} rowKey="key" bordered pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="Define Raw Material Categories"
        open={isSettingsModalVisible}
        onOk={() => setIsSettingsModalVisible(false)}
        onCancel={() => setIsSettingsModalVisible(false)}
        footer={[<Button key="submit" type="primary" onClick={() => setIsSettingsModalVisible(false)}>Done</Button>]}
      >
        <Checkbox.Group
          options={uniqueCategories}
          value={rawMaterialCategories}
          onChange={(values) => setRawMaterialCategories(values as string[])}
          style={{ display: 'flex', flexDirection: 'column' }}
        />
      </Modal>
    </div>
  );
};

export default ExpensesReportScreen;
