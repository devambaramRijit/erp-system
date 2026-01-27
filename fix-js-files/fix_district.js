const sequelize = require('./server/config/database');
const db = require('./server/models');

async function fixDistrictColumn() {
  try {
    console.log('Checking if customers table exists...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables:', tables);

    if (tables.includes('customers')) {
      console.log('Customers table exists, checking for district column...');
      const columns = await sequelize.getQueryInterface().describeTable('customers');
      console.log('Columns in customers table:', Object.keys(columns));

      if (!columns.district) {
        console.log('Adding district column to customers table...');
        await sequelize.getQueryInterface().addColumn('customers', 'district', {
          type: sequelize.Sequelize.STRING,
          allowNull: true
        });
        console.log('District column added successfully!');
      } else {
        console.log('District column already exists in customers table.');
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
