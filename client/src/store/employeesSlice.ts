import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@shared/schema';

interface EmployeesState {
  employees: Omit<User, 'password'>[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    role: string;
    status: string;
  };
}

const initialState: EmployeesState = {
  employees: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    role: '',
    status: '',
  },
};

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployees: (state, action: PayloadAction<Omit<User, 'password'>[]>) => {
      state.employees = action.payload;
      state.loading = false;
      state.error = null;
    },
    addEmployee: (state, action: PayloadAction<Omit<User, 'password'>>) => {
      state.employees.push(action.payload);
    },
    updateEmployee: (state, action: PayloadAction<Omit<User, 'password'>>) => {
      const index = state.employees.findIndex(employee => employee.id === action.payload.id);
      if (index !== -1) {
        state.employees[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<Partial<EmployeesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setEmployees, addEmployee, updateEmployee, setLoading, setError, setFilters } = employeesSlice.actions;
export default employeesSlice.reducer;
