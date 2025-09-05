
const fs = require('fs');
const path = './apps/client/src/InvoiceScreen.tsx';

// Read the file
fs.readFile(path, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the start of the invoice-details section
  const detailsStart = data.indexOf('<div className="invoice-details">');
  if (detailsStart === -1) {
    console.error('Could not find invoice-details section');
    return;
  }

  // Find the end of the invoice-details section by looking for the closing div
  let detailsEnd = detailsStart;
  let depth = 0;

  for (let i = detailsStart; i < data.length; i++) {
    if (data.substr(i, 5) === '<div ') {
      depth++;
    } else if (data.substr(i, 6) === '</div>') {
      depth--;
      if (depth === 0) {
        detailsEnd = i + 6;
        break;
      }
    }
  }

  // Create the new invoice-details section
  const newDetailsSection = `        <div className="invoice-details">
          <div className="invoice-details-grid">
            <div className="invoice-customer">
              <h3>Billing Address:</h3>
              <div><strong>{invoice.customerName}</strong></div>
              <div>Phone: {invoice.customerEmail}</div>
              <div>{invoice.billingAddress}</div>
            </div>
            <div className="invoice-customer">
              <h3>Shipping Address:</h3>
              <div><strong>{invoice.customerName}</strong></div>
              <div>Phone: {invoice.customerEmail}</div>
              <div>{invoice.shippingAddress}</div>
            </div>
          </div>
        </div>`;

  // Replace the section
  const result = data.substring(0, detailsStart) + newDetailsSection + data.substring(detailsEnd);

  // Write the file back
  fs.writeFile(path, result, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('PDF template updated successfully!');
  });
});
