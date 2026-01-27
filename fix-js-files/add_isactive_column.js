const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('../server/config/database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true", (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Column 'isActive' added to 'users' table.");
  });
});

db.close();
