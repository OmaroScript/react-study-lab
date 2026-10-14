import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import counterReducer from './counterSlice';
import networkReducer, { selectIsOnline } from './networkSlice';
import notesReducer, {
  noteAdded,
  noteEdited,
  notesHydrated,
  syncPendingNotes,
} from './notesSlice';
import todosReducer from './todosSlice';

export const NOTES_STORAGE_KEY = '@practica/notes';

// Listener middleware: efectos secundarios reactivos a acciones (alternativa ligera a sagas/epics).
const listener = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    todos: todosReducer,
    notes: notesReducer,
    network: networkReducer,
  },
  middleware: (getDefault) => getDefault().prepend(listener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

const startAppListening = listener.startListening.withTypes<RootState, AppDispatch>();

// 1) Persistencia: cada cambio en notes/* se guarda en disco (con debounce de 300 ms).
startAppListening({
  predicate: (action, state) => action.type.startsWith('notes/') && state.notes.hydrated,
  effect: async (_, api) => {
    api.cancelActiveListeners(); // si llega otra acción, cancela la escritura anterior (debounce)
    await api.delay(300);
    const { byId, order } = api.getState().notes;
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ byId, order }));
  },
});

// 2) Sincronizar cuando el usuario crea/edita algo o cuando la app termina de hidratarse.
startAppListening({
  matcher: isAnyOf(noteAdded, noteEdited, notesHydrated),
  effect: (_, api) => {
    api.dispatch(syncPendingNotes());
  },
});

// 3) Sincronizar al recuperar la conexión (transición offline -> online).
startAppListening({
  predicate: (_, current, previous) => selectIsOnline(current) && !selectIsOnline(previous),
  effect: (_, api) => {
    api.dispatch(syncPendingNotes());
  },
});

// 4) Al terminar una sincronización: sube lo que se creó mientras corría y
//    reintenta con backoff exponencial lo que falló.
startAppListening({
  actionCreator: syncPendingNotes.fulfilled,
  effect: async (_, api) => {
    const notes = Object.values(api.getState().notes.byId);
    if (notes.some((n) => n.syncStatus === 'pending')) {
      api.dispatch(syncPendingNotes());
      return;
    }
    const failed = notes.filter(
      (n) => n.syncStatus === 'error' && n.attempts < 5,
    );
    if (failed.length === 0) return;
    api.cancelActiveListeners();
    const minAttempts = Math.min(...failed.map((n) => n.attempts));
    await api.delay(Math.min(1000 * 2 ** minAttempts, 15000)); // 2s, 4s, 8s, 15s...
    api.dispatch(syncPendingNotes());
  },
});
