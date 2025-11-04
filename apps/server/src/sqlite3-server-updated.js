app.post('/api/invoices', (req, res) => {
  const { invoiceNumber, date, customerName, customerEmail, customerAddress, items, subtotal, taxRate, taxAmount, total, notes, status } = req.body;

  if (!invoiceNumber || !customerName) {
    return res.status(400).json({ message: 'Invoice number and customer name are required' });
  }

  // Check if invoice number already exists
  db.get('SELECT id FROM invoices WHERE invoiceNumber = ?', [invoiceNumber], (err, row) => {
    if (err) {
      console.error('Error checking invoice number:', err);
      return res.status(500).json({ error: 'Failed to check invoice number' });
    }

    if (row) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    const sql = `INSERT INTO invoices (invoiceNumber, date, customerName, customerEmail, customerAddress, items, subtotal, taxRate, taxAmount, total, notes, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
      invoiceNumber,
      date || new Date().toISOString(),
      customerName,
      customerEmail || '',
      customerAddress || '',
      JSON.stringify(items || []),
      subtotal || 0,
      taxRate || 0,
      taxAmount || 0,
      total || 0,
      notes || '',
      status || 'draft',
      new Date().toISOString(),
      new Date().toISOString()
    ], function(err) {
      if (err) {
        console.error('Error creating invoice:', err);
        return res.status(500).json({ message: 'Error creating invoice' });
      }

      // Get the newly created invoice
      db.get("SELECT * FROM invoices WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching newly created invoice:', err);
          return res.status(500).json({ message: 'Error creating invoice' });
        }

        // Parse items JSON
        if (row && row.items) {
          try {
            row.items = JSON.parse(row.items);
          } catch (parseErr) {
            console.error('Error parsing items JSON:', parseErr);
            row.items = [];
          }
        }

        res.status(201).json(row);
      });
    });
  });
});