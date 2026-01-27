const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use relative path to find the database from the script location
const dbPath = path.join(__dirname, 'server', 'config', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Connected to the database.');

// Clear Customers table
db.run('DELETE FROM Customers', function(err) {
  if (err) {
    return console.error(err.message);
  }
  console.log(`Deleted ${this.changes} rows from Customers table`);
});

// Clear Inventory table
db.run('DELETE FROM Inventory', function(err) {
  if (err) {
    return console.error(err.message);
  }
  console.log(`Deleted ${this.changes} rows from Inventory table`);
});

// Close the database connection
db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Database connection closed.');
});
