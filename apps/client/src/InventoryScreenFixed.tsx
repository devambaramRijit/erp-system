import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FixedAddItemComponent from './FixedAddItemComponent';
import { inventoryService } from './services/inventoryService';
import { getMonthlySalesReport } from './inventoryOperations';
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

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  size: string;
  unit: string;
  quantity: number;
  price: number;
  productType: string;
  cpPerPiece: number;
  ratePerInch: number;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'increment' | 'decrement' | 'update' | 'add' | 'delete' | 'sale';
  previousQuantity?: number;
  newQuantity: number;
  timestamp: string;
  user: string;
  invoiceId?: string;
}

interface SalesRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  invoiceId: string;
}

interface MonthlySalesData {
  itemId: string;
  itemName: string;
  quantitySold: number;
  revenue: number;
  month: string;
  year: string;
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const savedItems = localStorage.getItem('inventoryItemsWithProductType');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<string[]>(() => {
    const savedTypes = localStorage.getItem('inventoryProductTypes');
    return savedTypes ? JSON.parse(savedTypes) : ['Fabric', 'Thread', 'Button', 'Zipper', 'Lining'];
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

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory');
      setInventoryItems(response.data);
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(response.data));
      setError('');
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError('Failed to fetch inventory items');

      // Fallback to localStorage if API fails
      const savedItems = localStorage.getItem('inventoryItemsWithProductType');
      if (savedItems) {
        setInventoryItems(JSON.parse(savedItems));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleItemAdded = (newItem: any) => {
    console.log('Adding new item with productType:', newItem);
    console.log('New item productType specifically:', newItem.productType);
    const updatedItems = [...inventoryItems, newItem];
    setInventoryItems(updatedItems);
    // Save updated items to localStorage
    console.log('Saving updated items to localStorage:', updatedItems);
    // Log each item's productType specifically
    updatedItems.forEach((item, index) => {
      console.log(`Item ${index} productType:`, item.productType);
    });
    localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));

    // Log the activity
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      itemId: newItem.id,
      itemName: newItem.name,
      action: 'add',
      previousQuantity: 0,
      newQuantity: newItem.quantity,
      timestamp: new Date().toISOString(),
      user: 'Current User'
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 100); // Keep only the last 100 logs
    setActivityLogs(updatedLogs);
    localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const itemToDelete = inventoryItems.find(item => item.id === id);
        await axios.delete(`/api/inventory/${id}`);
        setInventoryItems(inventoryItems.filter(item => item.id !== id));

