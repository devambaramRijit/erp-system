
module.exports = (sequelize, DataTypes) => {
  const ActionLog = sequelize.define('ActionLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('created', 'updated', 'deleted', 'finalized'),
      allowNull: false
    },
    actionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'action_logs'
  });

  return ActionLog;
};
