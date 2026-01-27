const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../server/config/database.sqlite'),
  logging: false
});

const viewSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const tableSchema = await queryInterface.describeTable('users');
    console.log('Schema for "users" table:');
    console.log(tableSchema);

  } catch (error) {
    console.error('Error viewing schema:', error);
  } finally {
    await sequelize.close();
  }
};

viewSchema();