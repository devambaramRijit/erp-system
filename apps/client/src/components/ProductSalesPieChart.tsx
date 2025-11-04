import React, { useMemo } from 'react';
import { Empty, Typography } from 'antd';
const { Title } = Typography;

interface Invoice {
  items: { name: string; total: number }[];
}

interface InventoryItem {
  name: string;
  category: string;
}

interface ProductSalesPieChartProps {
  invoices: Invoice[];
  inventoryItems: InventoryItem[];
  selectedCategory: string;
}

const ProductSalesPieChart: React.FC<ProductSalesPieChartProps> = ({ 
  invoices, 
  inventoryItems, 
  selectedCategory 
}) => {
  const data = useMemo(() => {
    try {
    if (!invoices || invoices.length === 0 || !inventoryItems || inventoryItems.length === 0) {
      return [];
    }

    // Filter inventory items by selected category
    const categoryItems = selectedCategory === 'All' 
      ? inventoryItems 
      : inventoryItems.filter(item => item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
      
    // Debug category matching
    if (selectedCategory !== 'All') {
      const allCategories = [...new Set(inventoryItems.map(item => item.category))];
      const matchingCategories = allCategories.filter(cat => cat && cat.toLowerCase() === selectedCategory.toLowerCase());
      console.log('Category debugging:', {
        selectedCategory,
        allCategories: allCategories.slice(0, 10), // Show first 10 categories
        matchingCategories,
        categoryItemsCount: categoryItems.length
      });
    }

    // Calculate sales for each product in the category
    const productSales: Record<string, number> = {};

    invoices.forEach(invoice => {
      if (invoice && invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
        if (item && item.name && typeof item.total === 'number') {
          const invoiceItemName = item.name.trim().toLowerCase();
          const inventoryMatch = categoryItems.find(p => p.name.trim().toLowerCase() === invoiceItemName);
          
          if (inventoryMatch) {
            const canonicalName = inventoryMatch.name;
            productSales[canonicalName] = (productSales[canonicalName] || 0) + item.total;
          }
        }
      });
      }
    });

    // Transform data for the pie chart
    const chartData = Object.entries(productSales)
      .map(([productName, sales]) => ({
        type: productName,
        value: sales,
      }))
      .sort((a, b) => b.value - a.value); // Sort by sales value (highest first)
      
    console.log('ProductSalesPieChart data:', {
      selectedCategory,
      categoryItemsCount: categoryItems.length,
      invoicesCount: invoices.length,
      productSalesCount: Object.keys(productSales).length,
      chartDataCount: chartData.length,
      chartData: chartData.slice(0, 5) // Log first 5 items
    });
    
    return chartData;
    } catch (error) {
      console.error('Error processing product sales data:', error);
      return [];
    }
  }, [invoices, inventoryItems, selectedCategory]);

  if (data.length === 0) {
    return <Empty description="No sales data available for the selected category." />;
  }

  const config = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    legend: { 
      position: 'right',
      layout: 'vertical'
    },
    label: {
      type: 'outer',
      content: '{name} - {percentage}',
    },
    tooltip: {
      formatter: (datum: any) => {
        const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
        const percentage = ((datum.value / total) * 100).toFixed(1);
        return { 
          name: datum.type, 
          value: `$${datum.value.toFixed(2)} (${percentage}%)` 
        };
      },
    },
    interactions: [{ type: 'element-active' }, { type: 'element-selected' }],
  };

  try {
    console.log('ProductSalesPieChart rendering:', {
      hasData: data.length > 0,
      dataCount: data.length,
      configKeys: Object.keys(config),
      configDataLength: config.data ? config.data.length : 0,
      configData: config.data
    });
    
    // If no data, show empty state
    if (!data || data.length === 0) {
      console.log('No data to display in pie chart');
      return (
        <div>
          <Title level={5}>
            {selectedCategory === 'All' ? 'All Categories' : selectedCategory} - Product Sales Distribution
          </Title>
          <Empty description="No sales data available for this category" />
        </div>
      );
    }
    
    return (
      <div>
        <Title level={5}>
          {selectedCategory === 'All' ? 'All Categories' : selectedCategory} - Product Sales Distribution
        </Title>
        <div style={{ height: '500px', width: '100%', border: '1px solid #f0f0f0', padding: '10px', perspective: '1000px' }}>
          <canvas
            ref={(canvas) => {
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              
              // Set canvas size
              canvas.width = canvas.offsetWidth;
              canvas.height = canvas.offsetHeight;
              
              // Clear canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Calculate total value
              const total = data.reduce((sum, item) => sum + item.value, 0);
              
              // Set up pie chart parameters with 3D effect
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              const radius = Math.min(centerX, centerY) - 60;
              const depth = 20; // 3D depth
              
              // Animation variables
              let animationProgress = 0;
              const animationDuration = 1000; // 1 second
              const startTime = Date.now();
              
              // Animation function
              const animate = () => {
                const currentTime = Date.now();
                animationProgress = Math.min((currentTime - startTime) / animationDuration, 1);
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw 3D sides (depth effect)
                let currentAngle = -Math.PI / 2; // Start at top
                
                data.forEach((item, index) => {
                  const sliceAngle = (item.value / total) * 2 * Math.PI * animationProgress;
                  
                  // Draw 3D side for each slice
                  ctx.beginPath();
                  ctx.arc(centerX, centerY + depth, radius, currentAngle, currentAngle + sliceAngle);
                  ctx.arc(centerX, centerY, radius, currentAngle + sliceAngle, currentAngle, true);
                  ctx.closePath();
                  
                  // Darker color for 3D side
                  const color = `hsl(${index * 360 / data.length}, 70%, 50%)`;
                  ctx.fillStyle = color;
                  ctx.fill();
                  
                  currentAngle += sliceAngle;
                });
                
                // Draw top of 3D pie
                currentAngle = -Math.PI / 2; // Reset angle
                
                data.forEach((item, index) => {
                  const sliceAngle = (item.value / total) * 2 * Math.PI * animationProgress;
                  
                  // Draw slice top
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                  ctx.lineTo(centerX, centerY);
                  ctx.fillStyle = `hsl(${index * 360 / data.length}, 70%, 60%)`;
                  ctx.fill();
                  
                  // Draw label
                  const labelAngle = currentAngle + sliceAngle / 2;
                  const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                  const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                  
                  ctx.fillStyle = 'white';
                  ctx.font = 'bold 14px Arial';
                  ctx.textAlign = 'center';
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                  ctx.shadowBlur = 3;
                  ctx.fillText(`${item.type}`, labelX, labelY);
                  ctx.fillText(`₹${item.value.toFixed(0)}`, labelX, labelY + 18);
                  ctx.shadowBlur = 0;
                  
                  currentAngle += sliceAngle;
                });
                
                // Draw legend
                let legendY = 30;
                data.forEach((item, index) => {
                  // Color box with shadow
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                  ctx.shadowBlur = 2;
                  ctx.shadowOffsetX = 1;
                  ctx.shadowOffsetY = 1;
                  ctx.fillStyle = `hsl(${index * 360 / data.length}, 70%, 60%)`;
                  ctx.fillRect(canvas.width - 180, legendY, 20, 20);
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  ctx.fillStyle = 'black';
                  ctx.font = 'bold 14px Arial';
                  ctx.textAlign = 'left';
                  const percentage = ((item.value/total)*100).toFixed(1);
                  ctx.fillText(
                    `${item.type}: ₹${item.value.toFixed(2)} (${percentage}%)`,
                    canvas.width - 150,
                    legendY + 15
                  );
                  
                  legendY += 30;
                });
                
                // Continue animation if not complete
                if (animationProgress < 1) {
                  requestAnimationFrame(animate);
                }
              };
              
              // Start animation
              animate();
              
              // Set canvas size
              canvas.width = canvas.offsetWidth;
              canvas.height = canvas.offsetHeight;
              
              // Clear canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Calculate total value
              const total = data.reduce((sum, item) => sum + item.value, 0);
              
              // Set up pie chart parameters
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              const radius = Math.min(centerX, centerY) - 40;
              
              // Draw pie slices
              let currentAngle = -Math.PI / 2; // Start at top
              
              data.forEach((item, index) => {
                const sliceAngle = (item.value / total) * 2 * Math.PI;
                
                // Draw slice
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.lineTo(centerX, centerY);
                ctx.fillStyle = `hsl(${index * 360 / data.length}, 70%, 60%)`;
                ctx.fill();
                
                // Draw label
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${item.type}`, labelX, labelY);
                ctx.fillText(`₹${item.value.toFixed(0)}`, labelX, labelY + 15);
                
                currentAngle += sliceAngle;
              });
              
              // Draw legend
              let legendY = 20;
              data.forEach((item, index) => {
                ctx.fillStyle = `hsl(${index * 360 / data.length}, 70%, 60%)`;
                ctx.fillRect(canvas.width - 150, legendY, 15, 15);
                
                ctx.fillStyle = 'black';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(
                  `${item.type}: ₹${item.value.toFixed(2)} (${((item.value/total)*100).toFixed(1)}%)`,
                  canvas.width - 130,
                  legendY + 12
                );
                
                legendY += 25;
              });
            }}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering ProductSalesPieChart:', error);
    return <Empty description="Error loading chart. Please try again later." />;
  }
};

export default ProductSalesPieChart;