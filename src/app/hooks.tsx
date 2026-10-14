import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Switch, Text, TextInput, View } from 'react-native';

import { Button, colors, LogView, Note, Row, Screen, Section, styles } from '@/components/ui';
import { wait } from '@/services/fakeServer';

// ---------------------------------------------------------------------------
// 1. useState: actualizaciones basadas en el valor anterior
// ---------------------------------------------------------------------------
function StateDemo() {
  const [count, setCount] = useState(0);

  const addThreeWrong = () => {
    // Las 3 líneas leen el MISMO `count` de este render (closure) → solo suma 1.
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };
  const addThreeRight = () => {
    // La forma funcional recibe el valor más reciente de la cola de updates → suma 3.
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  };

  return (
    <Section title="1. useState y el closure del render">
      <Text style={{ fontSize: 28, fontWeight: '700' }}>{count}</Text>
      <Row>
        <Button title="+3 (mal)" variant="danger" onPress={addThreeWrong} />
        <Button title="+3 (bien)" onPress={addThreeRight} />
        <Button title="reset" variant="secondary" onPress={() => setCount(0)} />
      </Row>
      <Note>
        El estado es una “foto” por render. React agrupa (batching) los setState de un mismo
        evento y re-renderiza una sola vez.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 2. useEffect: suscripciones, dependencias y cleanup
// ---------------------------------------------------------------------------
function Stopwatch({ step, log }: { step: number; log: (s: string) => void }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    log('▶ montado');
    return () => log('■ desmontado (cleanup de [])');
  }, [log]);

  useEffect(() => {
    log(`⏱ intervalo creado con step=${step}`);
    const id = setInterval(() => setSeconds((s) => s + step), 1000);
    // Sin este cleanup, cada cambio de `step` dejaría un intervalo huérfano (memory leak).
    return () => {
      clearInterval(id);
      log(`🧹 intervalo con step=${step} limpiado`);
    };
  }, [step, log]);

  return <Text style={{ fontSize: 22, fontWeight: '700' }}>{seconds}s</Text>;
}

function EffectDemo() {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(1);
  const [lines, setLines] = useState<string[]>([]);
  // useCallback para que `log` sea estable y no re-dispare los efectos del hijo.
  const log = useCallback((s: string) => setLines((prev) => [...prev.slice(-7), s]), []);

  return (
    <Section title="2. useEffect: dependencias y cleanup">
      {visible && <Stopwatch step={step} log={log} />}
      <Row>
        <Button
          title={visible ? 'Desmontar' : 'Montar'}
          variant="secondary"
          onPress={() => setVisible((v) => !v)}
        />
        <Button title={`step = ${step === 1 ? 2 : 1}`} onPress={() => setStep((s) => (s === 1 ? 2 : 1))} />
      </Row>
      <LogView lines={lines} />
      <Note>
        Orden al cambiar una dependencia: cleanup del efecto anterior → efecto nuevo. Al desmontar:
        todos los cleanups.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 3. useMemo / useCallback / React.memo
// ---------------------------------------------------------------------------
const ExpensiveList = memo(function ExpensiveList({
  items,
  onSelect,
}: {
  items: number[];
  onSelect: (n: number) => void;
}) {
  // Leer/escribir refs durante el render rompe la pureza del componente y el linter lo marca.
  // Aquí lo hacemos A PROPÓSITO solo para visualizar cuántas veces se renderiza.
  const renders = useRef(0);
  // eslint-disable-next-line react-hooks/refs
  renders.current += 1;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.muted }}>
        {/* eslint-disable-next-line react-hooks/refs */}
        Hijo memo renderizado {renders.current} veces · {items.length} primos
      </Text>
      <Row>
        {items.slice(0, 6).map((n) => (
          <Button key={n} title={String(n)} variant="secondary" onPress={() => onSelect(n)} />
        ))}
      </Row>
    </View>
  );
});

function primesUpTo(limit: number) {
  const out: number[] = [];
  for (let n = 2; n <= limit; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) out.push(n);
  }
  return out;
}

