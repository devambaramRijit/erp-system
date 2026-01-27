const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/config/database.sqlite');

/**
 * Logs changes to the audit_logs table
 * @param {string} tableName - The name of the table being modified
 * @param {number} recordId - The ID of the record being modified
 * @param {string} action - The action type (CREATE, UPDATE, DELETE)
 * @param {object} oldData - The previous state of the record (for UPDATE)
 * @param {object} newData - The new state of the record
 * @param {number} userId - The ID of the user making the change
 */
const logChange = async (tableName, recordId, action, oldData = null, newData = null, userId = null) => {
  try {
    let changedFields = [];

    // For UPDATE actions, identify which fields changed
    if (action === 'UPDATE' && oldData && newData) {
      changedFields = Object.keys(newData).filter(
        key => oldData[key] !== newData[key]
      );
    }

    const sql = `
      INSERT INTO audit_logs (
        table_name, 
        record_id, 
        action, 
        old_data, 
        new_data, 
        changed_fields, 
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
      tableName,
      recordId,
      action,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      changedFields.length > 0 ? JSON.stringify(changedFields) : null,
      userId
    ], function(err) {
      if (err) {
        console.error('Error creating audit log:', err);
      } else {
        console.log(`Audit log created for ${action} on ${tableName} ID: ${recordId}`);
      }
    });

    console.log(`Audit log created for ${action} on ${tableName} ID: ${recordId}`);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

module.exports = {
  logChange
};
