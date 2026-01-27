const sequelize = require('./server/config/database');

async function checkLandmarkColumn() {
  try {
    console.log('Checking if customers table exists...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables:', tables);

    if (tables.includes('Customers')) {
      console.log('Customers table exists, checking for landmark column...');
      const columns = await sequelize.getQueryInterface().describeTable('Customers');
      console.log('Columns in customers table:', Object.keys(columns));

      if (!columns.landmark) {
        console.log('Landmark column does not exist in customers table. Adding it...');
        await sequelize.getQueryInterface().addColumn('Customers', 'landmark', {
          type: sequelize.Sequelize.STRING,
          allowNull: true
        });
        console.log('Landmark column added successfully!');
      } else {
        console.log('Landmark column already exists in customers table.');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking landmark column:', error);
    process.exit(1);
  }
}

checkLandmarkColumn();
