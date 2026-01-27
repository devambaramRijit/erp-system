const sequelize = require('./server/config/database');
const db = require('./server/models');

async function addLandmarkColumn() {
  try {
    console.log('Checking if customers table exists...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables:', tables);

    if (tables.includes('customers')) {
      console.log('Customers table exists, checking for landmark column...');
      const columns = await sequelize.getQueryInterface().describeTable('customers');
      console.log('Columns in customers table:', Object.keys(columns));

      if (!columns.landmark) {
        console.log('Adding landmark column to customers table...');
        await sequelize.getQueryInterface().addColumn('customers', 'landmark', {
          type: sequelize.Sequelize.STRING,
          allowNull: true
        });
        console.log('Landmark column added successfully!');
      } else {
        console.log('Landmark column already exists in customers table.');
      }
    } else {
      console.log('Customers table does not exist. Creating table with all columns...');
      await sequelize.sync({ force: false });
      console.log('Database synced successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error adding landmark column:', error);
    process.exit(1);
  }
}

addLandmarkColumn();
