console.log('--- [DEBUG] Loading invoiceController.js ---');
const { Invoice, Inventory, sequelize } = require('../models');

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    // The getter in the Invoice model will automatically parse the 'items' field
    const invoices = await Invoice.findAll({ order: [['date', 'DESC']] });
    res.json(invoices.map(invoice => invoice.get({ plain: true })));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (invoice) {
      res.json(invoice.get({ plain: true }));
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Create new invoice
exports.createInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, ...invoiceData } = req.body;

    const existingInvoice = await Invoice.findOne({ where: { invoiceNumber: invoiceData.invoiceNumber } });
    if (existingInvoice) {
      // No transaction started yet, so no need to rollback
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    const newInvoice = await Invoice.create({ ...invoiceData, items }, { transaction: t });

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          await Inventory.decrement('quantity', {
            by: item.quantity,
            where: { id: item.productId },
            transaction: t
          });
        }
      }
    }

    await t.commit();
    // The created invoice object (newInvoice) has items as an array due to the model's getter
    res.status(201).json(newInvoice.get({ plain: true }));
  } catch (error) {
    await t.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
    console.log('--- RUNNING UPDATE INVOICE ---');
    const t = await sequelize.transaction();
    try {
        const { items: newItems, ...invoiceData } = req.body;
        const invoiceId = req.params.id;

        console.log('Received newItems:', JSON.stringify(newItems, null, 2));

        const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // The model's getter automatically parses the JSON string
        const oldItems = invoice.items || [];

        // Revert old inventory quantities
        for (const item of oldItems) {
            if (item.productId && item.quantity > 0) {
                await Inventory.increment('quantity', { by: item.quantity, where: { id: item.productId }, transaction: t });
            }
        }

        // Apply new inventory quantities
        for (const item of newItems) {
            if (item.productId && item.quantity > 0) {
                await Inventory.decrement('quantity', { by: item.quantity, where: { id: item.productId }, transaction: t });
            }
        }

        // Update the invoice itself with the new data
        invoice.set(invoiceData);
        invoice.items = newItems;
        const updatedInvoice = await invoice.save({ transaction: t });

        await t.commit();
        console.log('--- UPDATE SUCCESSFUL ---');
        res.json(updatedInvoice.get({ plain: true }));
    } catch (error) {
        await t.rollback();
        console.error('Error updating invoice:', error);
        console.log('--- UPDATE FAILED ---');
        res.status(500).json({ error: 'Failed to update invoice' });
    }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(req.params.id, { transaction: t });
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = invoice.items || [];
    
    // Restock inventory for the deleted invoice's items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          await Inventory.increment('quantity', {
            by: item.quantity,
            where: { id: item.productId },
            transaction: t
          });
        }
      }
    }

    await invoice.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// Finalize invoice
exports.finalizeInvoice = async (req, res) => {
  try {
    const [updatedCount] = await Invoice.update({ status: 'finalized' }, {
      where: { id: req.params.id }
    });

    if (updatedCount) {
      res.json({ message: 'Invoice finalized successfully' });
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error finalizing invoice:', error);
    res.status(500).json({ error: 'Failed to finalize invoice' });
  }
};
