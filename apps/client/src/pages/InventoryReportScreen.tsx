import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Table, Input, Row, Col, Card, Statistic, Select, Button, Space, Modal, Form, InputNumber } from 'antd';
import { Product } from '../types/product';
import Papa from 'papaparse';
import { DownloadOutlined, SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface InvoiceItem {
  productId: string;
  quantity: number;
}

interface Invoice {
  id: string;
  date: string;
  items: InvoiceItem[];
}

const InventoryReportScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [thresholds, setThresholds] = useState({
    lowStock: 10,
    veryFastMoving: 20,
    fastMoving: 10,
    aClassBoundary: 80,
    bClassBoundary: 95,
  });
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100, 500, 1000, 2000, 5000],
  });

  useEffect(() => {
    const storedProducts = localStorage.getItem('erp_inventory');
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    const storedInvoices = localStorage.getItem('invoices');
    if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
    const storedThresholds = localStorage.getItem('inventoryFilterThresholds');
    if (storedThresholds) setThresholds(prev => ({ ...prev, ...JSON.parse(storedThresholds) }));
  }, []);

  useEffect(() => {
    localStorage.setItem('inventoryFilterThresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  const salesData = useMemo(() => {
    const salesMap = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    invoices.forEach(invoice => {
      if (new Date(invoice.date) >= thirtyDaysAgo) {
        (invoice.items || []).forEach(item => {
          salesMap.set(item.productId, (salesMap.get(item.productId) || 0) + item.quantity);
        });
      }
    });
    return salesMap;
  }, [invoices]);

  const abcAnalysisData = useMemo(() => {
    const productValues = products.map(p => ({ ...p, value: (p.quantity || 0) * (p.costPricePerPiece || 0) }))
                                .sort((a, b) => b.value - a.value);
    const totalValue = productValues.reduce((sum, p) => sum + p.value, 0);
    let cumulativeValue = 0;
    return new Map(productValues.map(p => {
      cumulativeValue += p.value;
      const percentage = (cumulativeValue / totalValue) * 100;
      let abcClass = 'C';
      if (percentage <= thresholds.aClassBoundary) abcClass = 'A';
      else if (percentage <= thresholds.bClassBoundary) abcClass = 'B';
      return [p.id, abcClass];
    }));
  }, [products, thresholds]);

  const uniqueCategories = useMemo(() => [...new Set(products.map(p => p.productCategory).filter(Boolean))], [products]);
  const uniqueSizes = useMemo(() => [...new Set(products.map(p => p.size).filter(Boolean))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchTerm && !(p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())))) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.productCategory)) return false;
      if (selectedSizes.length > 0 && !selectedSizes.includes(p.size || '')) return false;

      switch (filter) {
        case 'low-stock': return (p.quantity || 0) < thresholds.lowStock;
        case 'very-fast-moving': return (salesData.get(p.id) || 0) > thresholds.veryFastMoving;
        case 'fast-moving': return (salesData.get(p.id) || 0) > thresholds.fastMoving && (salesData.get(p.id) || 0) <= thresholds.veryFastMoving;
        case 'slow-moving': return (salesData.get(p.id) || 0) > 0 && (salesData.get(p.id) || 0) <= thresholds.fastMoving;
        case 'a-items': return abcAnalysisData.get(p.id) === 'A';
        case 'b-items': return abcAnalysisData.get(p.id) === 'B';
        case 'c-items': return abcAnalysisData.get(p.id) === 'C';
        default: return true;
      }
    });
  }, [products, searchTerm, filter, salesData, thresholds, selectedCategories, selectedSizes, abcAnalysisData]);

  const summary = useMemo(() => ({
    totalProducts: filteredProducts.length,
    totalStock: filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0),
    totalValue: filteredProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.costPricePerPiece || 0)), 0),
  }), [filteredProducts]);

  const handleDownload = () => {
    const dataToDownload = selectedRowKeys.length > 0 ? filteredProducts.filter(p => selectedRowKeys.includes(p.id)) : filteredProducts;
    const csv = Papa.unparse(dataToDownload);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'inventory_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSettingsOk = () => {
    form.validateFields().then(values => {
      setThresholds(t => ({ ...t, ...values }));
      setIsSettingsModalVisible(false);
    });
  };

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', sorter: (a, b) => a.sku.localeCompare(b.sku) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Category', dataIndex: 'productCategory', key: 'productCategory', sorter: (a, b) => a.productCategory.localeCompare(b.productCategory) },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', align: 'right', sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0) },
    { title: '30-Day Sales', key: 'sales', align: 'right', render: (_: any, r: Product) => salesData.get(r.id) || 0, sorter: (a, b) => (salesData.get(a.id) || 0) - (salesData.get(b.id) || 0) },
    { title: 'Cost Price', dataIndex: 'costPricePerPiece', key: 'costPricePerPiece', align: 'right', render: (c: number) => `₹${(c || 0).toFixed(2)}`, sorter: (a, b) => (a.costPricePerPiece || 0) - (b.costPricePerPiece || 0) },
    { title: 'Total Value', key: 'totalValue', align: 'right', render: (_: any, r: Product) => `₹${((r.quantity || 0) * (r.costPricePerPiece || 0)).toFixed(2)}`, sorter: (a, b) => ((a.quantity || 0) * (a.costPricePerPiece || 0)) - ((b.quantity || 0) * (b.costPricePerPiece || 0)) },
    { title: 'ABC Class', key: 'abc', align: 'center', render: (_: any, r: Product) => abcAnalysisData.get(r.id) || 'N/A', sorter: (a, b) => (abcAnalysisData.get(a.id) || 'Z').localeCompare(abcAnalysisData.get(b.id) || 'Z') },
  ];

  return (
    <div>
      <Title level={2}>Inventory Report</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}><Col span={8}><Card><Statistic title="Filtered Products" value={summary.totalProducts} /></Card></Col><Col span={8}><Card><Statistic title="Filtered Stock Quantity" value={summary.totalStock} /></Card></Col><Col span={8}><Card><Statistic title="Filtered Stock Value" value={`₹${summary.totalValue.toFixed(2)}`} /></Card></Col></Row>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16} style={{width: '100%'}}>
            <Col flex="auto"><Search placeholder="Search by product name or SKU" onChange={(e) => setSearchTerm(e.target.value)} allowClear /></Col>
            <Col><Button icon={<SettingOutlined />} onClick={() => setIsSettingsModalVisible(true)}>Settings</Button></Col>
            <Col><Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>Download CSV</Button></Col>
          </Row>
          <Row gutter={16} style={{width: '100%'}}>
            <Col flex="auto"><Select mode="multiple" allowClear placeholder="Filter by Category" style={{ width: '100%' }} onChange={setSelectedCategories}>{uniqueCategories.map(c => <Option key={c} value={c}>{c}</Option>)}</Select></Col>
            <Col flex="auto"><Select mode="multiple" allowClear placeholder="Filter by Size" style={{ width: '100%' }} onChange={setSelectedSizes}>{uniqueSizes.map(s => <Option key={s} value={s}>{s}</Option>)}</Select></Col>
            <Col flex="auto">
              <Select defaultValue="all" style={{ width: '100%' }} onChange={setFilter}>
                  <Option value="all">All Items</Option>
                  <Option value="low-stock">Low Stock (&lt; {thresholds.lowStock})</Option>
                  <Option value="very-fast-moving">Very Fast Moving (&gt; {thresholds.veryFastMoving} sales)</Option>
                  <Option value="fast-moving">Fast Moving ({thresholds.fastMoving + 1}-{thresholds.veryFastMoving} sales)</Option>
                  <Option value="slow-moving">Slow Moving (1-{thresholds.fastMoving} sales)</Option>
                  <Option value="a-items">A-Class Items</Option>
                  <Option value="b-items">B-Class Items</Option>
                  <Option value="c-items">C-Class Items</Option>
              </Select>
            </Col>
          </Row>
        </Space>
        <Table
          rowSelection={{selectedRowKeys, onChange: setSelectedRowKeys}}
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          bordered
          pagination={pagination}
          onChange={(p) => setPagination(prev => ({ ...prev, ...p }))}
          style={{marginTop: 16}}
        />
      </Card>
      <Modal title="Filter Settings" open={isSettingsModalVisible} onOk={handleSettingsOk} onCancel={() => setIsSettingsModalVisible(false)}>
        <Form form={form} layout="vertical" initialValues={thresholds}>
          <Form.Item name="lowStock" label="Low Stock Threshold" rules={[{ required: true, message: 'Please enter a value.' }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="veryFastMoving" label="Very Fast Moving Threshold (> sales)" rules={[{ required: true, message: 'Please enter a value.' }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="fastMoving" label="Fast Moving Threshold (> sales)" rules={[{ required: true, message: 'Please enter a value.' }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="aClassBoundary" label="A-Class Boundary (%)" rules={[{ required: true, message: 'Please enter a value.' }]}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="bClassBoundary" label="B-Class Boundary (%)" rules={[{ required: true, message: 'Please enter a value.' }]}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryReportScreen;
