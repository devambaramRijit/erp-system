import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Select, DatePicker, Row, Col, Table, Tag, Statistic, Empty } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// --- TypeScript Interfaces ---
interface InvoiceItem {
    productId: string;
    price: number;
    quantity: number;
}

interface Invoice {
    id: string;
    date: string;
    total: number;
    items: InvoiceItem[] | string; // Adjusted for robustness
    customerId: string;
    customerName?: string; // Optional for backward compatibility
}

interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    costPricePerPiece: number;
    sku: string;
}

interface Customer {
    id: string;
    createdAt: string;
    name: string;
    city: string;
}

// --- Report-specific data structure interfaces ---
interface SalesTrendData {
    period: string;
    sales: number;
}

interface ProductPerformanceData {
    name: string;
    quantity: number;
    profit: number;
}

interface CustomerAnalysisData {
    name: string;
    value: number;
}

interface InactiveCustomer {
    id: string;
    name: string;
    lastPurchase: string;
    daysSinceLastPurchase: number;
}


// --- Main Reports Screen Component ---
const ReportsScreen: React.FC = () => {
    const [frequency, setFrequency] = useState('monthly');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([dayjs().subtract(30, 'days'), dayjs()]);
    const [inactiveDays, setInactiveDays] = useState(90);

    // Memoize raw data fetching to prevent re-reading from localStorage on every render
    const { allInvoices, allInventory, allCustomers } = useMemo(() => {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]') as Invoice[];
        // Robustly map customer names to invoices
        const customers = JSON.parse(localStorage.getItem('customers') || '[]') as Customer[];
        const customerMap = new Map(customers.map(c => [c.id, c.name]));
        const invoicesWithNames = invoices.map(inv => ({...inv, customerName: customerMap.get(inv.customerId) ?? 'Unknown Customer'}));
        
        return {
            allInvoices: invoicesWithNames,
            allInventory: JSON.parse(localStorage.getItem('erp_inventory') || '[]') as InventoryItem[],
            allCustomers: customers
        };
    }, []);

    // Memoize filtered data based on date range
    const filteredInvoices = useMemo(() => {
        if (!dateRange) return allInvoices;
        const [start, end] = dateRange;
        return allInvoices.filter(invoice => {
            const invoiceDate = dayjs(invoice.date);
            return invoiceDate.isAfter(start) && invoiceDate.isBefore(end);
        });
    }, [allInvoices, dateRange]);

    // --- Memoized Report Calculations ---

    const salesTrends = useMemo((): SalesTrendData[] => {
        const salesByPeriod: { [key: string]: number } = {};
        filteredInvoices.forEach(invoice => {
            const date = dayjs(invoice.date);
            let period = '';
            switch (frequency) {
                case 'daily': period = date.format('YYYY-MM-DD'); break;
                case 'weekly': period = `W${date.isoWeek()} ${date.year()}`; break;
                case 'monthly': period = date.format('MMMM YYYY'); break;
                case 'yearly': period = date.year().toString(); break;
                default: period = date.format('MMMM YYYY'); break;
            }
            salesByPeriod[period] = (salesByPeriod[period] || 0) + invoice.total;
        });
        return Object.keys(salesByPeriod).map(period => ({ period, sales: salesByPeriod[period] })).sort((a,b) => dayjs(a.period).isAfter(dayjs(b.period)) ? 1 : -1);
    }, [filteredInvoices, frequency]);

    const productPerformance = useMemo((): ProductPerformanceData[] => {
        const performance: { [key: string]: { name: string; quantity: number; profit: number } } = {};
        const inventoryMap = new Map(allInventory.map(item => [item.id, item]));

        filteredInvoices.forEach(invoice => {
            const items: InvoiceItem[] = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
            if (!Array.isArray(items)) return;
            
            items.forEach(item => {
                const product = inventoryMap.get(item.productId);
                if (!product) return;

                if (!performance[product.id]) {
                    performance[product.id] = { name: product.name, quantity: 0, profit: 0 };
                }

                const quantity = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                const cost = Number(product.costPricePerPiece) || 0;
                
                performance[product.id].quantity += quantity;
                performance[product.id].profit += (price - cost) * quantity;
            });
        });

        return Object.values(performance);
    }, [filteredInvoices, allInventory]);

    const kpis = useMemo(() => {
        const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.total, 0);
        const averageOrderValue = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;

        const inventoryMap = new Map(allInventory.map(item => [item.id, item]));

        const costOfGoodsSold = filteredInvoices.reduce((cogs, invoice) => {
            const items: InvoiceItem[] = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
            if (!Array.isArray(items)) return cogs;

            return cogs + items.reduce((invoiceCogs, item) => {
                const product = inventoryMap.get(item.productId);
                if (!product) return invoiceCogs;
                 const quantity = Number(item.quantity) || 0;
                 const cost = Number(product.costPricePerPiece) || 0;
                return invoiceCogs + (cost * quantity);
            }, 0);
        }, 0);
    
        const totalInventoryValue = allInventory.reduce((value, item) => {
            const quantity = Number(item.quantity) || 0;
            const cost = Number(item.costPricePerPiece) || 0;
            return value + (cost * quantity);
        }, 0);

        const inventoryTurnoverRatio = totalInventoryValue > 0 ? costOfGoodsSold / totalInventoryValue : 0;
        
        const uniqueCustomersInPeriod = new Set(filteredInvoices.map(inv => inv.customerId)).size;
        const purchaseFrequency = uniqueCustomersInPeriod > 0 ? filteredInvoices.length / uniqueCustomersInPeriod : 0;
        const customerLifetimeValue = averageOrderValue * purchaseFrequency;

        return { 
            totalRevenue, 
            averageOrderValue, 
            inventoryTurnoverRatio,
            purchaseFrequency,
            customerLifetimeValue
        };
    }, [filteredInvoices, allInventory]);

    const topCustomers = useMemo((): CustomerAnalysisData[] => {
        const revenueByCustomer: { [key: string]: { name: string; value: number } } = {};

        filteredInvoices.forEach(invoice => {
            const customerName = invoice.customerName || 'Unknown Customer';
            if (!revenueByCustomer[invoice.customerId]) {
                revenueByCustomer[invoice.customerId] = { name: customerName, value: 0 };
            }
            revenueByCustomer[invoice.customerId].value += invoice.total;
        });

        return Object.values(revenueByCustomer)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [filteredInvoices]);

    const salesByCity = useMemo((): { city: string; sales: number }[] => {
        const sales: { [city: string]: number } = {};
        const customerCityMap = new Map(allCustomers.map(c => [c.id, c.city]));

        filteredInvoices.forEach(invoice => {
            const city = customerCityMap.get(invoice.customerId) || 'Unknown';
            sales[city] = (sales[city] || 0) + invoice.total;
        });

        return Object.entries(sales)
            .map(([city, sales]) => ({ city, sales }))
            .sort((a, b) => b.sales - a.sales);
    }, [filteredInvoices, allCustomers]);

    const customerAnalysis = useMemo(() => {
        const customerFirstPurchase: { [key: string]: string } = {};
        allInvoices.forEach(inv => {
            if (!customerFirstPurchase[inv.customerId] || dayjs(inv.date).isBefore(dayjs(customerFirstPurchase[inv.customerId]))) {
                customerFirstPurchase[inv.customerId] = inv.date;
            }
        });

        let newCustomerRevenue = 0;
        let returningCustomerRevenue = 0;
        const [start, end] = dateRange ?? [dayjs().subtract(30, 'days'), dayjs()];

        filteredInvoices.forEach(inv => {
            const firstPurchaseDate = dayjs(customerFirstPurchase[inv.customerId]);
            if (firstPurchaseDate.isBetween(start, end, null, '[]')) {
                newCustomerRevenue += inv.total;
            } else {
                returningCustomerRevenue += inv.total;
            }
        });

        return {
            newVsReturning: [
                { name: 'New Customers', value: newCustomerRevenue },
                { name: 'Returning Customers', value: returningCustomerRevenue }
            ]
        };
    }, [allInvoices, filteredInvoices, dateRange]);

    const inactiveCustomers = useMemo((): InactiveCustomer[] => {
        const lastPurchase: { [key: string]: string } = {};
        allInvoices.forEach(inv => {
            if (!lastPurchase[inv.customerId] || dayjs(inv.date).isAfter(dayjs(lastPurchase[inv.customerId]))) {
                lastPurchase[inv.customerId] = inv.date;
            }
        });

        const thresholdDate = dayjs().subtract(inactiveDays, 'days');
        const inactive: InactiveCustomer[] = [];

        allCustomers.forEach(customer => {
            const lastPurchaseDateStr = lastPurchase[customer.id];
            const lastPurchaseDate = lastPurchaseDateStr ? dayjs(lastPurchaseDateStr) : null;
            
            if (lastPurchaseDate && lastPurchaseDate.isBefore(thresholdDate)) {
                 inactive.push({
                    id: customer.id,
                    name: customer.name,
                    lastPurchase: lastPurchaseDate.format('YYYY-MM-DD'),
                    daysSinceLastPurchase: dayjs().diff(lastPurchaseDate, 'day')
                });
            }
        });

        return inactive.sort((a,b)=> a.daysSinceLastPurchase - b.daysSinceLastPurchase);
    }, [allInvoices, allCustomers, inactiveDays]);
    
    const slowMovingInventory = useMemo(() => {
        const soldProductIds = new Set(productPerformance.map(p => allInventory.find(i => i.name === p.name)?.id));
        return allInventory.filter(item => !soldProductIds.has(item.id));
    }, [productPerformance, allInventory]);

    const productAffinity = useMemo(() => {
        const pairCounts: { [key: string]: { product1Id: string; product2Id: string; count: number } } = {};
        const inventoryMap = new Map(allInventory.map(item => [item.id, item.name]));

        filteredInvoices.forEach(invoice => {
            const items: InvoiceItem[] = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
            if (!Array.isArray(items) || items.length < 2) return;

            const productIds = items.map(item => item.productId);

            // Generate unique pairs from the product IDs in this invoice
            for (let i = 0; i < productIds.length; i++) {
                for (let j = i + 1; j < productIds.length; j++) {
                    // Sort IDs to create a consistent key for the pair (e.g., "prod1-prod2" is same as "prod2-prod1")
                    const [id1, id2] = [productIds[i], productIds[j]].sort();
                    const key = `${id1}|${id2}`;

                    if (!pairCounts[key]) {
                        pairCounts[key] = {
                            product1Id: id1,
                            product2Id: id2,
                            count: 0
                        };
                    }
                    pairCounts[key].count++;
                }
            }
        });

        const affinityData = Object.values(pairCounts)
            .map(pair => ({
                key: `${pair.product1Id}-${pair.product2Id}`,
                product1Name: inventoryMap.get(pair.product1Id) || 'Unknown Product',
                product2Name: inventoryMap.get(pair.product2Id) || 'Unknown Product',
                count: pair.count
            }))
            .filter(pair => pair.product1Name !== 'Unknown Product' && pair.product2Name !== 'Unknown Product');

        return affinityData.sort((a, b) => b.count - a.count).slice(0, 10);

    }, [filteredInvoices, allInventory]);


    // --- Render Helper Data ---
    const bestSellingProducts = [...productPerformance].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const mostProfitableProducts = [...productPerformance].sort((a, b) => b.profit - a.profit).slice(0, 10);
    const COLORS = ['#0088FE', '#00C49F'];
    
    const inactiveCustomersColumns = [
        { title: 'Customer Name', dataIndex: 'name', key: 'name' },
        { title: 'Last Purchase Date', dataIndex: 'lastPurchase', key: 'lastPurchase' },
        { title: 'Days Since Last Purchase', dataIndex: 'daysSinceLastPurchase', key: 'daysSinceLastPurchase', sorter: (a: InactiveCustomer, b: InactiveCustomer) => a.daysSinceLastPurchase - b.daysSinceLastPurchase },
    ];
    
    const slowMovingColumns = [
        { title: 'SKU', dataIndex: 'sku', key: 'sku' },
        { title: 'Product Name', dataIndex: 'name', key: 'name' },
        { title: 'Remaining Quantity', dataIndex: 'quantity', key: 'quantity' },
    ];

    const affinityColumns = [
        { title: 'Product 1', dataIndex: 'product1Name', key: 'product1Name' },
        { title: 'Product 2', dataIndex: 'product2Name', key: 'product2Name' },
        { title: 'Purchased Together (Times)', dataIndex: 'count', key: 'count', sorter: (a: { count: number }, b: { count: number }) => a.count - b.count },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
                    <p className="label">{`${label}`}</p>
                    <p className="intro" style={{ color: payload[0].color }}>{`Sales : ₹${payload[0].value.toFixed(2)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <Title level={2}>Business Intelligence Dashboard</Title>
            
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                    <Col><Text strong>Date Range:</Text></Col>
                    <Col><RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} /></Col>
                    <Col><Text strong>Frequency:</Text></Col>
                    <Col><Select value={frequency} onChange={setFrequency} style={{ width: 120 }}>
                        <Option value="daily">Daily</Option>
                        <Option value="weekly">Weekly</Option>
                        <Option value="monthly">Monthly</Option>
                        <Option value="yearly">Yearly</Option>
                    </Select></Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]}>
                {/* --- Row 1: Sales Trends --- */}
                <Col span={24}>
                    <Card>
                        <Title level={4}>Sales Trends</Title>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis tickFormatter={(value) => `₹${value}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* --- Row 2: KPIs --- */}
                <Col xs={24} md={12} lg={8}>
                    <Card><Statistic title="Total Revenue" value={kpis.totalRevenue} prefix="₹" precision={2} /></Card>
                </Col>
                <Col xs={24} md={12} lg={8}>
                    <Card><Statistic title="Average Order Value" value={kpis.averageOrderValue} prefix="₹" precision={2} /></Card>
                </Col>
                 <Col xs={24} md={12} lg={8}>
                    <Card><Statistic title="Inventory Turnover" value={kpis.inventoryTurnoverRatio} precision={2} suffix="x" /></Card>
                </Col>
                <Col xs={24} md={12} lg={12}>
                    <Card><Statistic title="Avg. Purchase Frequency" value={kpis.purchaseFrequency} precision={2} suffix=" orders/customer" /></Card>
                </Col>
                <Col xs={24} md={12} lg={12}>
                    <Card><Statistic title="Customer Lifetime Value (Est.)" value={kpis.customerLifetimeValue} prefix="₹" precision={2} /></Card>
                </Col>

                {/* --- Row 3: Customer Analysis --- */}
                <Col xs={24} lg={12}>
                    <Card>
                        <Title level={4}>New vs. Returning Customer Revenue</Title>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={customerAnalysis.newVsReturning} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={(entry) => `${entry.name}: ₹${entry.value.toFixed(0)}`}>
                                    {customerAnalysis.newVsReturning.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                 <Col xs={24} lg={12}>
                    <Card>
                        <Title level={4}>Sales by City</Title>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesByCity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="city" />
                                <YAxis tickFormatter={(value) => `₹${value}`} />
                                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="sales" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                
                {/* --- Row 4: Product & Customer Performance --- */}
                <Col xs={24} lg={12}>
                    <Card>
                        <Title level={4}>Top 10 Customers (by Revenue)</Title>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                                <YAxis type="category" dataKey="name" width={120} />
                                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="value" name="Revenue" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card>
                        <Title level={4}>Best Selling Products (by Quantity)</Title>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bestSellingProducts} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={120} />
                                <Tooltip formatter={(value: number) => `${value} units`} />
                                <Legend />
                                <Bar dataKey="quantity" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* --- Row 5: Profitability & Slow Movers --- */}
                <Col xs={24} lg={12}>
                    <Card>
                        <Title level={4}>Most Profitable Products</Title>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mostProfitableProducts} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                                <YAxis type="category" dataKey="name" width={120} />
                                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)} profit`} />
                                <Legend />
                                <Bar dataKey="profit" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card>
                        <Title level={4}>Slow-Moving Inventory</Title>
                        {slowMovingInventory.length > 0 ? (
                           <Table dataSource={slowMovingInventory} columns={slowMovingColumns} rowKey="id" size="small" pagination={{ pageSize: 4 }} style={{ height: 300 }} />
                        ) : (
                           <Empty description="All products have been sold at least once in the selected period." style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}/>
                        )}
                    </Card>
                </Col>
                
                {/* --- Row 6: Inactive Customers --- */}
                <Col xs={24}>
                     <Card>
                        <Row align="middle" justify="space-between">
                            <Col><Title level={4}>Inactive Customers</Title></Col>
                            <Col>
                                <Text>Hide customers inactive for more than </Text>
                                <Select value={inactiveDays} onChange={setInactiveDays} style={{ width: 80, marginRight: 8 }}>
                                    <Option value={30}>30</Option>
                                    <Option value={60}>60</Option>
                                    <Option value={90}>90</Option>
                                    <Option value={180}>180</Option>
                                    <Option value={365}>365</Option>
                                </Select>
                                <Text> days</Text>
                            </Col>
                        </Row>
                        <Table dataSource={inactiveCustomers} columns={inactiveCustomersColumns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />
                    </Card>
                </Col>

                {/* --- Row 7: Product Affinity --- */}
                <Col xs={24}>
                    <Card>
                        <Title level={4}>Product Affinity Analysis (Top 10 Frequently Bought Together)</Title>
                        {productAffinity.length > 0 ? (
                            <Table dataSource={productAffinity} columns={affinityColumns} rowKey="key" size="small" pagination={{ pageSize: 5 }} />
                        ) : (
                            <Empty description="Not enough data to analyze product affinity for the selected period." />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReportsScreen;