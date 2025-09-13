// This is a temporary file to show the fixes needed
// The actual fixes should be applied to InvoiceScreen.tsx

// Fix 1: For the size field being locked for traded products
// Replace this:
// <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled={disablePriceFields && !(currentInvoice?.invoiceType === 'manufactured' && selectedProductCategory === 'Laddu Gopal Base')} />
// With this:
// <InputNumber min={0} step={0.01} style={{ width: '100%' }} disabled={currentInvoice?.invoiceType !== 'manufactured'} />

// Fix 2: For the rate per piece becoming 1 automatically when typing quantity for traded products
// In the handleProductSelect function for traded products, add:
// itemForm.setFieldsValue({
//   rate: ratePerPiece,
//   ratePerInch: 1, // Set ratePerInch to 1 for traded products
//   size: 1 // Set size to 1 for traded products
// });

// Fix 3: For the condition in onValuesChange function
// Replace this:
// if ((selectedProductCategory === 'Laddu Gopal Base' || selectedProductCategory === 'Laddu Gopal Dress') &&
//     currentInvoice?.invoiceType === 'manufactured') {
// With this:
// if (currentInvoice?.invoiceType === 'manufactured') {