        // Log the activity
        if (itemToDelete) {
          const newLog: ActivityLog = {
            id: Date.now().toString(),
            itemId: id,
            itemName: itemToDelete.name,
            action: 'delete',
            previousQuantity: itemToDelete.quantity,
            newQuantity: 0,
            timestamp: new Date().toISOString(),
            user: 'Current User'
          };

          const updatedLogs = [newLog, ...activityLogs].slice(0, 100); // Keep only the last 100 logs
          setActivityLogs(updatedLogs);
          localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
        }
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      }
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItemId(item.id);
    editForm.setFieldsValue(item);
    setEditModalVisible(true);
  };

  const handleUpdateItem = async (values: any) => {
    try {
      if (!editingItemId) return;

      const originalItem = inventoryItems.find(item => item.id === editingItemId);

      // Create a payload with only the fields that the API expects
      const updatePayload = {
        sku: values.sku,
        name: values.name,
        size: values.size,
        unit: values.unit,
        quantity: values.quantity,
        price: values.price,
        productType: values.productType
      };

      const response = await axios.put(`/api/inventory/${editingItemId}`, updatePayload);

      // Update the item in the local state
      const updatedItems = inventoryItems.map(item => 
        item.id === editingItemId ? { ...item, ...values } : item
      );

      setInventoryItems(updatedItems);
      localStorage.setItem('inventoryItemsWithProductType', JSON.stringify(updatedItems));

      // Log the activity if quantity changed
      if (originalItem && originalItem.quantity !== values.quantity) {
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          itemId: editingItemId,
          itemName: originalItem.name,
          action: 'update',
          previousQuantity: originalItem.quantity,
          newQuantity: values.quantity,
          timestamp: new Date().toISOString(),
          user: 'Current User'
        };

        const updatedLogs = [newLog, ...activityLogs].slice(0, 100); // Keep only the last 100 logs
        setActivityLogs(updatedLogs);
        localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
      }

      message.success('Item updated successfully');
      setEditModalVisible(false);
      setEditingItemId(null);
    } catch (error) {
      console.error('Error updating item:', error);
      message.error('Failed to update item');
    }
  };

  const handleAddProductType = () => {
    if (newProductType.trim() === '') {
      alert('Please enter a product type');
      return;
    }

    if (productTypes.includes(newProductType.trim())) {
      alert('Product type already exists');
      return;
    }

    const updatedProductTypes = [...productTypes, newProductType.trim()];
    setProductTypes(updatedProductTypes);
    localStorage.setItem('inventoryProductTypes', JSON.stringify(updatedProductTypes));
    setNewProductType('');
    setShowProductTypeDialog(false);
  };

  const logActivity = (
    itemId: string,
    itemName: string,
    action: 'increment' | 'decrement' | 'update' | 'add' | 'delete' | 'sale',
    previousQuantity?: number,
    newQuantity?: number,
    invoiceId?: string
  ) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      itemId,
      itemName,
      action,
      previousQuantity,
      newQuantity: newQuantity || 0,
      timestamp: new Date().toISOString(),
      user: 'Current User', // In a real app, this would be the logged-in user
      invoiceId
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 100); // Keep only the last 100 logs
    setActivityLogs(updatedLogs);
    localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
  };

  const recordSale = (
    itemId: string,
    itemName: string,
    quantity: number,
    price: number,
    invoiceId: string
  ) => {
    const newSale: SalesRecord = {
      id: Date.now().toString(),
      itemId,
      itemName,
      quantity,
      price,
      total: quantity * price,
      timestamp: new Date().toISOString(),
      invoiceId
    };

    const updatedSales = [newSale, ...salesRecords];
    setSalesRecords(updatedSales);
    localStorage.setItem('inventorySalesRecords', JSON.stringify(updatedSales));

    // Update monthly sales data
    updateMonthlySalesData(itemId, itemName, quantity, price);
  };

  const updateMonthlySalesData = (
    itemId: string,
    itemName: string,
    quantity: number,
    price: number
  ) => {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear().toString();
    const monthYear = `${month} ${year}`;

    const existingEntryIndex = monthlySalesData.findIndex(
      data => data.itemId === itemId && data.month === month && data.year === year
    );

    if (existingEntryIndex >= 0) {
      // Update existing entry
      const updatedData = [...monthlySalesData];
      updatedData[existingEntryIndex] = {
        ...updatedData[existingEntryIndex],
        quantitySold: updatedData[existingEntryIndex].quantitySold + quantity,
        revenue: updatedData[existingEntryIndex].revenue + (quantity * price)
      };
      setMonthlySalesData(updatedData);
    } else {
      // Create new entry
      const newEntry: MonthlySalesData = {
        itemId,
        itemName,
        quantitySold: quantity,
        revenue: quantity * price,
        month,
        year
      };
      setMonthlySalesData([...monthlySalesData, newEntry]);
    }

    localStorage.setItem('inventoryMonthlySalesData', JSON.stringify(monthlySalesData));
  };

  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity < 10).length;

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading inventory...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Typography.Title level={2} className="mb-2">Inventory Management</Typography.Title>
            <Typography.Text type="secondary">Manage your inventory items efficiently</Typography.Text>
          </div>
          <Space>
            <Button 
              type="default" 
              icon={<AppstoreOutlined />} 
              onClick={() => setShowActivityLog(!showActivityLog)}
            >
              {showActivityLog ? 'Hide Activity Log' : 'Show Activity Log'}
            </Button>
            <Button 
              type="primary" 
              icon={<DollarOutlined />} 
              onClick={() => {
                // Show monthly sales report for current month
                const currentMonth = new Date().toLocaleString('default', { month: 'long' });
                const currentYear = new Date().getFullYear().toString();
                const report = getMonthlySalesReport(currentMonth, currentYear);

                Modal.info({
                  title: `${currentMonth} ${currentYear} Sales Report`,
                  width: 800,
                  content: (
                    <div className="mt-4">
                      {report.length === 0 ? (
                        <p>No sales data for this month</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="py-3 px-4 text-left border-b">Item</th>
                                <th className="py-3 px-4 text-left border-b">Quantity Sold</th>
                                <th className="py-3 px-4 text-left border-b">Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="py-3 px-4 border-b">{item.itemName}</td>
                                  <td className="py-3 px-4 border-b">{item.quantitySold}</td>
                                  <td className="py-3 px-4 border-b">${item.revenue.toFixed(2)}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50 font-bold">
                                <td className="py-3 px-4 border-b">Total</td>
                                <td className="py-3 px-4 border-b">
                                  {report.reduce((sum, item) => sum + item.quantitySold, 0)}
                                </td>
                                <td className="py-3 px-4 border-b">
                                  ${report.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                });
              }}
            >
              Monthly Sales Report
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className="mb-6"
            closable
            onClose={() => setError('')}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <InboxOutlined className="text-blue-600 text-xl" />
              </div>
              <div>
                <Typography.Text type="secondary">Total Items</Typography.Text>
                <Typography.Title level={4} className="m-0">{inventoryItems.length}</Typography.Title>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <DollarOutlined className="text-green-600 text-xl" />
              </div>
              <div>
                <Typography.Text type="secondary">Total Value</Typography.Text>
                <Typography.Title level={4} className="m-0">${totalValue.toFixed(2)}</Typography.Title>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <WarningOutlined className="text-yellow-600 text-xl" />
              </div>
              <div>
                <Typography.Text type="secondary">Low Stock Items</Typography.Text>
                <Typography.Title level={4} className="m-0">{lowStockItems}</Typography.Title>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <AppstoreOutlined className="text-purple-600 text-xl" />
              </div>
              <div>
                <Typography.Text type="secondary">Product Types</Typography.Text>
                <Typography.Title level={4} className="m-0">{productTypes.length}</Typography.Title>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <Typography.Title level={4} className="m-0">Inventory Items</Typography.Title>
            <div className="flex space-x-2">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowProductTypeDialog(true)}
              >
                Add Product Type
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table
              dataSource={inventoryItems}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            >
              <Table.Column
                title="SKU"
                dataIndex="sku"
                key="sku"
                sorter={(a, b) => a.sku.localeCompare(b.sku)}
              />
              <Table.Column
                title="Name"
                dataIndex="name"
                key="name"
                sorter={(a, b) => a.name.localeCompare(b.name)}
              />
              <Table.Column
                title="Size"
                dataIndex="size"
                key="size"
              />
              <Table.Column
                title="Unit"
                dataIndex="unit"
                key="unit"
              />
              <Table.Column
                title="Quantity"
                dataIndex="quantity"
                key="quantity"
                sorter={(a, b) => a.quantity - b.quantity}
                render={(quantity, record) => (
                  <div className="flex items-center">
                    <Button
                      size="small"
                      icon={<MinusOutlined />}
                      disabled={quantity <= 0}
                      onClick={async () => {
                        try {
                          if (quantity > 0) {
                            await axios.put(`/api/inventory/${record.id}`, { 
                              ...record, 
                              quantity: quantity - 1 
                            });
                            logActivity(record.id, record.name, 'decrement', quantity, quantity - 1);
                            fetchInventoryItems();
                          }
                        } catch (error) {
                          console.error('Error updating quantity:', error);
                          message.error('Failed to update quantity');
                        }
                      }}
                    />
                    <span className="mx-2">{quantity}</span>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={async () => {
                        try {
                          await axios.put(`/api/inventory/${record.id}`, { 
                            ...record, 
                            quantity: quantity + 1 
                          });
                          logActivity(record.id, record.name, 'increment', quantity, quantity + 1);
                          fetchInventoryItems();
                        } catch (error) {
                          console.error('Error updating quantity:', error);
                          message.error('Failed to update quantity');
                        }
                      }}
                    />
                  </div>
                )}
              />
              <Table.Column
                title="Price"
                dataIndex="price"
                key="price"
                sorter={(a, b) => a.price - b.price}
                render={(price) => `$${price.toFixed(2)}`}
              />
              <Table.Column
                title="Product Type"
                dataIndex="productType"
                key="productType"
                filters={productTypes.map(type => ({ text: type, value: type }))}
                onFilter={(value, record) => record.productType === value}
                render={(productType) => (
                  <Tag color="blue">{productType}</Tag>
                )}
              />
              <Table.Column
                title="Actions"
                key="actions"
                render={(_, record) => (
                  <Space size="middle">
                    <Tooltip title="Edit">
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditItem(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Delete">
                      <Button
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
          </div>
        </Card>

        <FixedAddItemComponent
          productTypes={productTypes}
          onItemAdded={handleItemAdded}
        />

        {/* Add Product Type Modal */}
        <Modal
          title="Add New Product Type"
          open={showProductTypeDialog}
          onCancel={() => setShowProductTypeDialog(false)}
          footer={null}
          width={500}
        >
          <Divider />
          <div className="mb-4">
            <Input
              placeholder="Enter product type"
              value={newProductType}
              onChange={(e) => setNewProductType(e.target.value)}
              onPressEnter={handleAddProductType}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowProductTypeDialog(false)}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleAddProductType}
              size="large"
              icon={<PlusOutlined />}
            >
              Add
            </Button>
          </div>
        </Modal>

        {/* Edit Item Modal */}
        <Modal
          title={
            <div className="flex items-center">
              <AppstoreOutlined className="mr-2 text-blue-500" />
              <span>Edit Inventory Item</span>
            </div>
          }
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingItemId(null);
          }}
          footer={null}
          width={700}
          className="inventory-edit-modal"
        >
          <Divider />
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateItem}
            autoComplete="off"
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="sku"
                  label="SKU"
                  rules={[{ required: true, message: 'Please input SKU!' }]}
                >
                  <Input placeholder="Enter SKU" prefix={<AppstoreOutlined className="text-gray-400" />} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Name"
                  rules={[{ required: true, message: 'Please input name!' }]}
                >
                  <Input placeholder="Enter name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="size"
                  label="Size"
                >
                  <Input placeholder="Enter size" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="unit"
                  label="Unit"
                >
                  <Input placeholder="Enter unit" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="quantity"
                  label="Quantity"
                  rules={[{ required: true, message: 'Please input quantity!' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Enter quantity"
                    addonBefore={
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => {
                          const currentValue = editForm.getFieldValue('quantity') || 0;
                          if (currentValue > 0) {
                            editForm.setFieldsValue({ quantity: currentValue - 1 });
                          }
                        }}
                      />
                    }
                    addonAfter={
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const currentValue = editForm.getFieldValue('quantity') || 0;
                          editForm.setFieldsValue({ quantity: currentValue + 1 });
                        }}
                      />
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="price"
                  label="Price ($)"
                  rules={[{ required: true, message: 'Please input price!' }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="Enter price"
                    prefix={<DollarOutlined className="text-gray-400" />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="productType"
                  label="Product Type"
                  rules={[{ required: true, message: 'Please select product type!' }]}
                >
                  <Select placeholder="Select product type">
                    {productTypes.map(type => (
                      <Select.Option key={type} value={type}>{type}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="cpPerPiece"
                  label="Cost Per Piece ($)"
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="Enter cost per piece"
                    prefix={<DollarOutlined className="text-gray-400" />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="ratePerInch"
              label="Rate Per Inch ($)"
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="Enter rate per inch"
                prefix={<DollarOutlined className="text-gray-400" />}
              />
            </Form.Item>

            <Divider />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setEditingItemId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<EditOutlined />}
              >
                Update Item
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Activity Log */}
        {showActivityLog && (
          <Card className="shadow-sm mb-6" title="Activity Log">
            {activityLogs.length === 0 ? (
              <div className="text-center py-8">
                <Typography.Text type="secondary">No activity logs found</Typography.Text>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left border-b">Time</th>
                      <th className="py-3 px-4 text-left border-b">Item</th>
                      <th className="py-3 px-4 text-left border-b">Action</th>
                      <th className="py-3 px-4 text-left border-b">Quantity Change</th>
                      <th className="py-3 px-4 text-left border-b">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => {
                      const date = new Date(log.timestamp);
                      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

                      let actionColor = 'blue';
                      let actionText = log.action;

                      switch (log.action) {
                        case 'increment':
                          actionColor = 'green';
                          actionText = 'Increased';
                          break;
                        case 'decrement':
                          actionColor = 'orange';
                          actionText = 'Decreased';
                          break;
                        case 'update':
                          actionColor = 'blue';
                          actionText = 'Updated';
                          break;
                        case 'add':
                          actionColor = 'green';
                          actionText = 'Added';
                          break;
                        case 'delete':
                          actionColor = 'red';
                          actionText = 'Deleted';
                          break;
                        case 'sale':
                          actionColor = 'purple';
                          actionText = 'Sold';
                          break;
                      }

                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">{formattedDate}</td>
                          <td className="py-3 px-4 border-b font-medium">{log.itemName}</td>
                          <td className="py-3 px-4 border-b">
                            <Tag color={actionColor}>{actionText}</Tag>
                          </td>
                          <td className="py-3 px-4 border-b">
                            {log.previousQuantity !== undefined ? (
                              <span>
                                {log.previousQuantity} → {log.newQuantity}
                              </span>
                            ) : (
                              <span>{log.newQuantity}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 border-b">
                            {log.user}
                            {log.action === 'sale' && log.invoiceId && (
                              <div className="text-xs text-gray-500">Invoice: {log.invoiceId}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default InventoryScreen;
