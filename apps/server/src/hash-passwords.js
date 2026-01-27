const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../../server/config/database.sqlite'),
  logging: false
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1
  }
}, {
  timestamps: true,
  tableName: 'users'
});

const hashPasswords = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const users = await User.findAll();

    for (const user of users) {
      // Check if password is not already hashed
      if (!user.password.startsWith('$2b$')) {
        console.log(`Hashing password for user: ${user.username}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        await user.update({ password: hashedPassword });
        console.log(`Password for user ${user.username} has been hashed.`);
      } else {
        console.log(`Password for user ${user.username} is already hashed.`);
      }
    }

    console.log('All passwords have been processed.');
  } catch (error) {
    console.error('Unable to connect to the database or hash passwords:', error);
  } finally {
    await sequelize.close();
  }
};

hashPasswords();
