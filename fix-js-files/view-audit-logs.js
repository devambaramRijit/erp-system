const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./server/config/database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Query all audit logs
console.log('\n--- Audit Logs ---');
db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC', [], (err, rows) => {
  if (err) {
    console.error('Error querying audit logs:', err.message);
  } else {
    if (rows.length === 0) {
      console.log('No audit logs found in the database.');
    } else {
      rows.forEach((row) => {
        console.log(`\nID: ${row.id}`);
        console.log(`Table: ${row.table_name}`);
        console.log(`Record ID: ${row.record_id}`);
        console.log(`Action: ${row.action}`);

        if (row.old_data) {
          console.log('\nOld Data:');
          console.log(JSON.stringify(JSON.parse(row.old_data), null, 2));
        }

        if (row.new_data) {
          console.log('\nNew Data:');
          console.log(JSON.stringify(JSON.parse(row.new_data), null, 2));
        }

        if (row.changed_fields) {
          console.log('\nChanged Fields:');
          console.log(JSON.parse(row.changed_fields).join(', '));
        }

        console.log(`\nUser ID: ${row.user_id || 'Unknown'}`);
        console.log(`Timestamp: ${row.timestamp}`);
        console.log('----------------------------------------');
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
