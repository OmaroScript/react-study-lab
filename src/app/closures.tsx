import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button, Code, colors, LogView, Note, Row, Screen, Section, styles } from '@/components/ui';

// ---------------------------------------------------------------------------
// 1. Closures en JS puro: estado privado e independiente
// ---------------------------------------------------------------------------
function crearContador(nombre: string) {
  let cuenta = 0; // privada: solo las funciones de abajo la ven
  return {
    incrementar: () => `${nombre}: ${++cuenta}`,
    leer: () => `${nombre}: ${cuenta}`,
  };
}

// Se crean UNA vez al cargar el módulo; cada uno encierra su propia `cuenta`.
const contadorA = crearContador('A');
const contadorB = crearContador('B');

function FactoryDemo() {
  const [lines, setLines] = useState<string[]>([]);
  const log = (s: string) => setLines((prev) => [...prev.slice(-5), s]);

  return (
    <Section title="1. Fábrica de closures: estado privado">
      <Code>{`function crearContador(nombre) {
  let cuenta = 0;               // privada
  return {
    incrementar: () => \`\${nombre}: \${++cuenta}\`,
    leer: () => \`\${nombre}: \${cuenta}\`,
  };
}
const contadorA = crearContador('A');
const contadorB = crearContador('B');`}</Code>
      <Row>
        <Button title="A.incrementar()" onPress={() => log(contadorA.incrementar())} />
        <Button title="B.incrementar()" onPress={() => log(contadorB.incrementar())} />
        <Button title="contadorA.cuenta" variant="secondary" onPress={() => log(`contadorA.cuenta → ${String((contadorA as unknown as { cuenta?: number }).cuenta)}`)} />
      </Row>
      <LogView lines={lines} />
      <Note>
        crearContador ya terminó de ejecutarse, pero cada `cuenta` sigue viva porque las funciones
        devueltas la “encierran”. A y B no comparten estado: cada llamada crea un scope nuevo. Y
        desde fuera no hay forma de leer `cuenta` (da undefined): es privada.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 2. Referencia, no copia
// ---------------------------------------------------------------------------
function ReferenceDemo() {
  const [lines, setLines] = useState<string[]>([]);

  const run = () => {
    const out: string[] = [];
    let mensaje = 'hola';
    const decir = () => mensaje; // encierra la VARIABLE, no el valor 'hola'
    out.push(`decir() → '${decir()}'`);
    mensaje = 'adiós';
    out.push(`(mensaje = 'adiós')  decir() → '${decir()}'`);
    setLines(out);
  };

  return (
    <Section title="2. El closure guarda la variable, no una copia">
      <Code>{`let mensaje = 'hola';
const decir = () => mensaje;
decir();            // ?
mensaje = 'adiós';
decir();            // ?`}</Code>
      <Button title="Ejecutar" onPress={run} />
      <LogView lines={lines} />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 3. Bucle con var vs let (closures + scope de bloque)
// ---------------------------------------------------------------------------
function LoopDemo() {
  const [lines, setLines] = useState<string[]>([]);
  const log = (s: string) => setLines((prev) => [...prev, s]);

  const runVar = () => {
    setLines([]);
    // eslint-disable-next-line no-var -- a propósito: así se ve el bug clásico
    for (var i = 0; i < 3; i++) {
      setTimeout(() => log(`var i = ${i}`), 50);
    }
  };

  const runLet = () => {
    setLines([]);
    for (let j = 0; j < 3; j++) {
      setTimeout(() => log(`let j = ${j}`), 50);
    }
  };

  return (
    <Section title="3. Bucle: var vs let">
      <Code>{`for (var i = 0; i < 3; i++) setTimeout(() => log(i));
for (let j = 0; j < 3; j++) setTimeout(() => log(j));`}</Code>
      <Row>
        <Button title="Con var" variant="danger" onPress={runVar} />
        <Button title="Con let" onPress={runLet} />
      </Row>
      <LogView lines={lines} />
      <Note>
        Con var hay UNA sola `i` (scope de función) compartida por los 3 closures; cuando corren,
        ya vale 3. Con let cada iteración crea un binding nuevo (scope de bloque).
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 4. Stale closure con setInterval
// ---------------------------------------------------------------------------
function BrokenCounter() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(seconds + 1); // ❌ `seconds` es SIEMPRE 0: viene del closure del primer render
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a propósito: este es el bug
  }, []);
  return <Counter label="Roto: setSeconds(seconds + 1), deps []" value={seconds} bad />;
}

function FunctionalUpdateCounter() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000); // ✅ no lee el closure
    return () => clearInterval(id);
  }, []);
  return <Counter label="Arreglo 1: setSeconds(s => s + 1)" value={seconds} />;
}

