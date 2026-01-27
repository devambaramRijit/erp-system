
import { api } from '../lib/api';

export const actionLogService = {
  // Get all action logs
  getAllActionLogs: async () => {
    return await api.get('/action-logs');
  },

  // Get action logs by invoice ID
  getActionLogsByInvoiceId: async (invoiceId) => {
    return await api.get(`/action-logs/invoice/${invoiceId}`);
  }
};

export default actionLogService;
