import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Slice mínimo: estado + reducers + action creators generados automáticamente.
type CounterState = { value: number };

const initialState: CounterState = { value: 0 };

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // Immer permite "mutar" el draft; por debajo se genera un estado nuevo inmutable.
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementBy: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    reset: () => initialState,
  },
});

export const { increment, decrement, incrementBy, reset } = counterSlice.actions;
export default counterSlice.reducer;
