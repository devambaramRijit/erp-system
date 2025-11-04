import React, { useMemo } from 'react';
import { Empty } from 'antd';

interface InventoryItem {
  category: string;
  // other properties...
}

interface InventoryCategoryChartProps {
  inventoryItems: InventoryItem[];
}

const InventoryCategoryChart: React.FC<InventoryCategoryChartProps> = ({ inventoryItems }) => {
  const data = useMemo(() => {
    if (!inventoryItems || inventoryItems.length === 0) {
      return [];
    }

    const categoryCounts = inventoryItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      type: category,
      value: count,
    }));
  }, [inventoryItems]);

  if (data.length === 0) {
    return <Empty description="No category data to display" />;
  }

  return (
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
              ctx.fillText(`${item.value} products`, labelX, labelY + 18);
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
              const percentage = ((item.value / total) * 100).toFixed(1);
              ctx.fillText(
                `${item.type}: ${item.value} products (${percentage}%)`,
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
            ctx.fillText(`${item.value} products`, labelX, labelY + 15);
            
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
            const percentage = ((item.value / total) * 100).toFixed(1);
            ctx.fillText(
              `${item.type}: ${item.value} products (${percentage}%)`,
              canvas.width - 130,
              legendY + 12
            );
            
            legendY += 25;
          });
        }}
      />
    </div>
  );
};

export default InventoryCategoryChart;