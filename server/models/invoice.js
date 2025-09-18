module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerEmail: {
      type: DataTypes.STRING
    },
    customerAddress: {
      type: DataTypes.TEXT
    },
    items: {
      type: DataTypes.TEXT, // Using TEXT to store JSON array of items
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('items');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('items', JSON.stringify(value));
      }
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    taxRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    taxAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    }
  }, {
    timestamps: true, // Adds createdAt and updatedAt fields
    tableName: 'invoices'
  });

  return Invoice;
};
