import { createAsyncThunk, createSelector, createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import { pushNoteToServer, ServerNote } from '@/services/fakeServer';
import type { RootState } from './index';
import { selectIsOnline } from './networkSlice';

// Offline-first: la fuente de verdad para la UI es el estado LOCAL.
// Cada cambio se guarda al instante y se marca como "pending"; un proceso de
// sincronización lo sube al servidor cuando hay red.

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export type Note = ServerNote & {
  syncStatus: SyncStatus;
  attempts: number;
  lastError?: string;
};

type NotesState = {
  byId: Record<string, Note>;
  order: string[];
  hydrated: boolean;
  syncing: boolean;
  lastSyncAt?: number;
};

const initialState: NotesState = { byId: {}, order: [], hydrated: false, syncing: false };

const MAX_ATTEMPTS = 5;

/** Sube todas las notas pendientes. `condition` evita ejecutarlo sin red o si ya está corriendo. */
export const syncPendingNotes = createAsyncThunk<void, void, { state: RootState }>(
  'notes/syncPending',
  async (_, { getState, dispatch }) => {
    const pending = Object.values(getState().notes.byId).filter(
      (n) =>
        n.syncStatus === 'pending' || (n.syncStatus === 'error' && n.attempts < MAX_ATTEMPTS),
    );

    // Secuencial a propósito: más fácil de razonar y no satura el servidor.
    for (const note of pending) {
      if (!selectIsOnline(getState())) break; // se cayó la red a mitad de la sincronización
      dispatch(noteSyncStarted(note.id));
      const sentUpdatedAt = note.updatedAt;
      try {
        const saved = await pushNoteToServer({
          id: note.id,
          text: note.text,
          updatedAt: note.updatedAt,
        });
        dispatch(noteSyncSucceeded({ saved, sentUpdatedAt }));
      } catch (e) {
        dispatch(noteSyncFailed({ id: note.id, error: (e as Error).message }));
      }
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return selectIsOnline(state) && !state.notes.syncing && state.notes.hydrated;
    },
  },
);

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    notesHydrated: (state, action: PayloadAction<Pick<NotesState, 'byId' | 'order'> | null>) => {
      if (action.payload) {
        state.byId = action.payload.byId;
        state.order = action.payload.order;
        // Si la app se cerró a mitad de una sincronización, reintentamos.
        for (const note of Object.values(state.byId)) {
          if (note.syncStatus === 'syncing') note.syncStatus = 'pending';
        }
      }
      state.hydrated = true;
    },
    noteAdded: {
      reducer: (state, action: PayloadAction<Note>) => {
        state.byId[action.payload.id] = action.payload;
        state.order.unshift(action.payload.id);
      },
      prepare: (text: string) => ({
        payload: {
          id: nanoid(),
          text,
          updatedAt: Date.now(),
          syncStatus: 'pending' as const,
          attempts: 0,
        },
      }),
    },
    noteEdited: {
      reducer: (state, action: PayloadAction<{ id: string; text: string; updatedAt: number }>) => {
        const note = state.byId[action.payload.id];
        if (!note) return;
        note.text = action.payload.text;
        note.updatedAt = action.payload.updatedAt;
        note.syncStatus = 'pending';
        note.attempts = 0;
      },
      prepare: (id: string, text: string) => ({ payload: { id, text, updatedAt: Date.now() } }),
    },
    noteSyncStarted: (state, action: PayloadAction<string>) => {
      const note = state.byId[action.payload];
      if (note) note.syncStatus = 'syncing';
    },
    noteSyncSucceeded: (
      state,
      action: PayloadAction<{ saved: ServerNote; sentUpdatedAt: number }>,
    ) => {
      const { saved, sentUpdatedAt } = action.payload;
      const note = state.byId[saved.id];
      if (!note) return;
      // Si el usuario editó la nota mientras se subía, la versión local es más nueva: sigue pendiente.
      if (note.updatedAt > sentUpdatedAt) {
        note.syncStatus = 'pending';
        return;
      }
      note.text = saved.text;
      note.updatedAt = saved.updatedAt;
      note.syncStatus = 'synced';
      note.lastError = undefined;
    },
    noteSyncFailed: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const note = state.byId[action.payload.id];
      if (!note) return;
      note.syncStatus = 'error';
      note.attempts += 1;
      note.lastError = action.payload.error;
    },
    allNotesCleared: (state) => {
      state.byId = {};
      state.order = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncPendingNotes.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncPendingNotes.fulfilled, (state) => {
        state.syncing = false;
        state.lastSyncAt = Date.now();
      })
      .addCase(syncPendingNotes.rejected, (state) => {
        state.syncing = false;
      });
  },
});

export const {
  notesHydrated,
  noteAdded,
  noteEdited,
  noteSyncStarted,
  noteSyncSucceeded,
  noteSyncFailed,
  allNotesCleared,
} = notesSlice.actions;
export default notesSlice.reducer;

// Memoizado: sin createSelector, .map() devolvería un array nuevo en cada llamada
// y useSelector re-renderizaría el componente ante CUALQUIER acción.
export const selectNotes = createSelector(
  [(state: RootState) => state.notes.order, (state: RootState) => state.notes.byId],
  (order, byId) => order.map((id) => byId[id]),
);
export const selectPendingCount = (state: RootState) =>
  Object.values(state.notes.byId).filter((n) => n.syncStatus !== 'synced').length;
