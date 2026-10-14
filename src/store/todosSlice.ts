import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  PayloadAction,
} from '@reduxjs/toolkit';

import { fetchTodosFromServer, TodoDto } from '@/services/fakeServer';
import type { RootState } from './index';

// createEntityAdapter normaliza la colección: { ids: [], entities: {} }
const todosAdapter = createEntityAdapter<TodoDto>();

type Extra = {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
  filter: 'all' | 'pending' | 'done';
};

const initialState = todosAdapter.getInitialState<Extra>({ status: 'idle', filter: 'all' });

// Thunk asíncrono: genera las acciones pending / fulfilled / rejected.
export const fetchTodos = createAsyncThunk('todos/fetch', async () => fetchTodosFromServer());

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    todoAdded: {
      reducer: todosAdapter.addOne,
      // prepare: genera datos no deterministas FUERA del reducer (los reducers deben ser puros).
      prepare: (title: string) => ({ payload: { id: nanoid(), title, done: false } }),
    },
    todoToggled: (state, action: PayloadAction<string>) => {
      const todo = state.entities[action.payload];
      if (todo) todo.done = !todo.done;
    },
    todoRemoved: todosAdapter.removeOne,
    filterChanged: (state, action: PayloadAction<Extra['filter']>) => {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        todosAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { todoAdded, todoToggled, todoRemoved, filterChanged } = todosSlice.actions;
export default todosSlice.reducer;

// ---- Selectores ----
export const { selectAll: selectAllTodos } = todosAdapter.getSelectors(
  (state: RootState) => state.todos,
);

// Selector memoizado: solo recalcula cuando cambian sus inputs.
export const selectVisibleTodos = createSelector(
  [selectAllTodos, (state: RootState) => state.todos.filter],
  (todos, filter) => {
    if (filter === 'pending') return todos.filter((t) => !t.done);
    if (filter === 'done') return todos.filter((t) => t.done);
    return todos;
  },
);
