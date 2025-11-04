const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'server', 'config', 'database.sqlite'),
  logging: false
});

// Define the Inventory model
const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  costPricePerPiece: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  ratePerPiece: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  costPricePerInch: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  ratePerInch: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'inventory'
});

// Function to migrate data
async function migrateData() {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'apps', 'server', 'inventory-data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Connect to the database
    await sequelize.authenticate();
    console.log('Connected to the SQLite database.');

    // Sync the model with the database (this will add the new columns if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized.');

    // Clear existing data
    await Inventory.destroy({ where: {} });
    console.log('Existing inventory data cleared.');

    // Insert data from JSON
    for (const item of jsonData) {
      await Inventory.create({
        sku: item.sku,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        productType: item.productType,
        costPricePerPiece: item.costPricePerPiece,
        ratePerPiece: item.ratePerPiece,
        costPricePerInch: item.costPricePerInch,
        ratePerInch: item.ratePerInch
      });
    }

    console.log(`Successfully migrated ${jsonData.length} items to the SQLite database.`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the migration
migrateData();
