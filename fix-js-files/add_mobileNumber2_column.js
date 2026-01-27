const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Correct the path to your database file
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // Add the mobileNumber2 column to the customers table
  db.run(`ALTER TABLE customers ADD COLUMN mobileNumber2 TEXT`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "mobileNumber2" already exists in "customers" table.');
      } else {
        console.error('Error adding column to customers table:', err.message);
      }
    } else {
      console.log('Column "mobileNumber2" added to "customers" table successfully.');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Closed the database connection.');
  }
});