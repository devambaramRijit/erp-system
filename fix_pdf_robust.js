
const fs = require('fs');
const path = './apps/client/src/InvoiceScreen.tsx';

// Read the file
fs.readFile(path, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the start and end of the section to replace
  const startMarker = '<div className="invoice-details">';
  const endMarker = '</div>';

  // Find the start of the invoice-details section
  const startIndex = data.indexOf(startMarker);
  if (startIndex === -1) {
    console.error('Could not find invoice-details section');
    return;
  }

  // Find the end of the invoice-details section
  let depth = 0;
  let endIndex = startIndex;

  for (let i = startIndex; i < data.length; i++) {
    if (data.substr(i, startMarker.length) === startMarker) {
      depth++;
    } else if (data.substr(i, endMarker.length) === endMarker) {
      depth--;
      if (depth === 0) {
        endIndex = i + endMarker.length;
        break;
      }
    }
  }

  if (endIndex <= startIndex) {
    console.error('Could not find end of invoice-details section');
    return;
  }

  // Create the replacement section
  const replacementSection = `        <div className="invoice-details">
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
  const result = data.substring(0, startIndex) + replacementSection + data.substring(endIndex);

  // Write the file back
  fs.writeFile(path, result, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('PDF template updated successfully!');
  });
});
