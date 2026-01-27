const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../../server/config/database.sqlite'),
  logging: false
});

const addIsActiveColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Add the isActive column
    await queryInterface.addColumn('users', 'isActive', {
      type: Sequelize.TINYINT(1),
      defaultValue: 1
    });

    console.log('Column "isActive" has been added to the "users" table.');

  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column "isActive" already exists in the "users" table.');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    await sequelize.close();
  }
};

addIsActiveColumn();
