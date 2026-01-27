import React, { useState, useEffect } from 'react';
import FixedAddItemComponent from './FixedAddItemComponent';
import { inventoryService } from './services/inventoryService';
import { eventBus } from './services/eventBus';
import { localStorageService } from './services/localStorageService';
import {
  Button,
  Input,
  Modal,
  Form,
  Select,
  message,
  InputNumber,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Tooltip,
  Divider,
  Alert
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  InboxOutlined,
  DollarOutlined,
  WarningOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { InventoryItem, ActivityLog, SalesRecord, MonthlySalesData } from './types/inventory';
import { useInventoryScreen } from './hooks/useInventoryScreen';
import {
  getMonthlySalesData,
  getMonthlySalesReport,
  handleInvoiceItemAdd,
  handleInvoiceItemRemove
} from './services/inventoryOperations';

// Exported functions are now imported from inventoryOperations.ts

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    // Use the same data source as SimpleProductTab
    const savedItems = localStorage.getItem('inventory');
    if (savedItems) {
      const items = JSON.parse(savedItems);
      // Transform to match InventoryItem interface
      return items.map((item: any) => ({
        id: item.id,
        sku: item.code || item.sku || '',
        name: item.name || '',
        quantity: Number(item.quantity) || 0,
        price: Number(item.ratePerPiece) || 0,
        productType: item.productType || 'Traded',
        size: item.size || '',
        unit: item.unit || '',
        cpPerPiece: Number(item.costPricePerPiece) || 0,
        ratePerInch: Number(item.ratePerInch) || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<string[]>(() => {
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    return savedProductTypes ? JSON.parse(savedProductTypes) : ['Standard', 'Premium', 'Custom'];
  });
  const [showProductTypeDialog, setShowProductTypeDialog] = useState(false);
  const [newProductType, setNewProductType] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const savedLogs = localStorage.getItem('inventoryActivityLogs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(() => {
    const savedRecords = localStorage.getItem('inventorySalesRecords');
    return savedRecords ? JSON.parse(savedRecords) : [];
  });
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>(() => {
    const savedData = localStorage.getItem('inventoryMonthlySalesData');
    return savedData ? JSON.parse(savedData) : [];
  });

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      // Use the same data source as SimpleProductTab
      const items = localStorageService.getItems('inventory');

      // Transform to match InventoryItem interface
      const transformedItems = items.map((item: any) => ({
        id: item.id,
        sku: item.code || item.sku || '',
        name: item.name || '',
        quantity: Number(item.quantity) || 0,
        price: Number(item.ratePerPiece) || 0,
        productType: item.productType || 'Traded',
        size: item.size || '',
        unit: item.unit || '',
        cpPerPiece: Number(item.costPricePerPiece) || 0,
        ratePerInch: Number(item.ratePerInch) || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      setInventoryItems(transformedItems);
      setError('');
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError('Failed to fetch inventory items. Displaying locally saved data.');
    } finally {
      setLoading(false);
    }
  };

  // Function to update stock levels from invoice data
  const updateStockFromInvoice = async (invoiceItems: any[], invoiceId: string) => {
    try {
      for (const item of invoiceItems) {
        if (item.itemCode && item.quantity) {
          // Find item details to update the shared data source
          const soldItem = inventoryItems.find(invItem => invItem.sku === item.itemCode);

          if (soldItem) {
            // Update in the shared data source
            const updatedItem = {
              ...soldItem,
              quantity: soldItem.quantity - item.quantity
            };
            localStorageService.updateItem('inventory', soldItem.id, updatedItem);

            // Update local state
            setInventoryItems(inventoryItems.map(invItem => 
              invItem.id === soldItem.id ? updatedItem : invItem
            ));
          }

          recordSale(soldItem?.id || item.itemCode, item.name, item.quantity, item.price, invoiceId);
        }
      }
      message.success('Stock levels updated from invoice data');
    } catch (error) {
      console.error('Error updating stock from invoice:', error);
      message.error('Failed to update stock levels from invoice data');
    }
  };

  const handleItemAdded = (newItem: any) => {
    console.log('Adding new item with productType:', newItem);
    console.log('New item productType specifically:', newItem.productType);
    const updatedItems = [...inventoryItems, newItem];
    setInventoryItems(updatedItems);

    // Transform to match the shared data structure and save to localStorage
    const transformedItem = {
      id: newItem.id,
      code: newItem.sku,
      sku: newItem.sku,
      name: newItem.name,
      category: newItem.productCategory || '',
      productCategory: newItem.productCategory || '',
      productType: newItem.productType || 'Traded',
      quantity: newItem.quantity,
      costPricePerPiece: newItem.cpPerPiece || 0,
      ratePerPiece: newItem.price || 0,
      costPricePerInch: 0,
      ratePerInch: newItem.ratePerInch || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to the shared data source
    localStorageService.addItem('inventory', transformedItem);

    // Log the activity
    logActivity(newItem.id, newItem.name, 'add', undefined, newItem.quantity);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const itemToDelete = inventoryItems.find(item => item.id === id);
        setInventoryItems(inventoryItems.filter(item => item.id !== id));

        // Delete from the shared data source
        localStorageService.deleteItem('inventory', id);

        // Log the activity
        if (itemToDelete) {
          logActivity(id, itemToDelete.name, 'delete', itemToDelete.quantity, 0);
        }
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      }
    }
  };

  const handleUpdateItem = async (values: any) => {
    try {
      if (!editingItemId) return;

      const originalItem = inventoryItems.find(item => item.id === editingItemId);

      // Transform to match the shared data structure and update in localStorage
      const transformedItem = {
        id: editingItemId,
        code: values.sku,
        sku: values.sku,
        name: values.name,
        category: values.productType || '',
        productCategory: values.productType || '',
        productType: values.productType || 'Traded',
        quantity: values.quantity,
        costPricePerPiece: values.cpPerPiece || 0,
        ratePerPiece: values.price || 0,
        costPricePerInch: 0,
        ratePerInch: values.ratePerInch || 0,
        updatedAt: new Date().toISOString()
      };

      // Update in the shared data source
      localStorageService.updateItem('inventory', editingItemId, transformedItem);

      // Update local state
      setInventoryItems(inventoryItems.map(item => 
        item.id === editingItemId ? transformedItem : item
      ));

      // Log the activity if quantity changed
      if (originalItem && originalItem.quantity !== values.quantity) {
        logActivity(editingItemId, values.name, 'update', originalItem.quantity, values.quantity);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      message.error('Failed to update item');
    }
  };

  const recordSale = (itemId: string, itemName: string, quantity: number, price: number, invoiceId: string) => {
    const saleRecord: SalesRecord = {
      id: Date.now().toString(),
      itemId,
      itemName,
      quantity,
      price,
      total: quantity * price,
      timestamp: new Date().toISOString(),
      invoiceId
    };

    const updatedSalesRecords = [...salesRecords, saleRecord];
    setSalesRecords(updatedSalesRecords);
    localStorage.setItem('inventorySalesRecords', JSON.stringify(updatedSalesRecords));

    // Update monthly sales data
    const date = new Date();
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const existingMonthData = monthlySalesData.find(data => data.monthYear === monthYear && data.itemId === itemId);

    if (existingMonthData) {
      existingMonthData.quantitySold += quantity;
      existingMonthData.revenue += quantity * price;
    } else {
      const newMonthData: MonthlySalesData = {
        itemId,
        itemName,
        quantitySold: quantity,
        revenue: quantity * price,
        month: (date.getMonth() + 1).toString().padStart(2, '0'),
        year: date.getFullYear().toString(),
        monthYear
      };
      setMonthlySalesData([...monthlySalesData, newMonthData]);
    }

    localStorage.setItem('inventoryMonthlySalesData', JSON.stringify(monthlySalesData));
  };

  const logActivity = (itemId: string, itemName: string, action: string, previousQuantity?: number, newQuantity: number) => {
    const activityLog: ActivityLog = {
      id: Date.now().toString(),
      itemId,
      itemName,
      action,
      previousQuantity,
      newQuantity,
      timestamp: new Date().toISOString(),
      user: 'Current User'
    };

    const updatedLogs = [...activityLogs, activityLog];
    setActivityLogs(updatedLogs);
    localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
  };

  // Calculate statistics
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity < 10).length;

  useEffect(() => {
    // Initial fetch
    fetchInventoryItems();

    // Listener for inventory updates
    const handleInventoryUpdate = () => {
      console.log('Inventory update event received, refetching inventory data...');
      fetchInventoryItems();
    };

    eventBus.on('inventory:updated', handleInventoryUpdate);

    // Cleanup listener on component unmount
    return () => {
      eventBus.off('inventory:updated', handleInventoryUpdate);
    };
  }, []); // Empty dependency array to run only on mount and unmount

  return (
    <div style={{ padding: '24px' }}>
      <div className="mb-6">
        <Row gutter={[16, 16]} justify="space-between" align="middle">

        <Col xs={24} sm={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <InboxOutlined className="text-blue-600 text-xl" />
              </div>
              <div>
                <Typography.Text type="secondary" className="block">Total Items</Typography.Text>
                <Typography.Title level={3} className="my-0">{inventoryItems.length}</Typography.Title>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <DollarOutlined className="text-green-600 text-xl" />
              </div>
              <div>
                <Typography.Text type="secondary" className="block">Total Value</Typography.Text>
                <Typography.Title level={3} className="my-0">${totalValue.toFixed(2)}</Typography.Title>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <WarningOutlined className="text-red-600 text-xl" />
              </div>
              <div>
                <Typography.Text type="secondary" className="block">Low Stock Items</Typography.Text>
                <Typography.Title level={3} className="my-0">{lowStockItems}</Typography.Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <FixedAddItemComponent onItemAdded={handleItemAdded} />

      <Card className="shadow-sm mb-6">
        <Table
          dataSource={inventoryItems}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 800 }}
        >
          <Table.Column
            title="SKU"
            dataIndex="sku"
            key="sku"
            render={(text: string) => (
              <div className="font-medium">{text}</div>
            )}
          />
          <Table.Column
            title="Name"
            dataIndex="name"
            key="name"
            render={(text: string) => (
              <div className="font-medium">{text}</div>
            )}
          />
          <Table.Column
            title="Quantity"
            dataIndex="quantity"
            key="quantity"
            render={(quantity: number, record: InventoryItem) => (
              <div className="flex items-center space-x-2">
                <Button
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() => {
                    if (quantity > 0) {
                      // Update in the shared data source
                      const updatedItem = {
                        ...record,
                        quantity: quantity - 1
                      };
                      localStorageService.updateItem('inventory', record.id, updatedItem);

                      // Update local state
                      setInventoryItems(inventoryItems.map(item => 
                        item.id === record.id ? updatedItem : item
                      ));

                      logActivity(record.id, record.name, 'decrement', quantity, quantity - 1);
                    }
                  }}
                  disabled={quantity <= 0}
                  className="flex items-center justify-center"
                />
                <span className={`font-medium ${quantity < 10 ? 'text-red-600' : ''}`}>
                  {quantity}
                  {quantity < 10 && (
                    <Tag color="red" className="ml-2">Low</Tag>
                  )}
                </span>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    // Update in the shared data source
                    const updatedItem = {
                      ...record,
                      quantity: quantity + 1
                    };
                    localStorageService.updateItem('inventory', record.id, updatedItem);

                    // Update local state
                    setInventoryItems(inventoryItems.map(item => 
                      item.id === record.id ? updatedItem : item
                    ));

                    logActivity(record.id, record.name, 'increment', quantity, quantity + 1);
                  }}
                  className="flex items-center justify-center"
                />
              </div>
            )}
          />
          <Table.Column
            title="Price"
            dataIndex="price"
            key="price"
            render={(price: number) => (
              <div className="font-medium">${price.toFixed(2)}</div>
            )}
          />
          <Table.Column
            title="Product Type"
            dataIndex="productType"
            key="productType"
            render={(type: string) => (
              <Tag color={type === 'Premium' ? 'gold' : type === 'Standard' ? 'blue' : 'purple'}>
                {type}
              </Tag>
            )}
          />
          <Table.Column
            title="Actions"
            key="actions"
            render={(_, record: InventoryItem) => (
              <Space size="middle">
                <Tooltip title="Edit Item">
                  <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleUpdateItem(record)}
                  />
                </Tooltip>
                <Tooltip title="Delete Item">
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteItem(record.id)}
                  />
                </Tooltip>
              </Space>
            )}
          />
        </Table>
      </Card>

      {inventoryItems.length === 0 && (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center justify-center">
            <InboxOutlined className="text-6xl text-gray-300 mb-4" />
            <Typography.Title level={4} className="text-gray-500 mb-2">No Inventory Items</Typography.Title>
            <Typography.Text type="secondary" className="mb-4">
              Click "Add New Item" to add your first item
            </Typography.Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InventoryScreen;