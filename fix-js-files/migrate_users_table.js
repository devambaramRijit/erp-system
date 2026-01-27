const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'config', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

async function migrateUsersTable() {
  try {
    console.log('Migrating users table schema...');

    // Check if createdAt column exists
    const userColumns = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(users)`, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    const hasCreatedAt = userColumns.some(column => column.name === 'createdAt');
    const hasUpdatedAt = userColumns.some(column => column.name === 'updatedAt');
    const hasUsername = userColumns.some(column => column.name === 'username');

    // Add createdAt column
    if (!hasCreatedAt) {
      console.log('Adding createdAt column to users table...');
      await new Promise((resolve, reject) => {
        db.run(`ALTER TABLE users ADD COLUMN createdAt DATETIME;`, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('Updating existing rows for createdAt...');
      await new Promise((resolve, reject) => {
        db.run(`UPDATE users SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL;`, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('Setting createdAt column to NOT NULL...');
      await new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name TEXT,
            role VARCHAR(255) DEFAULT 'user',
            isActive BOOLEAN DEFAULT TRUE,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME
          );
          INSERT INTO users_new (id, email, password, name, role, isActive, createdAt)
          SELECT id, email, password, name, role, isActive, createdAt FROM users;
          DROP TABLE users;
          ALTER TABLE users_new RENAME TO users;
        `, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('createdAt column added and set to NOT NULL.');
    } else {
      console.log('createdAt column already exists.');
    }

    // Add updatedAt column
    if (!hasUpdatedAt) {
      console.log('Adding updatedAt column to users table...');
      await new Promise((resolve, reject) => {
        db.run(`ALTER TABLE users ADD COLUMN updatedAt DATETIME;`, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('Updating existing rows for updatedAt...');
      await new Promise((resolve, reject) => {
        db.run(`UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL;`, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('Setting updatedAt column to NOT NULL...');
      await new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE users_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name TEXT,
            role VARCHAR(255) DEFAULT 'user',
            isActive BOOLEAN DEFAULT TRUE,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL
          );
          INSERT INTO users_temp (id, email, password, name, role, isActive, createdAt, updatedAt)
          SELECT id, email, password, name, role, isActive, createdAt, updatedAt FROM users;
          DROP TABLE users;
          ALTER TABLE users_temp RENAME TO users;
        `, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('updatedAt column added and set to NOT NULL.');
    } else {
      console.log('updatedAt column already exists.');
    }

    // Add username column
    if (!hasUsername) {
      console.log('Adding username column to users table...');
      await new Promise((resolve, reject) => {
        db.run(`ALTER TABLE users ADD COLUMN username VARCHAR(255);`, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('Updating existing rows for username...');
      // Generate unique usernames for existing users based on their email
      const existingUsers = await new Promise((resolve, reject) => {
        db.all(`SELECT id, email FROM users WHERE username IS NULL;`, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });

      for (const user of existingUsers) {
        const username = user.email.split('@')[0] + user.id; // Simple unique username
        await new Promise((resolve, reject) => {
          db.run(`UPDATE users SET username = ? WHERE id = ?;`, [username, user.id], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      }

      console.log('Setting username column to NOT NULL and UNIQUE...');
      await new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE users_final (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name TEXT,
            role VARCHAR(255) DEFAULT 'user',
            isActive BOOLEAN DEFAULT TRUE,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL
          );
          INSERT INTO users_final (id, username, email, password, name, role, isActive, createdAt, updatedAt)
          SELECT id, username, email, password, name, role, isActive, createdAt, updatedAt FROM users;
          DROP TABLE users;
          ALTER TABLE users_final RENAME TO users;
        `, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      console.log('username column added and set to NOT NULL and UNIQUE.');
    } else {
      console.log('username column already exists.');
    }

    console.log('Users table migrated successfully!');
  } catch (error) {
    console.error('Error migrating users table:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

migrateUsersTable();
