module.exports = (sequelize, DataTypes) => {
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
    }
  }, {
    timestamps: true, // Adds createdAt and updatedAt fields
    tableName: 'inventory'
  });

  return Inventory;
};