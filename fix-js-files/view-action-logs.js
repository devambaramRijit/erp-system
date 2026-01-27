const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./server/config/database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Query all action logs
console.log('\n--- Invoice Action Logs ---');
db.all('SELECT * FROM invoice_action_logs ORDER BY timestamp DESC', [], (err, rows) => {
  if (err) {
    console.error('Error querying action logs:', err.message);
  } else {
    if (rows.length === 0) {
      console.log('No action logs found in the database.');
    } else {
      rows.forEach((row) => {
        console.log(`\nID: ${row.id}`);
        console.log(`Invoice ID: ${row.invoice_id}`);
        console.log(`Action Type: ${row.action_type}`);
        console.log(`Details: ${row.details || 'No details'}`);
        console.log(`Timestamp: ${row.timestamp}`);
      });
    }
  }

  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('\nDatabase connection closed.');
    }
  });
});
