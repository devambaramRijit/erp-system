import React from 'react';
import { Line } from '@ant-design/plots';
import { Empty } from 'antd';

interface SalesDataPoint {
  period: string;
  sales: number;
  productName: string;
}

interface SalesTrendChartProps {
  data: SalesDataPoint[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Empty description="No sales data available for the selected period/product." />;
  }

  const config = {
    data,
    xField: 'period',
    yField: 'sales',
    seriesField: 'productName',
    yAxis: {
      label: {
        formatter: (v: number) => `₹${(v / 1000).toFixed(1)}k`,
      },
    },
    legend: {
      position: 'top' as const,
    },
    smooth: true,
  };

  return <Line {...config} />;
};

export default SalesTrendChart;