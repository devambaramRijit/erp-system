const sequelize = require('./server/config/database');
const db = require('./server/models');

async function fixDistrictColumn() {
  try {
    console.log('Checking if Customers table exists...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables:', tables);

    if (tables.includes('Customers')) {
      console.log('Customers table exists, checking for district column...');
      const columns = await sequelize.getQueryInterface().describeTable('Customers');
      console.log('Columns in Customers table:', Object.keys(columns));

      if (!columns.district) {
        console.log('Adding district column to Customers table...');
        await sequelize.getQueryInterface().addColumn('Customers', 'district', {
          type: sequelize.Sequelize.STRING,
          allowNull: true
        });
        console.log('District column added successfully!');
      } else {
        console.log('District column already exists in Customers table.');
      }
    } else {
      console.log('Customers table does not exist. Creating table with all columns...');
      await sequelize.sync({ force: false });
      console.log('Database synced successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error fixing district column:', error);
    process.exit(1);
  }
}

fixDistrictColumn();
