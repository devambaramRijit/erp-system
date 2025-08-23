import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryItem } from 'D:/2025/react/react dev/ErpSoul/shared/schema.js';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    category: string;
    status: string;
  };
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    status: '',
  },
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<InventoryItem[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addItem: (state, action: PayloadAction<InventoryItem>) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action: PayloadAction<InventoryItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<Partial<InventoryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setItems, addItem, updateItem, removeItem, setLoading, setError, setFilters } = inventorySlice.actions;
export default inventorySlice.reducer;
