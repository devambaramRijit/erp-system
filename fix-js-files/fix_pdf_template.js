
const fs = require('fs');
const path = './apps/client/src/InvoiceScreen.tsx';

// Read the file
fs.readFile(path, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find and replace the specific section for the PDF template
  const oldSection = `        <div className="invoice-details">
          <div className="invoice-details-grid">
            <div className="invoice-customer">
              <h3>Bill To:</h3>
              <div><strong>{invoice.customerName}</strong></div>
              <div>Phone: {invoice.customerEmail}</div>
              <div>{invoice.billingAddress}</div>

              {invoice.sameAsBilling ? (
                <></>
              ) : (
                <>
                  <h3 style={{ marginTop: '10px' }}>Ship To:</h3>
                  <div>{invoice.shippingAddress}</div>
                </>
              )}
            </div>

          </div>
        </div>`;

  const newSection = `        <div className="invoice-details">
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
  const result = data.replace(oldSection, newSection);

  // Write the file back
  fs.writeFile(path, result, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('PDF template updated successfully!');
  });
});
