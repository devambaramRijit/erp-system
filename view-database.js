const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'config', 'database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err.message);
    return;
  }

  console.log('\nTables in the database:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });

  // For each table, get its schema and data
  tables.forEach(table => {
    console.log(`\n=== Table: ${table.name} ===`);

    // Get table schema
    db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
      if (err) {
        console.error(`Error getting schema for ${table.name}:`, err.message);
        return;
      }

      console.log('\nColumns:');
      columns.forEach(column => {
        console.log(`- ${column.name} (${column.type})`);
      });

      // Get table data
      db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
        if (err) {
          console.error(`Error getting data from ${table.name}:`, err.message);
          return;
        }

        console.log('\nData:');
        if (rows.length === 0) {
          console.log('(No data)');
        } else {
          rows.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
          });
        }
      });
    });
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('\nDatabase connection closed.');
  }
});
