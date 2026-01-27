const sequelize = require('./server/config/database');
const db = require('./server/models');

// Sync the database with the models
async function syncDatabase() {
  try {
    console.log('Syncing database with models...');
    await sequelize.sync({ alter: true }); // Use alter: true to update existing tables
    console.log('Database synced successfully!');

    // Check if customers table exists and has district column
    const [results] = await sequelize.query("PRAGMA table_info(customers)");
    const hasDistrictColumn = results.some(column => column.name === 'district');

    if (hasDistrictColumn) {
      console.log('District column exists in customers table');
    } else {
      console.log('District column does not exist in customers table');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();
