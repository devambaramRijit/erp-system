const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../../server/config/database.sqlite'),
  logging: false
});

const addUsernameColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Add the username column without the unique constraint first
    try {
      await queryInterface.addColumn('users', 'username', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('Column "username" has been added to the "users" table.');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('Column "username" already exists in the "users" table.');
      } else {
        throw error;
      }
    }

    // Populate the username column with the email prefix
    await sequelize.query("UPDATE users SET username = SUBSTR(email, 1, INSTR(email, '@') - 1) WHERE username IS NULL");
    console.log('Populated "username" column for existing users.');

    // Create a unique index on the username column
    try {
      await queryInterface.addIndex('users', ['username'], {
        unique: true,
        name: 'unique_username'
      });
      console.log('Unique index on "username" column has been created.');
    } catch (error) {
      if (error.message.includes('index already exists')) {
        console.log('Unique index on "username" column already exists.');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error adding column or index:', error);
  } finally {
    await sequelize.close();
  }
};

addUsernameColumn();