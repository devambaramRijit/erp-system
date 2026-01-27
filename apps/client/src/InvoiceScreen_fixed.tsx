// This file contains the fixed handleSaveInvoice function
// Copy this function and replace the existing one in InvoiceScreen.tsx

const handleSaveInvoice = async () => {
    try {
      const values = await form.validateFields();
      if (currentInvoice) {
        // Ensure items are parsed correctly from string if needed
        let items = [];
        if (typeof currentInvoice.items === 'string') {
          try {
            items = JSON.parse(currentInvoice.items);
          } catch (e) {
            console.error('Error parsing items:', e);
            items = [];
          }
        } else {
          items = currentInvoice.items || [];
        }

        // Recalculate totals from items array to ensure accuracy
        const subtotal = items.reduce((sum: number, item: InvoiceItem) => {
          // Use item.total if it exists, otherwise calculate it
          return sum + (item.total !== undefined ? item.total : ((item.rate || item.price || 0) * (item.quantity || 0)));
        }, 0);

        const discountAmount = currentInvoice.discountAmount || 0;
        const shippingCharges = currentInvoice.shippingCharges || 0;
        const packingCharges = currentInvoice.packingCharges || 0;
        const advancePayment = currentInvoice.advancePayment || 0;

        // Correct total calculation
        const total = subtotal - discountAmount + shippingCharges + packingCharges - advancePayment;

        const invoiceToSave: Invoice = {
          ...currentInvoice,
          ...values,
          items, // Ensure items is an array
          subtotal,
          total, // Ensure total is correctly calculated
          id: editingInvoice ? editingInvoice.id : Date.now().toString(),
          status: editingInvoice ? currentInvoice.status : 'draft',
        };

        console.log('Saving invoice with items:', items);
        console.log('Calculated subtotal:', subtotal);
        console.log('Calculated total:', total);

        if (editingInvoice) {
          try {
            const response = await api.put(`/invoices/${editingInvoice.id}`, invoiceToSave);
            const updatedInvoices = invoices.map(invoice =>
              invoice.id === editingInvoice.id ? response : invoice
            );
            setInvoices(updatedInvoices);
            message.success('Invoice updated successfully');
          } catch (error) {
            console.error('Error updating invoice:', error);
            message.error('Failed to update invoice');
          }
        } else {
          try {
            const response = await api.post('/invoices', invoiceToSave);
            setInvoices([...invoices, response]);
            message.success('Invoice added successfully');
          } catch (error) {
            console.error('Error adding invoice:', error);
            message.error('Failed to add invoice');
          }
        }

        setVisible(false);
        localStorage.removeItem('currentInvoice');
        form.resetFields();
        setCurrentInvoice(null);
        setEditingInvoice(null);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };
