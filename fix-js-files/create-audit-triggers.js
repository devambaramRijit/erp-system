const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./server/config/database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create audit_logs table if it doesn't exist
db.serialize(() => {
  console.log('\nCreating audit_logs table...');
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE
    old_data TEXT, -- JSON string of old data
    new_data TEXT, -- JSON string of new data
    changed_fields TEXT, -- JSON array of changed field names
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating audit_logs table:', err.message);
    } else {
      console.log('audit_logs table created successfully');
    }
  });

  // Note: SQLite doesn't support triggers in the same way as other databases
  // We'll need to implement this at the application level
  console.log('\nNote: SQLite has limited trigger support compared to other databases.');
  console.log('For full audit logging, we recommend implementing this at the application level.');
  console.log('\nThe audit_logs table has been created and can be used with application-level logging.');
});

// Close the database
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('\nDatabase connection closed.');
  }
});
