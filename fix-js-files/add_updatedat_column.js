const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('../server/config/database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE users ADD COLUMN updatedAt DATETIME", (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Column 'updatedAt' added to 'users' table.");
      db.run("UPDATE users SET updatedAt = CURRENT_TIMESTAMP", (err) => {
        if (err) {
          console.error(err.message);
        }
        console.log("Existing rows updated with 'updatedAt' value.");
      });
    }
  });
});

db.close();