function MemoDemo() {
  const [unrelated, setUnrelated] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [optimize, setOptimize] = useState(true);

  // Con optimize=false, en cada render se crean un array y una función NUEVOS,
  // así que memo() compara props por referencia, ve cambios y re-renderiza.
  const memoPrimes = useMemo(() => primesUpTo(20000), []);
  const memoSelect = useCallback((n: number) => setSelected(n), []);

  const items = optimize ? memoPrimes : primesUpTo(20000);
  const onSelect = optimize ? memoSelect : (n: number) => setSelected(n);

  return (
    <Section title="3. useMemo, useCallback y React.memo">
      <Row>
        <Text>Optimizar</Text>
        <Switch value={optimize} onValueChange={setOptimize} />
      </Row>
      <Button title={`Estado no relacionado: ${unrelated}`} onPress={() => setUnrelated((u) => u + 1)} />
      <ExpensiveList items={items} onSelect={onSelect} />
      <Text>Seleccionado: {selected ?? '—'}</Text>
      <Note>
        Pulsa “estado no relacionado” con y sin optimización y mira el contador del hijo. memo
        solo sirve si las props son referencialmente estables. No memoices todo: tiene costo y el
        React Compiler puede hacerlo automáticamente.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 4. useRef: valores mutables que NO disparan render + referencias a nodos
// ---------------------------------------------------------------------------
function RefDemo() {
  const inputRef = useRef<TextInput>(null);
  const clicks = useRef(0);
  const [, forceRender] = useState(0);
  const [text, setText] = useState('');
  const previous = usePrevious(text);

  return (
    <Section title="4. useRef">
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Escribe algo"
      />
      <Text style={{ color: colors.muted }}>Valor anterior (usePrevious): {previous || '—'}</Text>
      <Row>
        <Button title="Enfocar input" variant="secondary" onPress={() => inputRef.current?.focus()} />
        <Button title={`ref++ (no re-renderiza)`} onPress={() => (clicks.current += 1)} />
        <Button title="Forzar render" variant="secondary" onPress={() => forceRender((n) => n + 1)} />
      </Row>
      <Text>
        {/* Mostrar un ref en pantalla es justo lo que NO debes hacer: no está sincronizado con la UI. */}
        {/* eslint-disable-next-line react-hooks/refs */}
        clicks.current = {clicks.current} (se actualiza en pantalla solo al re-renderizar)
      </Text>
    </Section>
  );
}

// Versión recomendada por la documentación de React: guardar el valor en estado y
// actualizarlo durante el render cuando cambia. (La versión clásica con useRef + useEffect
// lee un ref durante el render, que el React Compiler considera inseguro.)
function usePrevious<T>(value: T) {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState<T | undefined>(undefined);
  if (!Object.is(value, current)) {
    setPrevious(current);
    setCurrent(value);
  }
  return previous;
}

// ---------------------------------------------------------------------------
// 5. useReducer: estado con transiciones explícitas (máquina de estados)
// ---------------------------------------------------------------------------
type LoginState =
  | { status: 'idle'; error?: string }
  | { status: 'submitting' }
  | { status: 'success'; user: string };

type LoginAction =
  | { type: 'submit' }
  | { type: 'resolve'; user: string }
  | { type: 'reject'; error: string }
  | { type: 'logout' };

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'submit':
      return state.status === 'submitting' ? state : { status: 'submitting' };
    case 'resolve':
      return { status: 'success', user: action.user };
    case 'reject':
      return { status: 'idle', error: action.error };
    case 'logout':
      return { status: 'idle' };
  }
}

