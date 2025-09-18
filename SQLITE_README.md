# SQLite Integration for ERP Soul

This document explains how SQLite has been integrated into the ERP Soul application.

## What's Been Added

1. **SQLite Dependencies**:
   - `sqlite3`: The SQLite driver for Node.js
   - `sequelize`: An ORM (Object-Relational Mapping) for easier database operations

2. **Database Configuration**:
   - Created `server/config/database.js` for SQLite connection setup
   - The database file will be created at `server/database.sqlite`

3. **Models**:
   - Created `server/models/` directory for database models
   - Added an Invoice model as an example
   - Set up model indexing in `server/models/index.js`

4. **API Routes**:
   - Added CRUD (Create, Read, Update, Delete) routes for invoices:
     - GET `/api/invoices` - Get all invoices
     - GET `/api/invoices/:id` - Get a specific invoice
     - POST `/api/invoices` - Create a new invoice
     - PUT `/api/invoices/:id` - Update an invoice
     - DELETE `/api/invoices/:id` - Delete an invoice

## How to Use

1. **Install Dependencies**:
   Navigate to the server directory and run:
   ```
   cd server
   npm install
   ```

2. **Start the Server**:
   ```
   npm start
   ```
   Or for development with auto-restart:
   ```
   npm run dev
   ```

3. **Database Initialization**:
   The SQLite database will be automatically created and synchronized when the server starts.

## Adding New Models

To add new models:

1. Create a new file in `server/models/` (e.g., `product.js`)
2. Define the model structure following the pattern in `invoice.js`
3. The model will be automatically imported and available through the `db` object

## Example API Usage

### Create a new invoice:
```javascript
fetch('/api/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    invoiceNumber: 'INV-001',
    date: '2023-11-15',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    items: [
      { description: 'Product 1', quantity: 2, price: 10.00 },
      { description: 'Product 2', quantity: 1, price: 15.00 }
    ],
    subtotal: 35.00,
    taxRate: 0.10,
    taxAmount: 3.50,
    total: 38.50,
    notes: 'Thank you for your business!',
    status: 'draft'
  }),
});
```

### Get all invoices:
```javascript
fetch('/api/invoices')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Update an invoice:
```javascript
fetch('/api/invoices/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'sent'
  }),
});
```

### Delete an invoice:
```javascript
fetch('/api/invoices/1', {
  method: 'DELETE',
});
```

## Database Management

The SQLite database file is stored at `server/database.sqlite`. You can use tools like:
- DB Browser for SQLite (https://sqlitebrowser.org/)
- VS Code extensions (e.g., SQLite Explorer)

To view and manage the database directly.
