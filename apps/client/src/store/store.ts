
import { configureStore, createSlice } from '@reduxjs/toolkit';

// Dummy slice to satisfy Redux store requirement
const dummySlice = createSlice({
  name: 'dummy',
  initialState: {},
  reducers: {}
});

export const store = configureStore({
  reducer: {
    dummy: dummySlice.reducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
