// This file has been moved to components/frontend/AddItemButton.tsx

  ratePerPiece?: number;
  ratePerInch?: number;
  costPricePerInch?: number;
  costPricePerPiece?: number;
}

interface AddItemButtonProps {
  onAdd: (item: any) => void;
  products: Product[];
}

const AddItemButton: React.FC<AddItemButtonProps> = ({ onAdd, products }) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const showModal = () => {
    setVisible(true);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Transform the item with proper category detection
      const product = products.find(p => p.id === values.productId);
      const transformedItem = {
        ...values,
        category: product?.category || 
                  (product?.name?.toLowerCase().includes('mukut') ? 'laddu gopal mukut' : product?.productType) || '',
        rate: values.rate || 0,
        total: (values.rate || 0) * (values.quantity || 0),
      };

      onAdd(transformedItem);
      setVisible(false);
      message.success('Item added successfully');
    } catch (error) {
      message.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
        Add Item
      </Button>
      <Modal
        title="Add New Item"
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              showSearch
              placeholder="Select a product"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {products.map(product => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="rate"
            label="Rate"
            rules={[{ required: true, message: 'Please input rate' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="ratePerInch"
            label="Rate Per Inch"
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="size"
            label="Size"
          >
            <Input placeholder="Enter size" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddItemButton;
