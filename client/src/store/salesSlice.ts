import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SalesOrder } from '@shared/schema';

interface SalesState {
  orders: SalesOrder[];
  loading: boolean;
  error: string | null;
  filters: {
    status: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

const initialState: SalesState = {
  orders: [],
  loading: false,
  error: null,
  filters: {
    status: '',
    dateRange: {
      start: '',
      end: '',
    },
  },
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<SalesOrder[]>) => {
      state.orders = action.payload;
      state.loading = false;
      state.error = null;
    },
    addOrder: (state, action: PayloadAction<SalesOrder>) => {
      state.orders.unshift(action.payload);
    },
    updateOrder: (state, action: PayloadAction<SalesOrder>) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<Partial<SalesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setOrders, addOrder, updateOrder, setLoading, setError, setFilters } = salesSlice.actions;
export default salesSlice.reducer;