function ReducerDemo() {
  const [state, dispatch] = useReducer(loginReducer, { status: 'idle' });
  const [user, setUser] = useState('');

  const submit = async () => {
    dispatch({ type: 'submit' });
    await wait(800);
    if (user.trim().length < 3) dispatch({ type: 'reject', error: 'Usuario muy corto' });
    else dispatch({ type: 'resolve', user: user.trim() });
  };

  return (
    <Section title="5. useReducer">
      {state.status === 'success' ? (
        <Row>
          <Text>¡Hola, {state.user}!</Text>
          <Button title="Salir" variant="secondary" onPress={() => dispatch({ type: 'logout' })} />
        </Row>
      ) : (
        <>
          <TextInput style={styles.input} value={user} onChangeText={setUser} placeholder="usuario" />
          <Button
            title={state.status === 'submitting' ? 'Entrando…' : 'Entrar'}
            onPress={submit}
            disabled={state.status === 'submitting'}
          />
          {state.status === 'idle' && state.error && (
            <Text style={{ color: colors.error }}>{state.error}</Text>
          )}
        </>
      )}
      <Note>Estado actual: {JSON.stringify(state)}</Note>
      <Note>
        Úsalo cuando el siguiente estado depende del anterior y hay varias transiciones. Es el
        mismo patrón que Redux, pero local al componente.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 6. Custom hooks: useDebounce + búsqueda que ignora respuestas viejas
// ---------------------------------------------------------------------------
function useDebounce<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

const FRAMEWORKS = ['React', 'React Native', 'Redux', 'Recoil', 'Relay', 'Vue', 'Angular', 'Svelte', 'Solid', 'Qwik'];

function useSearch(query: string) {
  // Guardamos PARA QUÉ query son los resultados; `loading` se deriva en vez de ser otro estado.
  const [response, setResponse] = useState<{ query: string | null; results: string[] }>({
    query: null,
    results: [],
  });

  useEffect(() => {
    let cancelled = false; // evita race conditions si llega una respuesta vieja después de una nueva
    // Latencia aleatoria: sin `cancelled`, una respuesta lenta podría pisar a una más reciente.
    wait(200 + Math.random() * 600).then(() => {
      if (cancelled) return;
      setResponse({
        query,
        results: FRAMEWORKS.filter((f) => f.toLowerCase().includes(query.toLowerCase())),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return { results: response.results, loading: response.query !== query };
}

function CustomHookDemo() {
  const [text, setText] = useState('');
  const debounced = useDebounce(text, 400);
  const { results, loading } = useSearch(debounced);

  return (
    <Section title="6. Custom hooks">
      <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Buscar framework…" />
      <Text style={{ color: colors.muted }}>
        Tecleado: “{text}” · Buscando: “{debounced}” {loading ? '⏳' : ''}
      </Text>
      <Text>{results.join(' · ') || 'Sin resultados'}</Text>
      <Note>
        Un custom hook es solo una función que usa otros hooks para reutilizar LÓGICA con estado
        (no UI). Debe empezar por “use” para que las reglas de hooks se puedan verificar.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 7. useContext: evitar prop drilling
// ---------------------------------------------------------------------------
const ThemeContext = createContext<{ dark: boolean; toggle: () => void } | null>(null);

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

function DeepChild() {
  const { dark, toggle } = useTheme();
  return (
    <View style={{ backgroundColor: dark ? '#222' : '#EEF2FF', padding: 12, borderRadius: 8, gap: 8 }}>
      <Text style={{ color: dark ? '#fff' : '#000' }}>Componente anidado: tema {dark ? 'oscuro' : 'claro'}</Text>
      <Button title="Cambiar tema" variant="secondary" onPress={toggle} />
    </View>
  );
}

function ContextDemo() {
  const [dark, setDark] = useState(false);
  const value = useMemo(() => ({ dark, toggle: () => setDark((d) => !d) }), [dark]);
  return (
    <Section title="7. useContext">
      <ThemeContext.Provider value={value}>
        <View>
          <View>
            <DeepChild />
          </View>
        </View>
      </ThemeContext.Provider>
      <Note>
        Todos los consumidores re-renderizan cuando cambia el value; por eso se memoiza. Para
        estado global que cambia mucho, suele convenir Redux/Zustand (suscripciones selectivas).
      </Note>
    </Section>
  );
}

export default function Hooks() {
  return (
    <Screen>
      <Note>
        Reglas de los hooks: llámalos solo en el nivel superior (nunca dentro de if/for) y solo
        desde componentes o custom hooks. React identifica cada hook por su ORDEN de llamada.
      </Note>
      <StateDemo />
      <EffectDemo />
      <MemoDemo />
      <RefDemo />
      <ReducerDemo />
      <CustomHookDemo />
      <ContextDemo />
    </Screen>
  );
}
