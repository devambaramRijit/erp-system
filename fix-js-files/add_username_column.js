const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('../server/config/database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE users ADD COLUMN username VARCHAR(255)", (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Column 'username' added to 'users' table.");
  });
});

db.close();
