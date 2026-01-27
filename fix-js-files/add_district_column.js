const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to your SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// Add the district column to the customers table
db.run('ALTER TABLE customers ADD COLUMN district TEXT;', (err) => {
  if (err) {
    console.error('Error adding column:', err.message);
  } else {
    console.log('Column "district" added successfully to customers table.');
  }

  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});
