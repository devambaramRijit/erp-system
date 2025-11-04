import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  Empty,
  DatePicker,
  Select,
  Radio,
  Space
} from 'antd';
import axios from 'axios';
import './Dashboard.css'; // Import the CSS file

// Set correct API URL
axios.defaults.baseURL = 'http://localhost:3000/api';
import { ShoppingCartOutlined, DollarOutlined, WarningOutlined, RiseOutlined } from '@ant-design/icons';
import InventoryCategoryChart from '../components/InventoryCategoryChartNew';
import ProductSalesPieChart from '../components/ProductSalesPieChartNew';
import SalesTrendChart from '../components/SalesTrendChart';

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  category: string;
  ratePerPiece?: number;
}
interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  invoiceType?: 'manufactured' | 'traded';
  items: any[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  advancePayment: number;
  balanceDue: number;
  shippingCharges: number;
  paymentStatus: string;
  packingCharges: number;
  discountType?: 'percentage' | 'decimal';
  total: number;
  notes?: string;
}

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, lowStockCount: 0 });
  const [salesPeriod, setSalesPeriod] = useState('Monthly');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState('All');
  const [inventoryCategories, setInventoryCategories] = useState<string[]>(['All']);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Fetch Invoices from API with localStorage fallback
      try {
        const invoicesResponse = await axios.get('/invoices', { withCredentials: true });
        if (invoicesResponse.data && Array.isArray(invoicesResponse.data)) {
          setInvoices(invoicesResponse.data);
        }
      } catch (error) {
        console.warn('Could not fetch invoices from API, using localStorage.', error);
        const savedInvoices = localStorage.getItem('invoices');
        if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      }

      // Fetch Inventory from API with localStorage fallback
      try {
        const productsResponse = await axios.get('/inventory', { withCredentials: true });
        if (productsResponse.data && Array.isArray(productsResponse.data)) {
          const items: InventoryItem[] = productsResponse.data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            quantity: p.quantity || 0,
            ratePerPiece: p.ratePerPiece || 0,
            category: p.productCategory || p.category || 'N/A',
          }));
          setInventoryItems(items);
        }
      } catch (error) {
        console.warn('Could not fetch inventory from API, using localStorage.', error);
        const savedProducts = localStorage.getItem('simpleInventoryProducts');
        if (savedProducts) setInventoryItems(JSON.parse(savedProducts));
      }
    };

    const fetchInventoryCategories = async () => {
      try {
        const response = await axios.get('inventory/categories', { withCredentials: true });
        if (response.data && Array.isArray(response.data)) {
          setInventoryCategories(['All', ...response.data]);
        }
      } catch (error) {
        console.error('Error fetching inventory categories:', error);
      }
    };

    loadDashboardData();
    fetchInventoryCategories();
  }, []);

  useEffect(() => {
    // This effect recalculates stats whenever inventoryItems changes.
    if (inventoryItems.length > 0) {
      const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * (item.ratePerPiece || 0)), 0);
      const lowStockCount = inventoryItems.filter((item) => item.quantity < 10).length;
      setStats({ totalItems: inventoryItems.length, totalValue, lowStockCount });
    }
  }, [inventoryItems]);



  const filteredInventoryItems = useMemo(() => {
    if (selectedInventoryCategory === 'All') {
      return inventoryItems;
    }
    return inventoryItems.filter(item => item.category === selectedInventoryCategory);
  }, [inventoryItems, selectedInventoryCategory]);

  const salesInRange = useMemo(() => {
    if (!invoices.length) return 0;

    const filteredInvoices = invoices.filter(invoice => {
      if (!dateRange) {
        // By default, show today's sales if no range is selected
        const today = new Date().toDateString();
        return new Date(invoice.date).toDateString() === today;
      }
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= dateRange[0].startOf('day') && invoiceDate <= dateRange[1].endOf('day');
    });

    return filteredInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  }, [invoices, dateRange]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, number> = {};
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.name) {
          productSales[item.name] = (productSales[item.name] || 0) + (item.total || 0);
        }
      });
    });
    return Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);
  }, [invoices]);

  const salesChartData = useMemo(() => {
    const salesByPeriod: Record<string, Record<string, number>> = {};

    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date);
      let periodKey: string;

      switch (salesPeriod) {
        case 'Yearly':
          periodKey = `${invoiceDate.getFullYear()}`;
          break;
        case 'Quarterly':
          const quarter = Math.floor(invoiceDate.getMonth() / 3) + 1;
          periodKey = `${invoiceDate.getFullYear()}-Q${quarter}`;
          break;
        case 'Monthly':
        default:
          const month = (invoiceDate.getMonth() + 1).toString().padStart(2, '0');
          periodKey = `${invoiceDate.getFullYear()}-${month}`;
          break;
      }

      invoice.items.forEach(item => {
        if (item.name && (selectedProduct === 'All' || selectedProduct === item.name)) {
          const productName = selectedProduct === 'All' ? 'All Products' : item.name;
          if (!salesByPeriod[periodKey]) {
            salesByPeriod[periodKey] = {};
          }
          salesByPeriod[periodKey][productName] = (salesByPeriod[periodKey][productName] || 0) + (item.total || 0);
        }
      });
    });

    const chartData = Object.entries(salesByPeriod)
      .flatMap(([period, productSales]) =>
        Object.entries(productSales).map(([productName, sales]) => ({
          period,
          productName,
          sales,
        }))
      )
      .sort((a, b) => a.period.localeCompare(b.period));

    // If 'All' is selected, we need to aggregate sales for 'All Products'
    if (selectedProduct === 'All') {
      // This logic is already handled by setting productName to 'All Products' above.
      // The flatMap structure correctly creates separate series.
    }

    return chartData;
  }, [invoices, salesPeriod, selectedProduct]);

  const recentActivity = useMemo(() => {
    return invoices
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(invoice => ({
        key: invoice.id,
        activity: `Invoice #${invoice.invoiceNumber} created for ${invoice.customerName}`,
        date: new Date(invoice.date).toLocaleDateString(),
        amount: `$${invoice.total.toFixed(2)}`,
      }));
  }, [invoices]);

  return (
    <div className="dashboard-container">
      <Title level={2} className="dashboard-title">Welcome, {user.name}</Title>
      
      <div className="filter-bar">
        <Space>
          <RangePicker onChange={setDateRange} />
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Sales"
              value={salesInRange}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Total Inventory Items"
              value={stats.totalItems}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Inventory Value"
              value={stats.totalValue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stats-card">
            <Statistic
              title="Low Stock Items"
              value={stats.lowStockCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '2rem' }}>
        <Col xs={24} lg={16}>
          <Card className="chart-card">
            <Title level={4}>Sales Trends</Title>
            <Space style={{ marginBottom: 16 }}>
              <Radio.Group value={salesPeriod} onChange={(e) => setSalesPeriod(e.target.value)}>
                <Radio.Button value="Monthly">Monthly</Radio.Button>
                <Radio.Button value="Quarterly">Quarterly</Radio.Button>
                <Radio.Button value="Yearly">Yearly</Radio.Button>
              </Radio.Group>
              <Select value={selectedProduct} onChange={setSelectedProduct} style={{ width: 200 }}>
                <Option value="All">All Products</Option>
                {topProducts.map(p => <Option key={p} value={p}>{p}</Option>)}
              </Select>
            </Space>
            {salesChartData.length > 0 ? (
              <SalesTrendChart data={salesChartData} />
            ) : (
              <Empty description="No sales data available for the selected period." />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="chart-card">
            <Title level={4}>Inventory by Category</Title>
            <Select value={selectedInventoryCategory} onChange={setSelectedInventoryCategory} style={{ width: '100%', marginBottom: 16 }}>
              {inventoryCategories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
            {filteredInventoryItems.length > 0 ? (
              <>
                <Title level={5}>Product Count by Category</Title>
                <InventoryCategoryChart inventoryItems={filteredInventoryItems} />
                <Title level={5} style={{ marginTop: '1rem' }}>Product Sales Distribution</Title>
                <ProductSalesPieChart 
                  invoices={invoices} 
                  inventoryItems={inventoryItems} 
                  selectedCategory={selectedInventoryCategory} 
                />
              </>
            ) : (
              <Empty description="No inventory data available." />
            )}
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: '2rem' }}>
        <Col span={24}>
          <Card className="table-card">
            <Title level={4}>Recent Activity</Title>
            <Table
              dataSource={recentActivity}
              columns={[
                { title: 'Activity', dataIndex: 'activity', key: 'activity' },
                { title: 'Date', dataIndex: 'date', key: 'date' },
                { title: 'Amount', dataIndex: 'amount', key: 'amount' },
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}