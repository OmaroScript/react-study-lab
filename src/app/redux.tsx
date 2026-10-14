import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button, Code, colors, Note, Row, Screen, Section, styles } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store';
import { decrement, increment, incrementBy, reset } from '@/store/counterSlice';
import {
  fetchTodos,
  filterChanged,
  selectVisibleTodos,
  todoAdded,
  todoRemoved,
  todoToggled,
} from '@/store/todosSlice';

function Counter() {
  // useSelector se suscribe SOLO a este pedazo del estado: el componente re-renderiza si cambia.
  const value = useAppSelector((s) => s.counter.value);
  const dispatch = useAppDispatch();

  return (
    <Section title="1. Flujo básico: action → reducer → store → UI">
      <Text style={{ fontSize: 28, fontWeight: '700' }}>{value}</Text>
      <Row>
        <Button title="−" onPress={() => dispatch(decrement())} />
        <Button title="+" onPress={() => dispatch(increment())} />
        <Button title="+5" onPress={() => dispatch(incrementBy(5))} />
        <Button title="reset" variant="secondary" onPress={() => dispatch(reset())} />
      </Row>
      <Code>{`dispatch(incrementBy(5))
// → { type: 'counter/incrementBy', payload: 5 }`}</Code>
    </Section>
  );
}

function Todos() {
  const dispatch = useAppDispatch();
  const todos = useAppSelector(selectVisibleTodos);
  const { status, error, filter } = useAppSelector((s) => s.todos);
  const [title, setTitle] = useState('');

  const add = () => {
    if (!title.trim()) return;
    dispatch(todoAdded(title.trim()));
    setTitle('');
  };

  return (
    <Section title="2. Async thunk + entity adapter + selectores">
      <Row>
        <Button
          title={status === 'loading' ? 'Cargando…' : 'fetchTodos() (20% falla)'}
          onPress={() => dispatch(fetchTodos())}
          disabled={status === 'loading'}
        />
      </Row>
      {status === 'failed' && <Text style={{ color: colors.error }}>Error: {error}</Text>}
      <Row>
        {(['all', 'pending', 'done'] as const).map((f) => (
          <Button
            key={f}
            title={f}
            variant={f === filter ? 'primary' : 'secondary'}
            onPress={() => dispatch(filterChanged(f))}
          />
        ))}
      </Row>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Nueva tarea"
          onSubmitEditing={add}
        />
        <Button title="Agregar" onPress={add} />
      </View>
      {todos.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => dispatch(todoToggled(t.id))}
          onLongPress={() => dispatch(todoRemoved(t.id))}
          style={{ paddingVertical: 6 }}
        >
          <Text style={{ textDecorationLine: t.done ? 'line-through' : 'none', color: colors.text }}>
            {t.done ? '☑' : '☐'} {t.title}
          </Text>
        </Pressable>
      ))}
      <Note>Toca para completar, mantén presionado para borrar.</Note>
    </Section>
  );
}

function StateInspector() {
  // Tres selectores separados que devuelven referencias existentes del store.
  // Un solo selector `(s) => ({ counter: s.counter, ... })` crearía un objeto nuevo
  // en cada llamada y forzaría un re-render en CUALQUIER cambio del store.
  const counter = useAppSelector((s) => s.counter);
  const todos = useAppSelector((s) => s.todos);
  const network = useAppSelector((s) => s.network);
  return (
    <Section title="3. El store (solo lectura)">
      <Code>{JSON.stringify({ counter, todos, network }, null, 2)}</Code>
      <Note>
        Fíjate en la forma normalizada de todos: ids + entities. Mira el comentario del código de
        este inspector: devolver objetos nuevos desde un selector es un error común de rendimiento
        (la solución es createSelector o shallowEqual).
      </Note>
    </Section>
  );
}

export default function ReduxScreen() {
  return (
    <Screen>
      <Note>
        Código en src/store/. Redux Toolkit es la forma oficial de escribir Redux: menos
        boilerplate, Immer para “mutar” de forma segura y buenas prácticas por defecto.
      </Note>
      <Counter />
      <Todos />
      <StateInspector />
    </Screen>
  );
}
