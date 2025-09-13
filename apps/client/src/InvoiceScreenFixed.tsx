// This is a temporary file to show the fixed content
// The actual fix should be applied to InvoiceScreen.tsx

// Fix for the onValuesChange function:
// Replace this:
//            // If it's a Laddu Gopal Base or Dress product and manufactured invoice, always calculate the rate
//            if ((selectedProductCategory === 'Laddu Gopal Base' || selectedProductCategory === 'Laddu Gopal Dress') &&
//                currentInvoice?.invoiceType === 'manufactured') {

// With this:
//            // If it's a manufactured invoice, always calculate the rate based on rate per inch and size
//            if (currentInvoice?.invoiceType === 'manufactured') {