function DepsCounter() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    // ✅ Funciona, pero el intervalo se destruye y se recrea en CADA tick.
    const id = setInterval(() => setSeconds(seconds + 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return <Counter label="Arreglo 2: deps [seconds] (recrea el intervalo)" value={seconds} />;
}

function Counter({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', width: 48, color: bad ? colors.error : colors.ok }}>
        {value}
      </Text>
      <Text style={{ flex: 1, color: colors.text }}>{label}</Text>
    </View>
  );
}

function StaleIntervalDemo() {
  const [running, setRunning] = useState(false);
  return (
    <Section title="4. Stale closure: setInterval en un efecto">
      <Code>{`useEffect(() => {
  const id = setInterval(() => {
    setSeconds(seconds + 1);   // ¿qué valor de seconds ve?
  }, 1000);
  return () => clearInterval(id);
}, []);`}</Code>
      <Button
        title={running ? 'Detener (desmonta los 3)' : 'Iniciar los 3 contadores'}
        variant={running ? 'secondary' : 'primary'}
        onPress={() => setRunning((r) => !r)}
      />
      {running && (
        <View style={{ gap: 10 }}>
          <BrokenCounter />
          <FunctionalUpdateCounter />
          <DepsCounter />
        </View>
      )}
      <Note>
        El roto se queda en 1: con deps [] el efecto corre una sola vez, y su callback encierra el
        `seconds` del primer render (0) para siempre. Cada tick hace setSeconds(0 + 1). La regla
        react-hooks/exhaustive-deps del linter existe para detectar justo esto.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 5. Stale closure en un handler con retraso (el ejemplo clásico del chat)
// ---------------------------------------------------------------------------
function DelayedSendDemo() {
  const [text, setText] = useState('Hola');
  const [lines, setLines] = useState<string[]>([]);
  const latestText = useRef(text);
  const log = (s: string) => setLines((prev) => [...prev.slice(-5), s]);

  // Mantener el ref sincronizado con el último valor (después del render).
  useEffect(() => {
    latestText.current = text;
  }, [text]);

  const sendWithClosure = () => {
    log(`⏳ enviando en 3s (closure capturó: “${text}”)`);
    setTimeout(() => log(`📨 closure envió: “${text}”`), 3000);
  };

  const sendWithRef = () => {
    log('⏳ enviando en 3s (leerá el ref al final)');
    setTimeout(() => log(`📨 ref envió: “${latestText.current}”`), 3000);
  };

  return (
    <Section title="5. Stale closure en un callback con retraso">
      <TextInput style={styles.input} value={text} onChangeText={setText} />
      <Row>
        <Button title="Enviar en 3s (closure)" onPress={sendWithClosure} />
        <Button title="Enviar en 3s (ref)" variant="secondary" onPress={sendWithRef} />
      </Row>
      <LogView lines={lines} />
      <Note>
        Pulsa un botón y CAMBIA el texto antes de 3 segundos. El closure envía el texto del render en
        que se pulsó (a veces eso es lo correcto: “lo que el usuario vio al pulsar”). El ref lee el
        valor más reciente. Ninguno es “el bueno”: depende de lo que quieras.
      </Note>
    </Section>
  );
}

export default function Closures() {
  return (
    <Screen>
      <Note>
        Guía §1.5. Un closure es una función + las variables del scope donde se creó, que sigue
        usando aunque ese scope termine. En React, cada render crea funciones nuevas que encierran
        las props y el estado DE ESE RENDER.
      </Note>
      <FactoryDemo />
      <ReferenceDemo />
      <LoopDemo />
      <StaleIntervalDemo />
      <DelayedSendDemo />
    </Screen>
  );
}
