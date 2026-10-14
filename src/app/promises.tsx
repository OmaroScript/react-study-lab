import { useRef, useState } from 'react';

import { Button, Code, LogView, Note, Row, Screen, Section } from '@/components/ui';
import { wait } from '@/services/fakeServer';

// Una "petición" falsa: resuelve o rechaza después de `ms`.
const task = (name: string, ms: number, fail = false) =>
  new Promise<string>((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error(`${name} falló`)) : resolve(name)), ms),
  );

/** Consola en pantalla con timestamps relativos al inicio del experimento. */
function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const start = useRef(0);
  const log = (msg: string) => {
    const t = Math.round(performance.now() - start.current);
    setLines((prev) => [...prev, `[${String(t).padStart(4, ' ')}ms] ${msg}`]);
  };
  const reset = () => {
    start.current = performance.now();
    setLines([]);
  };
  return { lines, log, reset };
}

const EVENT_LOOP_CODE = `console.log('1 sync');
setTimeout(() => console.log('2 timeout'), 0);
Promise.resolve().then(() => console.log('3 then'));
queueMicrotask(() => console.log('4 microtask'));
(async () => {
  console.log('5 async (parte síncrona)');
  await null;
  console.log('6 después del await');
})();
console.log('7 sync');`;

const COMBINATORS_CODE = `const A = task('A', 300);
const B = task('B', 100);
const C = task('C', 200, /* falla */ true);

Promise.all([A, B, C])        // rechaza con el 1er error
Promise.allSettled([A, B, C]) // nunca rechaza
Promise.race([A, B, C])       // la primera que TERMINE
Promise.any([A, B, C])        // la primera que CUMPLA`;

export default function Promises() {
  const loop = useLog();
  const comb = useLog();
  const flow = useLog();
  const [cancelable, setCancelable] = useState<AbortController | null>(null);

  const runEventLoop = () => {
    loop.reset();
    // Mismo código que el bloque de arriba, pero escribiendo en pantalla.
    const push = loop.log;
    push('1 sync');
    setTimeout(() => push('2 timeout'), 0);
    Promise.resolve().then(() => push('3 then'));
    queueMicrotask(() => push('4 microtask'));
    (async () => {
      push('5 async (parte síncrona)');
      await null;
      push('6 después del await');
    })();
    push('7 sync');
  };

  const runCombinator = async (kind: 'all' | 'allSettled' | 'race' | 'any') => {
    comb.reset();
    const promises = [task('A', 300), task('B', 100), task('C', 200, true)];
    comb.log(`Promise.${kind}(...) iniciado`);
    try {
      let result: unknown;
      if (kind === 'all') result = await Promise.all(promises);
      if (kind === 'allSettled') result = await Promise.allSettled(promises);
      if (kind === 'race') result = await Promise.race(promises);
      if (kind === 'any') result = await Promise.any(promises);
      comb.log(`✓ resolvió: ${JSON.stringify(result)}`);
    } catch (e) {
      comb.log(`✗ rechazó: ${(e as Error).message}`);
    }
  };

  const runSequentialVsParallel = async () => {
    flow.reset();
    flow.log('Secuencial (await uno por uno)…');
    const t0 = performance.now();
    await task('X', 300);
    await task('Y', 300);
    await task('Z', 300);
    flow.log(`secuencial tardó ~${Math.round(performance.now() - t0)}ms`);

    flow.log('Paralelo (Promise.all)…');
    const t1 = performance.now();
    await Promise.all([task('X', 300), task('Y', 300), task('Z', 300)]);
    flow.log(`paralelo tardó ~${Math.round(performance.now() - t1)}ms`);
  };

  const runRetry = async () => {
    flow.reset();
    let attempt = 0;
    // Falla las 2 primeras veces para ver el backoff en acción.
    const flaky = () => {
      attempt++;
      return task(`intento ${attempt}`, 100, attempt < 3);
    };

    async function retry<T>(fn: () => Promise<T>, retries = 4, baseMs = 200): Promise<T> {
      for (let i = 0; ; i++) {
        try {
          return await fn();
        } catch (e) {
          if (i >= retries) throw e;
          const delay = baseMs * 2 ** i;
          flow.log(`✗ ${(e as Error).message}; reintento en ${delay}ms`);
          await wait(delay);
        }
      }
    }

    try {
      const r = await retry(flaky);
      flow.log(`✓ ${r} funcionó`);
    } catch (e) {
      flow.log(`✗ se agotaron los reintentos: ${(e as Error).message}`);
    }
  };

  const runTimeout = async () => {
    flow.reset();
    const withTimeout = <T,>(p: Promise<T>, ms: number) =>
      Promise.race([
        p,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`timeout de ${ms}ms`)), ms),
        ),
      ]);
    try {
      await withTimeout(task('lenta', 1500), 500);
    } catch (e) {
      flow.log(`✗ ${(e as Error).message}`);
    }
  };

  const runAbortable = async () => {
    flow.reset();
    const controller = new AbortController();
    setCancelable(controller);
    flow.log('Descarga de 3s iniciada. Pulsa "Cancelar".');
    try {
      await new Promise<void>((resolve, reject) => {
        const id = setTimeout(resolve, 3000);
        controller.signal.addEventListener('abort', () => {
          clearTimeout(id);
          reject(new Error('AbortError: cancelada por el usuario'));
        });
      });
      flow.log('✓ descarga completada');
    } catch (e) {
      flow.log(`✗ ${(e as Error).message}`);
    } finally {
      setCancelable(null);
    }
  };

  return (
    <Screen>
      <Section title="1. Event loop: ¿en qué orden se imprime?">
        <Code>{EVENT_LOOP_CODE}</Code>
        <Note>
          Predice el orden y luego ejecútalo. Regla: primero todo el código síncrono, después se
          vacía la cola de MICROtareas (then, queueMicrotask, continuación de await) y recién
          entonces se ejecuta una MACROtarea (setTimeout).
        </Note>
        <Button title="Ejecutar" onPress={runEventLoop} />
        <LogView lines={loop.lines} />
      </Section>

      <Section title="2. Combinadores de promesas">
        <Code>{COMBINATORS_CODE}</Code>
        <Row>
          <Button title="all" onPress={() => runCombinator('all')} />
          <Button title="allSettled" onPress={() => runCombinator('allSettled')} />
          <Button title="race" onPress={() => runCombinator('race')} />
          <Button title="any" onPress={() => runCombinator('any')} />
        </Row>
        <LogView lines={comb.lines} />
        <Note>
          Ojo: all rechaza en cuanto C falla (200ms), pero A sigue corriendo: las promesas no se
          “cancelan”, solo se ignora su resultado.
        </Note>
      </Section>

      <Section title="3. Patrones async/await del día a día">
        <Row>
          <Button title="Secuencial vs paralelo" onPress={runSequentialVsParallel} />
          <Button title="Reintentos con backoff" onPress={runRetry} />
          <Button title="Timeout con race" onPress={runTimeout} />
          <Button title="Cancelable (AbortController)" onPress={runAbortable} />
          {cancelable && (
            <Button title="Cancelar" variant="danger" onPress={() => cancelable.abort()} />
          )}
        </Row>
        <LogView lines={flow.lines} />
      </Section>
    </Screen>
  );
}
