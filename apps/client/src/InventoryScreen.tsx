import React, { useState, useEffect } from 'react';
import axios from './api';
import ProductForm from './components/ProductForm';
import { inventoryService } from './services/inventoryService';
import { eventBus } from './services/eventBus';
import { localStorageService } from './services/localStorageService';

// Set correct API URL
axios.defaults.baseURL = '/api';
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
  Alert,
  DatePicker
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
PlusOutlined, 
  MinusOutlined,
  InboxOutlined,

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
import { Link } from 'react-router-dom';

// Exported functions are now imported from inventoryOperations.ts

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    // Use the same data source as SimpleProductTab
    const savedItems = localStorage.getItem('erp_inventory');
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
        costPricePerInch: Number(item.costPricePerInch) || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<string[]>(['TRADED', 'MANUFACTURED']);
  const [showProductTypeDialog, setShowProductTypeDialog] = useState(false);
  const [newProductType, setNewProductType] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [productForm] = Form.useForm();
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
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
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInventoryItems, setFilteredInventoryItems] = useState<InventoryItem[]>([]);
  const [isLowStockModalVisible, setIsLowStockModalVisible] = useState(false);
  const [activityDateRange, setActivityDateRange] = useState<[any, any]>([null, null]);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      // Use the same data source as SimpleProductTab
      const items = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
      
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
        costPricePerInch: Number(item.costPricePerInch) || 0,
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

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = inventoryItems.filter(item =>
      item.name.toLowerCase().includes(lowercasedSearchTerm) ||
      item.sku.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredInventoryItems(filtered);
  }, [searchTerm, inventoryItems]);

  // Function to update stock levels from invoice data
  const updateStockFromInvoice = async (invoiceItems: any[], invoiceId: string) => {
    try {
      for (const item of invoiceItems) {
        if (item.itemCode && item.quantity) {
          // Update stock level via API
          await inventoryService.updateStockLevel(item.itemCode, -item.quantity);
          
          // Find item details to log the sale correctly
          const soldItem = inventoryItems.find(invItem => invItem.sku === item.itemCode);
          recordSale(soldItem?.id || item.itemCode, item.name, item.quantity, item.price, invoiceId);
        }
      }
      message.success('Stock levels updated from invoice data');
      fetchInventoryItems();
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
    // Save updated items to localStorage
    console.log('Saving updated items to localStorage:', updatedItems);
    // Log each item's productType specifically
    updatedItems.forEach((item, index) => {
      console.log(`Item ${index} productType:`, item.productType);
    });
    
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

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const itemToDelete = inventoryItems.find(item => item.id === id);
      
      const updatedItems = inventoryItems.filter(item => item.id !== id);
      setInventoryItems(updatedItems);
      localStorage.setItem('erp_inventory', JSON.stringify(updatedItems));

      if (itemToDelete) {
        logActivity(id, itemToDelete.name, 'delete', itemToDelete.quantity, 0);
      }
      
      message.success('Item deleted successfully.');
    }
  };

  const handleEditItem = (id: string) => {
    const itemToEdit = inventoryItems.find(item => item.id === id);
    if (itemToEdit) {
      setEditingItemId(id);
      editForm.setFieldsValue({
        sku: itemToEdit.sku,
        name: itemToEdit.name,
        size: itemToEdit.size,
        unit: itemToEdit.unit,
        quantity: itemToEdit.quantity,
        price: itemToEdit.price, // This is ratePerPiece
        productType: itemToEdit.productType,
        cpPerPiece: itemToEdit.cpPerPiece || 0,
        ratePerInch: itemToEdit.ratePerInch || 0,
        costPricePerInch: itemToEdit.costPricePerInch || 0
      });
      setEditModalVisible(true);
    }
  };

  const handleUpdateItem = async (values: any) => {
    try {
      if (!editingItemId) return;

      const originalItem = inventoryItems.find(item => item.id === editingItemId);

      // Create the updated item object from the form values
      const updatedItem = {
        ...originalItem, // Preserve existing fields like id, createdAt etc.
        ...values
      };

      // Update the state
      const updatedItems = inventoryItems.map(item =>
        item.id === editingItemId ? updatedItem : item
      );
      setInventoryItems(updatedItems);

      // Save the entire updated list to localStorage, mimicking other functions in this file
      localStorage.setItem('erp_inventory', JSON.stringify(updatedItems));

      // Log the activity if quantity changed
      if (originalItem && originalItem.quantity !== values.quantity) {
        logActivity(editingItemId, originalItem.name, 'update', originalItem.quantity, values.quantity);
      }

      message.success('Item updated successfully');
      setEditModalVisible(false);
      setEditingItemId(null);
    } catch (error: any) {
      console.error('Error updating item:', error);
      message.error('Failed to update item locally.');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    productForm.resetFields();
    setIsProductModalVisible(true);
  };

  const handleProductFormSubmit = async (values: any) => {
    if (!values.sku || !values.name || !values.productCategory) {
      message.error('SKU, Name, and Product Category are required');
      return;
    }

    try {
      if (editingProduct) {
        const updatedProduct: InventoryItem = {
          ...editingProduct,
          sku: values.sku,
          name: values.name,
          quantity: values.quantity || 0,
          price: values.ratePerPiece || 0,
          productType: values.productType,
          size: values.size || '',
          unit: values.unit || '',
          cpPerPiece: values.costPricePerPiece || 0,
          ratePerInch: values.ratePerInch || 0,
          costPricePerInch: values.costPricePerInch || 0,
          updatedAt: new Date().toISOString(),
        };
        const currentProducts = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
        const updatedProducts = currentProducts.map((p: any) =>
          p.id === editingProduct.id ? updatedProduct : p
        );
        localStorage.setItem('erp_inventory', JSON.stringify(updatedProducts));
        setInventoryItems(updatedProducts);
        message.success('Product updated successfully');
      } else {
        const newProduct: InventoryItem = {
          id: Date.now().toString(),
          sku: values.sku,
          name: values.name,
          quantity: values.quantity || 0,
          price: values.ratePerPiece || 0,
          productType: values.productType,
          size: values.size || '',
          unit: values.unit || '',
          cpPerPiece: values.costPricePerPiece || 0,
          ratePerInch: values.ratePerInch || 0,
          costPricePerInch: values.costPricePerInch || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const currentProducts = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
        const updatedProducts = [...currentProducts, newProduct];
        localStorage.setItem('erp_inventory', JSON.stringify(updatedProducts));
        setInventoryItems(updatedProducts);
        message.success('Product added successfully');
      }

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('inventory:updated'));

      setIsProductModalVisible(false);
      setEditingProduct(null);
      productForm.resetFields();
    } catch (error: any) {
      message.error('Failed to save product');
      console.error(error);
    }
  };

  const handleAddProductType = () => {
    if (newProductType.trim() === '') {
      message.error('Please enter a product type');
      return;
    }

    if (productTypes.includes(newProductType.trim())) {
      message.error('Product type already exists');
      return;
    }

    const updatedProductTypes = [...productTypes, newProductType.trim()];
    setProductTypes(updatedProductTypes);
    localStorage.setItem('inventoryProductTypes', JSON.stringify(updatedProductTypes));
    message.success(`Product type "${newProductType.trim()}" added successfully`);
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
    // Create a properly formatted timestamp
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

    const newLog: ActivityLog = {
      id: `${Date.now()}-${Math.random()}`,
      itemId,
      itemName,
      action,
      previousQuantity,
      newQuantity: newQuantity || 0,
      timestamp,
      user: 'Current User', // In a real app, this would be the logged-in user
      invoiceId
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 100); // Keep only the last 100 logs
    setActivityLogs(updatedLogs);
    localStorage.setItem('inventoryActivityLogs', JSON.stringify(updatedLogs));
  };

  // Function to group similar actions in the activity log
  const groupActivityLogs = (logs: ActivityLog[]) => {
    const groupedLogs: ActivityLog[][] = [];
    const processedLogs = new Set<string>();

    // First pass: group consecutive actions of the same type on the same item within a short time frame
    for (let i = 0; i < logs.length; i++) {
      if (processedLogs.has(logs[i].id)) continue;
      
      const currentLog = logs[i];
      const group: ActivityLog[] = [currentLog];
      processedLogs.add(currentLog.id);
      
      // Look for similar actions within 5 minutes
      const currentTime = new Date(currentLog.timestamp).getTime();
      const fiveMinutesInMs = 5 * 60 * 1000;
      
      for (let j = i + 1; j < logs.length; j++) {
        if (processedLogs.has(logs[j].id)) continue;
        
        const nextLog = logs[j];
        const nextTime = new Date(nextLog.timestamp).getTime();
        
        // Check if actions are similar and within time frame
        // Special handling for finalize action - it should never be grouped
        if (
          currentLog.action !== 'finalize' &&
          nextLog.action !== 'finalize' &&
          currentLog.itemId === nextLog.itemId &&
          currentLog.action === nextLog.action &&
          Math.abs(currentTime - nextTime) <= fiveMinutesInMs
        ) {
          group.push(nextLog);
          processedLogs.add(nextLog.id);
        } else {
          break;
        }
      }
if (group.length > 1) {
        groupedLogs.push(group);
      } else {
        groupedLogs.push([currentLog]);
      }
    }
    
    return groupedLogs;
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

    // Log the sale in the main activity log
    logActivity(itemId, itemName, 'sale', undefined, quantity, invoiceId);
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

  // Function to be called when items are added to an invoice - now moved outside
  // This function is now in inventoryOperations.ts

  // Function to be called when items are removed from an invoice - now moved outside
  // This function is now in inventoryOperations.ts

  // Function to get monthly sales data for a specific item - now moved outside
  // This function is now in inventoryOperations.ts

  // Function to get all sales data for a specific month - now moved outside
  // This function is now in inventoryOperations.ts

  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = inventoryItems.filter(item => (item.productType?.toString().toUpperCase() !== 'MANUFACTURED') && item.quantity < 10).length;

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading inventory...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
          </div>
          <Space>
            <Button 
              type="default" 
              icon={<AppstoreOutlined />} 
              onClick={() => setShowActivityLog(!showActivityLog)}
            >
              {showActivityLog ? 'Hide Activity Log' : 'Show Activity Log'}
            </Button>
            <Link to="/reports">
              <Button 
                type="primary" 
                icon={'₹'}
              >
                Monthly Sales Report
              </Button>
            </Link>
          </Space>
        </div>

        {error && (
          <Alert 
            message="Error" 
            description={error} 
            type="error" 
            className="mb-6"
            closable
            onClose={() => setError('')}
          />
        )}

        <Row gutter={[16, 16]} className="mb-6">
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
                  <span className="text-green-600 text-xl">₹</span>
                </div>
                <div>
                  <Typography.Text type="secondary" className="block">Total Value</Typography.Text>
                  <Typography.Title level={3} className="my-0">₹{totalValue.toFixed(2)}</Typography.Title>
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
                  <Button type="link" onClick={() => setIsLowStockModalVisible(true)}>Show Low Stock Items</Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Modal
          title="Low Stock Items"
          open={isLowStockModalVisible}
          onCancel={() => setIsLowStockModalVisible(false)}
          footer={null}
        >
          <Table
            dataSource={inventoryItems.filter(item => (item.productType?.toString().toUpperCase() !== 'MANUFACTURED') && item.quantity < 10)}
            rowKey="id"
            pagination={false}
          >
            <Table.Column title="Name" dataIndex="name" key="name" />
            <Table.Column title="SKU" dataIndex="sku" key="sku" />
            <Table.Column title="Stock" dataIndex="quantity" key="quantity" />
          </Table>
        </Modal>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddProduct}
        style={{ marginBottom: '16px' }}
      >
        Add New Product
      </Button>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={isProductModalVisible}
        onCancel={() => {
          setIsProductModalVisible(false);
          setEditingProduct(null);
        }}
        footer={null}
        width={700}
      >
        <ProductForm
          form={productForm}
          onFinish={handleProductFormSubmit}
          onCancel={() => {
            setIsProductModalVisible(false);
            setEditingProduct(null);
          }}
          isEditing={!!editingProduct}
          productTypes={productTypes}
          initialValues={editingProduct}
        />
      </Modal>

      <Input
        placeholder="Search by name or SKU"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ marginBottom: '16px', width: '300px' }}
      />

      <Card className="shadow-sm mb-6">
        <Table
          dataSource={filteredInventoryItems}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              console.log('Page changed:', page, 'Size:', size);
              setCurrentPage(page);
              if (size) {
                setPageSize(size);
              }
            },
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100', '500', '1000', '1500', '2000', '3000'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 800 }}
        >
          <Table.Column
            title="S.No."
            key="sno"
            render={(_: any, record: InventoryItem, index: number) => (currentPage - 1) * pageSize + index + 1}
          />
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
            title="Size"
            dataIndex="size"
            key="size"
            render={(text: string) => (
              <div className="font-medium">{text}</div>
            )}
          />
          <Table.Column
            title="Unit"
            dataIndex="unit"
            key="unit"
            render={(text: string) => (
              <div className="font-medium">{text}</div>
            )}
          />
          <Table.Column
            title="Quantity"
            dataIndex="quantity"
            key="quantity"
            render={(quantity: number, record: InventoryItem) => {
              const displayQuantity = record.productType === 'Manufactured' && quantity < 0 ? Math.abs(quantity) : quantity;
              const isLowStock = (record.productType?.toString().toUpperCase() === 'TRADED') && quantity < 10;

              return (
                <div className="flex items-center space-x-2">
                  <Button 
                    size="small" 
                    icon={<MinusOutlined />} 
                    onClick={async () => {
                      try {
                        const updatedItem = {
                          ...record,
                          quantity: quantity - 1,
                        };
                        // Update in shared data source
                        localStorageService.updateItem('inventory', record.id, updatedItem);
                        
                        // Update local state
                        setInventoryItems(prevItems =>
                          prevItems.map(item =>
                            item.id === record.id ? updatedItem : item
                          )
                        );

                        logActivity(record.id, record.name, 'decrement', quantity, quantity - 1);
                      } catch (error) {
                        console.error('Error updating quantity:', error);
                        message.error('Failed to update quantity');
                      }
                    }}
                    className="flex items-center justify-center"
                  />
                  <span className={`font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                    {displayQuantity}
                    {isLowStock && (
                      <Tag color="red" className="ml-2">Low</Tag>
                    )}
                  </span>
                  <Button 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={async () => {
                      try {
                        // Update in shared data source
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
                      } catch (error) {
                        console.error('Error updating quantity:', error);
                        message.error('Failed to update quantity');
                      }
                    }}
                    className="flex items-center justify-center"
                  />
                </div>
              );
            }}
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
            title="Rate Per Piece"
            dataIndex="price"
            key="price"
            render={(price: number) => (
              <div className="font-medium">₹{price ? price.toFixed(2) : '0.00'}</div>
            )}
          />
          <Table.Column
            title="Rate Per Inch"
            dataIndex="ratePerInch"
            key="ratePerInch"
            render={(ratePerInch: number) => (
              <div className="font-medium">₹{ratePerInch ? ratePerInch.toFixed(2) : '0.00'}</div>
            )}
          />
          <Table.Column
            title="Cost Price Per Inch"
            dataIndex="costPricePerInch"
            key="costPricePerInch"
            render={(costPricePerInch: number) => (
              <div className="font-medium">₹{costPricePerInch ? costPricePerInch.toFixed(2) : '0.00'}</div>
            )}
          />
          <Table.Column
            title="Cost Per Piece"
            dataIndex="cpPerPiece"
            key="cpPerPiece"
            render={(cpPerPiece: number) => (
              <div className="font-medium">₹{cpPerPiece ? cpPerPiece.toFixed(2) : '0.00'}</div>
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
                    onClick={() => handleEditItem(record.id)}
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

      {/* Add Product Type Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <AppstoreOutlined className="mr-2 text-green-500" />
            <span>Add New Product Type</span>
          </div>
        }
        open={showProductTypeDialog}
        onCancel={() => setShowProductTypeDialog(false)}
        footer={null}
        width={400}
      >
        <Divider />
        <div className="mb-4">
          <Input
            value={newProductType}
            onChange={(e) => setNewProductType(e.target.value)}
            placeholder="Enter product type"
            prefix={<AppstoreOutlined className="text-gray-400" />}
            size="large"
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
                  style={{ width: '100%' }} 
                  placeholder="Enter quantity"
                  addonBefore={
                    <Button 
                      size="small" 
                      icon={<MinusOutlined />} 
                      onClick={() => {
                        const currentValue = editForm.getFieldValue('quantity') || 0;
                        editForm.setFieldsValue({ quantity: currentValue - 1 });
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
                name="price"
                label="Rate Per Piece (₹)"
              >
                <InputNumber 
                  min={0} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  placeholder="Enter rate per piece"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cpPerPiece"
                label="Cost Per Piece (₹)"
              >
                <InputNumber 
                  min={0} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  placeholder="Enter cost per piece"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ratePerInch"
                label="Rate Per Inch (₹)"
              >
                <InputNumber 
                  min={0} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  placeholder="Enter rate per inch"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="costPricePerInch"
            label="Cost Price Per Inch (₹)"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }} 
              placeholder="Enter cost per inch"
              prefix="₹"
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
      {showActivityLog && (() => {
        const filteredLogs = activityLogs.filter(log => {
          if (!activityDateRange || !activityDateRange[0] || !activityDateRange[1]) {
            return true;
          }
          const logDate = new Date(log.timestamp);
          const startDate = new Date(activityDateRange[0]);
          const endDate = new Date(activityDateRange[1]);
          endDate.setHours(23, 59, 59, 999); // Include whole end day
          return logDate >= startDate && logDate <= endDate;
        });

        return (
          <Card className="shadow-sm mb-6" title="Activity Log">
            <DatePicker.RangePicker
              onChange={(dates, dateStrings) => setActivityDateRange(dateStrings as [any, any])}
              style={{ marginBottom: 16 }}
            />
            {filteredLogs.length === 0 ? (
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
                      <th className="py-3 px-4 text-left border-b">Details</th>
                      <th className="py-3 px-4 text-left border-b">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupActivityLogs(filteredLogs).map((group, groupIndex) => {
                      if (group.length === 1) {
                        // Single action
                        const log = group[0];
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
                          case 'finalize':
                            actionColor = 'gold';
                            actionText = 'Finalized';
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
                              {log.action === 'finalize' ? (
                                <span>Invoice: {log.invoiceId}</span>
                              ) : log.previousQuantity !== undefined ? (
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
                      } else {
                        // Grouped actions
                        const firstLog = group[0];
                        const lastLog = group[group.length - 1];
                        const firstDate = new Date(firstLog.timestamp);
                        const lastDate = new Date(lastLog.timestamp);
                        
                        // Format dates to show time range
                        const firstFormattedTime = `${firstDate.toLocaleDateString()} ${firstDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                        const lastFormattedTime = `${lastDate.toLocaleDateString()} ${lastDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                        
                        // Calculate total quantity change
                        const totalQuantityChange = group.reduce((sum, log) => {
                          const prevQty = log.previousQuantity ?? 0;
                          const newQty = log.newQuantity ?? 0;
                          
                          if (log.action === 'add') {
                            return sum + newQty;
                          }
                          if (log.action === 'delete') {
                            return sum - prevQty;
                          }
                          
                          // For update, increment, decrement, sale
                          return sum + (newQty - prevQty);
                        }, 0);
                        
                        let actionColor = 'blue';
                        let actionText = firstLog.action;
                        let actionCount = group.length;
                        
                        switch (firstLog.action) {
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
                          case 'finalize':
                            actionColor = 'gold';
                            actionText = 'Finalized';
                            break;
                        }
                        
                        return (
                          <tr key={`group-${groupIndex}`} className="hover:bg-gray-50 bg-blue-50">
                            <td className="py-3 px-4 border-b">
                              <div className="flex flex-col">
                                <span className="font-medium">{firstFormattedTime}</span>
                                <span className="text-xs text-gray-500">to {lastFormattedTime}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b font-medium">{firstLog.itemName}</td>
                            <td className="py-3 px-4 border-b">
                              <div className="flex items-center space-x-2">
                                <Tag color={actionColor}>{actionText}</Tag>
                                <span className="text-xs bg-gray-200 rounded-full px-2 py-1">
                                  {actionCount} times
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              {firstLog.action === 'finalize' ? (
                                <span className="font-medium">Invoice: {firstLog.invoiceId}</span>
                              ) : (
                                <span className="font-medium">
                                  {totalQuantityChange > 0 ? '+' : ''}{totalQuantityChange}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 border-b">
                              {firstLog.user}
                              {firstLog.action === 'sale' && firstLog.invoiceId && (
                                <div className="text-xs text-gray-500">Invoice: {firstLog.invoiceId}</div>
                              )}
                              <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline" 
                                   onClick={() => {
                                    // Toggle expanded view for this group
                                    const expandedRow = document.getElementById(`expanded-${groupIndex}`);
                                    if (expandedRow) {
                                      expandedRow.classList.toggle('hidden');
                                    }
                                  }}>
                                Show details ({group.length} actions)
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    })}
                    {/* Add expandable rows for grouped actions */}
                    {groupActivityLogs(filteredLogs).map((group, groupIndex) => {
                      if (group.length > 1) {
                        return (
                          <tr key={`expanded-${groupIndex}`} id={`expanded-${groupIndex}`} className="hidden bg-gray-50">
                            <td colSpan={5} className="p-4">
                              <div className="bg-white rounded-lg shadow p-4">
                                <h4 className="font-medium mb-3">Detailed Actions ({group.length})</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border border-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="py-2 px-3 text-left border-b text-sm">Time</th>
                                        <th className="py-2 px-3 text-left border-b text-sm">Action</th>
                                        <th className="py-2 px-3 text-left border-b text-sm">Details</th>
                                        <th className="py-2 px-3 text-left border-b text-sm">User</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.map((log) => {
                                        const date = new Date(log.timestamp);
                                        const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                        
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
                                            <td className="py-2 px-3 border-b text-sm">{formattedTime}</td>
                                            <td className="py-2 px-3 border-b">
                                              <Tag color={actionColor} className="text-xs">{actionText}</Tag>
                                            </td>
                                            <td className="py-2 px-3 border-b text-sm">
                                              {log.action === 'finalize' ? (
                                                <span>Invoice: {log.invoiceId}</span>
                                              ) : log.previousQuantity !== undefined ? (
                                                <span>
                                                  {log.previousQuantity} → {log.newQuantity}
                                                </span>
                                              ) : (
                                                <span>{log.newQuantity}</span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 border-b text-sm">
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
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      })()}
      </div>
    </div>
  );
};



export default InventoryScreen;