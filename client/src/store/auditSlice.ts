import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuditLog } from '@shared/schema';

interface AuditState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  filters: {
    action: string;
    dateRange: {
      start: string;
      end: string;
    };
    userId: string;
  };
}

const initialState: AuditState = {
  logs: [],
  loading: false,
  error: null,
  filters: {
    action: '',
    dateRange: {
      start: '',
      end: '',
    },
    userId: '',
  },
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    setLogs: (state, action: PayloadAction<AuditLog[]>) => {
      state.logs = action.payload;
      state.loading = false;
      state.error = null;
    },
    addLog: (state, action: PayloadAction<AuditLog>) => {
      state.logs.unshift(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<Partial<AuditState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setLogs, addLog, setLoading, setError, setFilters } = auditSlice.actions;
export default auditSlice.reducer;
