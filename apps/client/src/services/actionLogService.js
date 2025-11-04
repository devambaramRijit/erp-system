
import { api } from '../lib/api';

export const actionLogService = {
  // Get all action logs
  getAllActionLogs: async () => {
    const response = await api.get('/action-logs');
    return response.data;
  },

  // Get action logs by invoice ID
  getActionLogsByInvoiceId: async (invoiceId) => {
    const response = await api.get(`/action-logs/invoice/${invoiceId}`);
    return response.data;
  }
};

export default actionLogService;
