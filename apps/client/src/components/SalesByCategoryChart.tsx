import React, { useMemo } from 'react';
import { Pie } from '@ant-design/plots';
import { Empty } from 'antd';

interface Invoice {
  items: { name: string; total: number }[];
}

interface InventoryItem {
  name: string;
  category: string;
}

interface SalesByCategoryChartProps {
  invoices: Invoice[];
  inventoryItems: InventoryItem[];
}

const SalesByCategoryChart: React.FC<SalesByCategoryChartProps> = ({ invoices, inventoryItems }) => {
  const data = useMemo(() => {
    if (!invoices || invoices.length === 0 || !inventoryItems || inventoryItems.length === 0) {
      return [];
    }

    const salesByCategory = invoices.reduce((acc, invoice) => {
      invoice.items.forEach(item => {
        const product = inventoryItems.find(p => p.name === item.name);
        if (product) {
          const category = product.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + (item.total || 0);
        }
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(salesByCategory).map(([category, sales]) => ({
      type: category,
      value: sales,
    }));
  }, [invoices, inventoryItems]);

  if (data.length === 0) {
    return <Empty description="No sales data by category to display" />;
  }

  const config = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    legend: { position: 'top' },
    label: {
      type: 'outer',
      content: '{name} - {percentage}',
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: datum.type, value: `$${datum.value.toFixed(2)}` };
      },
    },
    interactions: [{ type: 'element-active' }, { type: 'element-selected' }],
  };

  return <Pie {...config} />;
};

export default SalesByCategoryChart;