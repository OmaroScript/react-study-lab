import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';

import { Button, colors, Note, Row, Screen, Section, styles } from '@/components/ui';
import { getServerNotesCount } from '@/services/fakeServer';
import { NOTES_STORAGE_KEY, useAppDispatch, useAppSelector } from '@/store';
import { forcedOfflineToggled, selectIsOnline } from '@/store/networkSlice';
import {
  allNotesCleared,
  Note as NoteModel,
  noteAdded,
  noteEdited,
  selectNotes,
  selectPendingCount,
  SyncStatus,
  syncPendingNotes,
} from '@/store/notesSlice';

const statusLabel: Record<SyncStatus, { text: string; color: string }> = {
  pending: { text: '⏳ pendiente', color: colors.warn },
  syncing: { text: '🔄 subiendo', color: colors.primary },
  synced: { text: '✓ sincronizada', color: colors.ok },
  error: { text: '✗ error', color: colors.error },
};

function NoteRow({ note }: { note: NoteModel }) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const label = statusLabel[note.syncStatus];

  const save = () => {
    if (text.trim() && text !== note.text) dispatch(noteEdited(note.id, text.trim()));
    setEditing(false);
  };

  return (
    <View style={{ gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
      {editing ? (
        <TextInput style={styles.input} value={text} onChangeText={setText} onBlur={save} onSubmitEditing={save} autoFocus />
      ) : (
        <Pressable onPress={() => setEditing(true)}>
          <Text style={{ color: colors.text }}>{note.text}</Text>
        </Pressable>
      )}
      <Text style={{ fontSize: 12, color: label.color }}>
        {label.text}
        {note.attempts > 0 ? ` · intentos: ${note.attempts}` : ''}
        {note.lastError && note.syncStatus === 'error' ? ` · ${note.lastError}` : ''}
      </Text>
    </View>
  );
}

export default function Offline() {
  const dispatch = useAppDispatch();
  const notes = useAppSelector(selectNotes);
  const pending = useAppSelector(selectPendingCount);
  const online = useAppSelector(selectIsOnline);
  const { isConnected, forcedOffline } = useAppSelector((s) => s.network);
  const { syncing, lastSyncAt, hydrated } = useAppSelector((s) => s.notes);
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    dispatch(noteAdded(draft.trim()));
    setDraft('');
  };

  const clearAll = async () => {
    dispatch(allNotesCleared());
    await AsyncStorage.removeItem(NOTES_STORAGE_KEY);
  };

  return (
    <Screen>
      <Section title="Estado de la red">
        <Text style={{ fontWeight: '700', color: online ? colors.ok : colors.error }}>
          {online ? '🟢 En línea' : '🔴 Sin conexión'}
        </Text>
        <Text style={{ color: colors.muted }}>
          NetInfo: {isConnected ? 'conectado' : 'desconectado'} · pendientes: {pending} ·{' '}
          {syncing ? 'sincronizando…' : lastSyncAt ? `última sync ${new Date(lastSyncAt).toLocaleTimeString()}` : 'sin sincronizar'}
        </Text>
        <Row>
          <Text>Simular modo avión</Text>
          <Switch value={forcedOffline} onValueChange={() => {
            dispatch(forcedOfflineToggled());
          }} />
        </Row>
        <Text style={{ color: colors.muted }}>Notas en el “servidor”: {getServerNotesCount()}</Text>
      </Section>

      <Section title="Notas (la UI nunca espera a la red)">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe una nota"
            onSubmitEditing={add}
          />
          <Button title="Guardar" onPress={add} />
        </View>
        {!hydrated && <Note>Cargando desde el disco…</Note>}
        {notes.map((n) => (
          <NoteRow key={n.id} note={n} />
        ))}
        <Row>
          <Button title="Sincronizar ahora" variant="secondary" onPress={() => dispatch(syncPendingNotes())} />
          <Button title="Borrar todo local" variant="danger" onPress={clearAll} />
        </Row>
      </Section>

      <Section title="Experimentos">
        <Note>
          1) Activa “modo avión”, crea y edita notas: quedan pendientes y se guardan en disco.{'\n'}
          2) Cierra la app por completo y vuelve a abrirla: las notas siguen ahí (hidratación).{'\n'}
          3) Desactiva el modo avión: se sincronizan solas (listener offline → online).{'\n'}
          4) El servidor falla 25% de las veces: observa los reintentos con backoff exponencial.{'\n'}
          5) Edita una nota mientras dice “subiendo”: vuelve a quedar pendiente y no se pierde tu
          cambio.{'\n'}
          Nota: el “servidor” vive en memoria, así que se vacía al recargar la app.
        </Note>
      </Section>
    </Screen>
  );
}
