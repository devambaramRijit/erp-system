import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Expense } from '@shared/schema';

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  filters: {
    category: string;
    status: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

const initialState: ExpensesState = {
  expenses: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    status: '',
    dateRange: {
      start: '',
      end: '',
    },
  },
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
      state.loading = false;
      state.error = null;
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.unshift(action.payload);
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex(expense => expense.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<Partial<ExpensesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setExpenses, addExpense, updateExpense, setLoading, setError, setFilters } = expensesSlice.actions;
export default expensesSlice.reducer;
