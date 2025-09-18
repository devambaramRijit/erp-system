const { Sequelize } = require('sequelize');
const path = require('path');

// Create a new Sequelize instance with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'), // This will create a SQLite database file
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL queries in development
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('SQLite connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize;
