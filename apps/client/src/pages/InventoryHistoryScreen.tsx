import React, { useState, useEffect } from 'react';
import { Table, Typography, Tag, DatePicker, Space, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';


dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
dayjs.extend(quarterOfYear);


const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ActivityLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'increment' | 'decrement' | 'update' | 'add' | 'delete' | 'sale' | 'finalize';
  previousQuantity?: number;
  newQuantity: number;
  timestamp: string;
  user: string;
  invoiceId?: string;
}

interface Invoice {
    id:string;
    invoiceNumber: string;
    customerName: string;
}

type RangeValue = [Dayjs | null, Dayjs | null] | null;

const InventoryHistoryScreen: React.FC = () => {
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredActivityLogs, setFilteredActivityLogs] = useState<ActivityLog[]>([]);
    const [dateRange, setDateRange] = useState<RangeValue>(null);

    useEffect(() => {
        const loadData = () => {
            const savedLogs = localStorage.getItem('inventoryActivityLogs');
            if (savedLogs) {
                try {
                    const parsedLogs = JSON.parse(savedLogs);
                    if (Array.isArray(parsedLogs)) {
                        setActivityLogs(parsedLogs);
                    }
                } catch (e) {
                    console.error("Failed to parse inventoryActivityLogs from localStorage", e);
                }
            }

            const savedInvoices = localStorage.getItem('invoices');
            if (savedInvoices) {
                 try {
                    const parsedInvoices = JSON.parse(savedInvoices);
                     if (Array.isArray(parsedInvoices)) {
                        setInvoices(parsedInvoices);
                    }
                } catch (e) {
                    console.error("Failed to parse invoices from localStorage", e);
                }
            }
        };

        loadData();

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'inventoryActivityLogs' || event.key === 'invoices') {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (dateRange && dateRange[0] && dateRange[1]) {
            const [startDate, endDate] = dateRange;
            const filtered = activityLogs.filter(log => {
                const logDate = dayjs(log.timestamp);
                // Using dayjs and cloning to prevent state mutation.
                return logDate.isSameOrAfter(startDate.clone().startOf('day')) && logDate.isSameOrBefore(endDate.clone().endOf('day'));
            });
            setFilteredActivityLogs(filtered);
        } else {
            setFilteredActivityLogs(activityLogs);
        }
    }, [activityLogs, dateRange]);

    const getInvoiceDetails = (invoiceId?: string) => {
        if (!invoiceId) return { customerName: 'N/A', invoiceNumber: 'N/A' };
        const invoice = invoices.find(inv => inv.id === invoiceId);
        return invoice 
            ? { customerName: invoice.customerName, invoiceNumber: invoice.invoiceNumber }
            : { customerName: 'N/A', invoiceNumber: 'N/A' };
    };

    const columns = [
        {
            title: 'Date & Time',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (timestamp: string) => new Date(timestamp).toLocaleString(),
            sorter: (a: ActivityLog, b: ActivityLog) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        },
        {
            title: 'Item Name',
            dataIndex: 'itemName',
            key: 'itemName',
            sorter: (a: ActivityLog, b: ActivityLog) => (a.itemName || '').localeCompare(b.itemName || ''),
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => {
                let color = 'blue';
                if (action.includes('delete') || action.includes('decrement')) color = 'red';
                if (action.includes('add') || action.includes('increment')) color = 'green';
                if (action.includes('sale')) color = 'purple';
                if (action.includes('finalize')) color = 'gold';
                return <Tag color={color}>{action.toUpperCase()}</Tag>;
            },
            filters: [
                { text: 'Increment', value: 'increment' },
                { text: 'Decrement', value: 'decrement' },
                { text: 'Update', value: 'update' },
                { text: 'Add', value: 'add' },
                { text: 'Delete', value: 'delete' },
                { text: 'Sale', value: 'sale' },
                { text: 'Finalize', value: 'finalize' },
            ],
            onFilter: (value: string | number | boolean, record: ActivityLog) => record.action.indexOf(value as string) === 0,
        },
        {
            title: 'Quantity Change',
            key: 'quantityChange',
            render: (_: any, record: ActivityLog) => {
                if (record.action === 'sale') {
                    return `-${record.newQuantity}`;
                }
                if (typeof record.previousQuantity !== 'undefined') {
                    const change = (record.newQuantity || 0) - record.previousQuantity;
                    return change > 0 ? `+${change}` : change;
                }
                return record.newQuantity || 0;
            }
        },
        {
            title: 'Customer',
            dataIndex: 'invoiceId',
            key: 'customer',
            render: (invoiceId?: string) => getInvoiceDetails(invoiceId).customerName,
        },
        {
            title: 'Invoice Number',
            dataIndex: 'invoiceId',
            key: 'invoiceNumber',
            render: (invoiceId?: string) => getInvoiceDetails(invoiceId).invoiceNumber,
        }
    ];

    const dataSource = filteredActivityLogs.map((log, index) => ({...log, key: `${log.id}-${index}`}));
    
    const handleClearFilters = () => {
        setDateRange(null);
    };

    const rangePresets: {
        label: string;
        value: [Dayjs, Dayjs];
    }[] = [
        { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
        { label: 'Yesterday', value: [dayjs().subtract(1, 'days').startOf('day'), dayjs().subtract(1, 'days').endOf('day')] },
        { label: 'Last 7 Days', value: [dayjs().subtract(7, 'days').startOf('day'), dayjs().endOf('day')] },
        { label: 'Last 30 Days', value: [dayjs().subtract(30, 'days').startOf('day'), dayjs().endOf('day')] },
        { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
        { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
        { label: 'Last Quarter', value: [dayjs().subtract(1, 'quarter').startOf('quarter'), dayjs().subtract(1, 'quarter').endOf('quarter')] },
        { label: 'Last Year', value: [dayjs().subtract(1, 'year').startOf('year'), dayjs().subtract(1, 'year').endOf('year')] },
    ];


    return (
        <div>
            <Title level={2}>Inventory History</Title>
            <Space direction="vertical" style={{ marginBottom: 16 }}>
                <Space>
                   <RangePicker 
                        presets={rangePresets}
                        value={dateRange}
                        onChange={setDateRange}
                        style={{ width: 400 }}
                    />
                    <Button onClick={handleClearFilters}>Clear</Button>
                </Space>
            </Space>
            <Table dataSource={dataSource} columns={columns} />
        </div>
    );
};

export default InventoryHistoryScreen;
