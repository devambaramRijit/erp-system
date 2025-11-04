import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Table, 
  message, 
  InputNumber, 
  Card, 
  Row, 
  Col, 
  Typography,
  Space,
  Tag,
  Modal
} from 'antd';
import { PlusOutlined, MinusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { handleInvoiceItemAdd, handleInvoiceItemRemove } from '../services/inventoryOperations';
import { handleInvoiceFinalize } from '../utils/invoiceFinalization';
import { InventoryItem } from '../types/inventory';

interface InvoiceItem {
  id: string;
  itemCode: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const InvoiceGenerationTab: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [invoiceId] = useState<string>(`INV-${Date.now()}`);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load inventory items
    const savedItems = localStorage.getItem('inventoryItemsWithProductType');
    if (savedItems) {
      try {
        setInventoryItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Error parsing inventory items:', error);
        message.error('Failed to load inventory items');
      }
    }
  }, []);

  const handleAddItem = async () => {
    if (!selectedItem || quantity <= 0) {
      message.error('Please select an item and enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const success = await handleInvoiceItemAdd(selectedItem, quantity, invoiceId);
      if (success) {
        // Find the selected item to get its details
        const selectedItemDetails = inventoryItems.find(item => item.id === selectedItem);
        if (selectedItemDetails) {
          // Add item to invoice
          const newItem: InvoiceItem = {
            id: Date.now().toString(),
            itemCode: selectedItem,
            name: selectedItemDetails.name,
            quantity,
            price: selectedItemDetails.price,
            total: quantity * selectedItemDetails.price
          };
          setInvoiceItems([...invoiceItems, newItem]);
          message.success('Item added to invoice');
          setSelectedItem('');
          setQuantity(1);
        }
      }
    } catch (error) {
      message.error('Failed to add item to invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (item: InvoiceItem) => {
    setLoading(true);
    try {
      const success = await handleInvoiceItemRemove(item.itemCode, item.quantity, invoiceId);
      if (success) {
        setInvoiceItems(invoiceItems.filter(i => i.id !== item.id));
        message.success('Item removed from invoice');
      }
    } catch (error) {
      message.error('Failed to remove item from invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeInvoice = async () => {
    setLoading(true);
    try {
      const success = await handleInvoiceFinalize(invoiceItems, invoiceId);
      if (success) {
        message.success('Invoice finalized successfully');
        setInvoiceItems([]);
        setShowFinalizeModal(false);
      }
    } catch (error) {
      message.error('Failed to finalize invoice');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="p-6">
      <Typography.Title level={2}>Invoice Generation</Typography.Title>

      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={8}>
            <Select
              placeholder="Select an item"
              value={selectedItem}
              onChange={setSelectedItem}
              style={{ width: '100%' }}
              loading={loading}
            >
              {inventoryItems.map(item => (
                <Select.Option key={item.id} value={item.id}>
                  {item.sku} - {item.name} (${item.price.toFixed(2)})
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <InputNumber
              min={1}
              value={quantity}
              onChange={setQuantity}
              placeholder="Quantity"
              style={{ width: '100%' }}
              disabled={loading}
            />
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              style={{ width: '100%' }}
              loading={loading}
              disabled={!selectedItem}
            >
              Add Item
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Invoice Items" className="mb-6">
        <Table
          dataSource={invoiceItems}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No items added to invoice' }}
        >
          <Table.Column
            title="Item Code"
            dataIndex="itemCode"
            key="itemCode"
          />
          <Table.Column
            title="Name"
            dataIndex="name"
            key="name"
          />
          <Table.Column
            title="Quantity"
            dataIndex="quantity"
            key="quantity"
          />
          <Table.Column
            title="Price"
            dataIndex="price"
            key="price"
            render={(price: number) => `$${price.toFixed(2)}`}
          />
          <Table.Column
            title="Total"
            dataIndex="total"
            key="total"
            render={(total: number) => `$${total.toFixed(2)}`}
          />
          <Table.Column
            title="Actions"
            key="actions"
            render={(_, record: InvoiceItem) => (
              <Space>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(record)}
                  loading={loading}
                >
                  Remove
                </Button>
              </Space>
            )}
          />
        </Table>
        <div className="mt-4 text-right">
          <Typography.Title level={3}>
            Total: ${totalAmount.toFixed(2)}
          </Typography.Title>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="large"
            onClick={() => setShowFinalizeModal(true)}
            disabled={invoiceItems.length === 0}
            loading={loading}
            className="mt-4"
          >
            Finalize Invoice
          </Button>
        </div>
      </Card>

      <Modal
        title="Finalize Invoice"
        open={showFinalizeModal}
        onOk={handleFinalizeInvoice}
        onCancel={() => setShowFinalizeModal(false)}
        okText="Finalize"
        cancelText="Cancel"
        confirmLoading={loading}
      >
        <p>Are you sure you want to finalize this invoice?</p>
        <p>This will update the inventory and create an activity log entry.</p>
        <p>Total Amount: ${totalAmount.toFixed(2)}</p>
        <p>Number of Items: {invoiceItems.length}</p>
      </Modal>
    </div>
  );
};

export default InvoiceGenerationTab;
