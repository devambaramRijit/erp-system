<Modal
  title={editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
  open={visible}
  onOk={handleSaveInvoice}
  onCancel={() => setVisible(false)}
  width={800}
  footer={[
    <Button key="back" onClick={() => {
      setVisible(false);
      setSelectedCustomer(null); // Reset selected customer when closing modal
    }}>
      Cancel
    </Button>,
    <Button key="submit" type="primary" onClick={handleSaveInvoice} icon={<SaveOutlined />}>
      {editingInvoice ? 'Update' : 'Save'}
    </Button>,
  ]}
>
  <div style={{ marginBottom: 16, textAlign: 'right' }}>
    <Button icon={<EditOutlined />} onClick={refreshData}>
      Refresh Data
    </Button>
  </div>
  <Form form={form} layout="vertical">
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="invoiceNumber"
          label="Invoice Number"
          rules={[{ required: true, message: 'Please input invoice number!' }]}
        >
          <Input placeholder="Enter invoice number" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: 'Please input date!' }]}
        >
          <Input type="date" />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        {/* Invoice type is always manufactured */}
      </Col>
      <Col span={12}>
        <Form.Item
          name="customerId"
          label="Select Customer"
          rules={[{ required: true, message: 'Please select a customer!' }]}
        >
          <Select
            showSearch
            placeholder="Search and select a customer"
            optionFilterProp="children"
            onChange={handleCustomerSelect}
            filterOption={(input, option) => {
              if (!option || !option.value) return false;
              
              // Find the customer by ID
              const customer = customers.find(c => c.id === option.value);
              if (!customer) return false;
              
              // Search in customer ID, name, mobile numbers, city, and state
              const searchText = input.toLowerCase();
              return (
                (customer.id && customer.id.toLowerCase().includes(searchText)) ||
                (customer.customerName && customer.customerName.toLowerCase().includes(searchText)) ||
                (customer.mobileNumber1 && customer.mobileNumber1.toLowerCase().includes(searchText)) ||
                (customer.mobileNumber2 && customer.mobileNumber2.toLowerCase().includes(searchText)) ||
                (customer.city && customer.city.toLowerCase().includes(searchText)) ||
                (customer.state && customer.state.toLowerCase().includes(searchText))
              );
            }}
          >
            {customers.map(customer => (
              <Option key={customer.id} value={customer.id}>
                {customer.customerName}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        {/* Customer info fields moved below Add Customer button */}
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={8}>
        <Form.Item
          name="customerName"
          label="Customer Name"
        >
          <Input />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          name="customerEmail"
          label="Customer Email/Phone"
        >
          <Input />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          name="billingAddress"
          label="Billing Address"
        >
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} />
        </Form.Item>
      </Col>
    </Row>
    <Row>
      <Col span={24} style={{ textAlign: 'right', marginBottom: '20px' }}>
        <Button 
          type="primary" 
          onClick={() => {
            if (selectedCustomer) {
              // Get the updated values from the form
              const updatedValues = form.getFieldsValue(['customerName', 'customerEmail', 'billingAddress']);
              
              // Parse the billing address to extract individual components
              // This is a simplified approach - in a real app, you might want a more robust parser
              const addressParts = updatedValues.billingAddress.split(', ');
              const houseNumber = addressParts[0] || '';
              const city = addressParts[1] || '';
              const district = addressParts[2] || '';
              const stateAndPin = addressParts[3] || '';
              
              // Extract state and pin code
              const stateParts = stateAndPin.split(' - ');
              const state = stateParts[0] || '';
              const pinCode = stateParts[1] || '';
              
              // Extract landmark if present
              const landmarkMatch = updatedValues.billingAddress.match(/\(Landmark: (.+)\)/);
              const landmark = landmarkMatch ? landmarkMatch[1] : '';
              
              // Create the updated customer object
              const updatedCustomer = {
                ...selectedCustomer,
                customerName: updatedValues.customerName,
                mobileNumber1: updatedValues.customerEmail,
                houseNumber,
                city,
                district,
                state,
                pinCode,
                landmark
              };
              
              // Update customers list
              const updatedCustomers = customers.map(customer => 
                customer.id === selectedCustomer.id ? updatedCustomer : customer
              );
              setCustomers(updatedCustomers);
              
              // Save to localStorage
              localStorage.setItem('customers', JSON.stringify(updatedCustomers));
              
              // Update the selected customer
              setSelectedCustomer(updatedCustomer);
              
              // Update the current invoice if it exists
              if (currentInvoice) {
                setCurrentInvoice({
                  ...currentInvoice,
                  customerName: updatedCustomer.customerName,
                  customerEmail: updatedCustomer.mobileNumber1,
                  billingAddress: updatedValues.billingAddress,
                });
              }
              
              message.success('Customer information updated successfully');
            }
          }}
          disabled={!selectedCustomer}
        >
          Update Customer Information
        </Button>
      </Col>
    </Row>

    <Row>
      <Col span={24} style={{ textAlign: 'right', marginBottom: '20px' }}>
        <Button type="primary" onClick={() => setCustomerModalVisible(true)} icon={<PlusOutlined />}>
          Add Customer
        </Button>
      </Col>
    </Row>



    <Divider />

    <div className="invoice-items-header">
      <h3 style={{ color: "black", fontWeight: "bold" }}>Invoice Items</h3>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
        Add Item
      </Button>
    </div>

    {/* Table hidden - only showing Added Items Summary Table */}
    {/* <Table dataSource={currentInvoice?.items || []} columns={itemColumns} rowKey="id" pagination={false} /> */}
    
    {/* Added Items Summary Table */}
    <div style={{ marginTop: 20 }}>
      <h4 style={{ color: "black", fontWeight: "bold" }}>Items Summary</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Product Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Product Type</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Rate Per Inch</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Size</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Rate per Piece</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Quantity</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Unit</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Total</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentInvoice?.items.map((item) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.productCategory || ''}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {item.productCategory && item.productCategory.includes('Base') ? `₹${(item.ratePerInch || 1).toFixed(2)}` : ''}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {item.size || ''}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>₹{(item.rate || item.price || 0).toFixed(2)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.unit || 'pcs'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>₹{item.total.toFixed(2)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <Button 
                  size="small" 
                  type="primary" 
                  style={{ marginRight: '5px' }}
                  onClick={() => {
                    itemForm.setFieldsValue({
                      editingItemId: item.id,
                      productIdDisplay: item.name,
                      productId: item.productId,
                      productCategory: item.productCategory,
                      rate: item.rate || item.price,
                      ratePerInch: item.ratePerInch,
                      size: item.size,
                      quantity: item.quantity,
                      unit: item.unit
                    });
                    setSelectedProductCategory(item.productCategory);
                    setItemVisible(true);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  size="small" 
                  type="default"
                  icon={<CopyOutlined />}
                  style={{ marginRight: '5px' }}
                  onClick={() => {
                    if (currentInvoice) {
                      const newItem = {
                        ...item,
                        id: Date.now().toString(), // Generate new ID
                        name: `${item.name} (Copy)`
                      };
                      const updatedInvoice = {
                        ...currentInvoice,
                        items: [...currentInvoice.items, newItem]
                      };
                      setCurrentInvoice(updatedInvoice);
                      form.setFieldsValue(updatedInvoice);
                      message.success('Item duplicated successfully');
                    }
                  }}
                >
                  Duplicate
                </Button>
                <Button 
                  size="small" 
                  danger
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this item?')) {
                      handleDeleteItem(item.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <Row gutter={16} style={{ marginTop: 16 }}>
      <Col span={6}>
        <Form.Item label="Discount Rate">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InputNumber
              min={0}
              max={discountType === 'percentage' ? 100 : undefined}
              value={currentInvoice?.discountRate}
              onChange={handleDiscountChange}
              style={{ marginRight: '8px' }}
            />
            <Select
              value={discountType}
              onChange={(value) => setDiscountType(value as 'percentage' | 'decimal')}
              style={{ width: '100px' }}
            >
              <Option value="percentage">%</Option>
              <Option value="decimal">₹</Option>
            </Select>
          </div>
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Advance Payment">
          <InputNumber
            min={0}
            value={currentInvoice?.advancePayment}
            onChange={(value) => {
              if (currentInvoice) {
                // Calculate the correct subtotal
                const subtotal = currentInvoice.items.reduce((sum, item) => {
                  if (item.productCategory === 'Laddu Gopal Base') {
                    return sum + item.total;
                  } else {
                    return sum + ((item.rate || 0) * (item.quantity || 0));
                  }
                }, 0);
                const total = subtotal - currentInvoice.discountAmount - (value || 0) + currentInvoice.shippingCharges + currentInvoice.packingCharges;
                
                setCurrentInvoice({
                  ...currentInvoice,
                  advancePayment: value || 0,
                  total,
                });
              }
            }}
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Shipping Charges">
          <InputNumber
            min={0}
            value={currentInvoice?.shippingCharges}
            onChange={handleShippingChargesChange}
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Packing Charges">
          <InputNumber
            min={0}
            value={currentInvoice?.packingCharges}
            onChange={handlePackingChargesChange}
          />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={24}>
        <Form.Item label="Notes">
          <Row gutter={8}>
            <Col span={24}>
              <Form.Item name="notesLine1" noStyle>
                <Input placeholder="Line 1" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notesLine2" noStyle>
                <Input placeholder="Line 2" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notesLine3" noStyle>
                <Input placeholder="Line 3" />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      </Col>
    </Row>
    
    {/* Invoice Summary */}
    <div style={{ marginTop: 20, borderTop: '1px solid #d9d9d9', paddingTop: 20, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
      <Row>
        <Col span={18}>
          <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#333' }}>Subtotal:</div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#333' }}>
            ₹{(currentInvoice?.items.reduce((sum, item) => {
              if (item.productCategory === 'Laddu Gopal Base') {
                return sum + item.total;
              } else {
                return sum + ((item.rate || 0) * (item.quantity || 0));
              }
            }, 0) || 0).toFixed(2)}
          </div>
        </Col>
      </Row>

      {(currentInvoice?.discountAmount || 0) > 0 && (
        <Row style={{ marginTop: 8 }}>
          <Col span={18}>
            <div style={{ textAlign: 'right', color: '#333' }}>Discount:</div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'right', color: '#333' }}>
              -₹{(currentInvoice?.discountAmount || 0).toFixed(2)}
            </div>
          </Col>
        </Row>
      )}
      <Row style={{ marginTop: 8 }}>
        <Col span={18}>
          <div style={{ textAlign: 'right', color: '#333' }}>Shipping Charges:</div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'right', color: '#333' }}>
            ₹{(currentInvoice?.shippingCharges || 0).toFixed(2)}
          </div>
        </Col>
      </Row>
      <Row style={{ marginTop: 8 }}>
        <Col span={18}>
          <div style={{ textAlign: 'right', color: '#333' }}>Packing Charges:</div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'right', color: '#333' }}>
            ₹{(currentInvoice?.packingCharges || 0).toFixed(2)}
          </div>
        </Col>
      </Row>
      <Row style={{ marginTop: 16, borderTop: '1px solid #d9d9d9', paddingTop: 16 }}>
        <Col span={18}>
          <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Total:</div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            ₹{(() => {
              const subtotal = currentInvoice?.items.reduce((sum, item) => {
                if (item.productCategory === 'Laddu Gopal Base') {
                  return sum + item.total;
                } else {
                  return sum + ((item.rate || 0) * (item.quantity || 0));
                }
              }, 0) || 0;
              const discountAmount = currentInvoice?.discountAmount || 0;
              const subtotalAfterDiscount = subtotal - discountAmount;
              const total = subtotalAfterDiscount + (currentInvoice?.shippingCharges || 0) + (currentInvoice?.packingCharges || 0);
              return total.toFixed(2);
            })()}
          </div>
        </Col>
      </Row>
      {(currentInvoice?.advancePayment || 0) > 0 && (
        <Row style={{ marginTop: 8 }}>
          <Col span={18}>
            <div style={{ textAlign: 'right', color: '#333' }}>Advance Payment:</div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'right', color: '#333' }}>
              -₹{(currentInvoice?.advancePayment || 0).toFixed(2)}
            </div>
          </Col>
        </Row>
      )}
      {(currentInvoice?.advancePayment || 0) > 0 && (
        <Row style={{ marginTop: 16, borderTop: '1px solid #d9d9d9', paddingTop: 16 }}>
          <Col span={18}>
            <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Amount Due:</div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              ₹{(() => {
                const subtotal = currentInvoice?.items.reduce((sum, item) => {
                  if (item.productCategory === 'Laddu Gopal Base') {
                    return sum + item.total;
                  } else {
                    return sum + ((item.rate || 0) * (item.quantity || 0));
                  }
                }, 0) || 0;
                const discountAmount = currentInvoice?.discountAmount || 0;
                const subtotalAfterDiscount = subtotal - discountAmount;
                const total = subtotalAfterDiscount + (currentInvoice?.shippingCharges || 0) + (currentInvoice?.packingCharges || 0);
                const amountDue = total - (currentInvoice?.advancePayment || 0);
                return amountDue.toFixed(2);
              })()}
            </div>
          </Col>
        </Row>
      )}
    </div>
  </Form>
</Modal>
