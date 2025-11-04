
const { ActionLog } = require('../models');

// Get all action logs
exports.getAllActionLogs = async (req, res) => {
  try {
    const actionLogs = await ActionLog.findAll({
      order: [['actionDate', 'DESC']]
    });
    res.json(actionLogs);
  } catch (error) {
    console.error('Error fetching action logs:', error);
    res.status(500).json({ error: 'Failed to fetch action logs' });
  }
};

// Get action logs by invoice ID
exports.getActionLogsByInvoiceId = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const actionLogs = await ActionLog.findAll({
      where: { invoiceId },
      order: [['actionDate', 'DESC']]
    });
    res.json(actionLogs);
  } catch (error) {
    console.error('Error fetching action logs for invoice:', error);
    res.status(500).json({ error: 'Failed to fetch action logs for invoice' });
  }
};

// Create a new action log entry
exports.createActionLog = async (invoiceId, invoiceNumber, action, userId = null, username = null, details = null) => {
  try {
    const newActionLog = await ActionLog.create({
      invoiceId,
      invoiceNumber,
      action,
      userId,
      username,
      details
    });
    return newActionLog;
  } catch (error) {
    console.error('Error creating action log:', error);
    throw error;
  }
};
