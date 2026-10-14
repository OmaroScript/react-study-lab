// Enunciados, tests y soluciones de referencia de los retos de lógica.
import * as mine from './mySolutions';

type AnyFn = (...args: any[]) => any;

export type Challenge = {
  id: keyof typeof mine;
  title: string;
  statement: string;
  hint: string;
  referenceCode: string;
  reference: AnyFn;
  /** Cada test recibe la implementación a probar y lanza si falla. */
  tests: { name: string; run: (fn: any) => void | Promise<void> }[];
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function assertEqual(actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`Esperado ${e}, obtenido ${a}`);
}

// ---- Soluciones de referencia ----

function isPalindrome(text: string) {
  const clean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9ñ]/g, '');
  let i = 0;
  let j = clean.length - 1;
  while (i < j) {
    if (clean[i] !== clean[j]) return false;
    i++;
    j--;
  }
  return true;
}

function flatten(arr: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const item of arr) {
    if (Array.isArray(item)) out.push(...flatten(item));
    else out.push(item);
  }
  return out;
}

function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>(); // valor -> índice
  for (let i = 0; i < nums.length; i++) {
    const needed = target - nums[i];
    if (seen.has(needed)) return [seen.get(needed)!, i];
    seen.set(nums[i], i);
  }
  return null;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

function memoize<A, R>(fn: (arg: A) => R) {
  const cache = new Map<A, R>();
  return (arg: A) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg)!;
  };
}

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function promiseAll<T>(promises: Promise<T>[]) {
  return new Promise<T[]>((resolve, reject) => {
    const results: T[] = new Array(promises.length);
    let pending = promises.length;
    if (pending === 0) return resolve(results);
    promises.forEach((p, i) => {
      Promise.resolve(p).then((value) => {
        results[i] = value;
        if (--pending === 0) resolve(results);
      }, reject);
    });
  });
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

// ---- Catálogo ----

export const challenges: Challenge[] = [
  {
    id: 'isPalindrome',
    title: 'Palíndromo',
    statement: 'Devuelve true si el texto se lee igual al revés, ignorando mayúsculas, espacios, acentos y signos.',
    hint: 'Normaliza el texto y compara con dos punteros (inicio y fin) → O(n) tiempo, O(1) extra.',
    reference: isPalindrome,
    referenceCode: `function isPalindrome(text) {
  const clean = text.toLowerCase()
    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9ñ]/g, '');
  let i = 0, j = clean.length - 1;
  while (i < j) {
    if (clean[i] !== clean[j]) return false;
    i++; j--;
  }
  return true;
}`,
    tests: [
      { name: "'Anita lava la tina' → true", run: (fn) => assertEqual(fn('Anita lava la tina'), true) },
      { name: "'¿Acaso hubo búhos acá?' → true", run: (fn) => assertEqual(fn('¿Acaso hubo búhos acá?'), true) },
      { name: "'React' → false", run: (fn) => assertEqual(fn('React'), false) },
      { name: "'' → true", run: (fn) => assertEqual(fn(''), true) },
    ],
  },
  {
    id: 'flatten',
    title: 'Aplanar arrays',
    statement: 'Aplana arrays anidados a cualquier profundidad sin usar Array.prototype.flat.',
    hint: 'Recursión: si el elemento es array, aplánalo y concaténalo; si no, agrégalo. También se puede con una pila (iterativo).',
    reference: flatten,
    referenceCode: `function flatten(arr) {
  const out = [];
  for (const item of arr) {
    if (Array.isArray(item)) out.push(...flatten(item));
    else out.push(item);
  }
  return out;
}`,
    tests: [
      { name: '[1,[2,[3,[4]]]] → [1,2,3,4]', run: (fn) => assertEqual(fn([1, [2, [3, [4]]]]), [1, 2, 3, 4]) },
      { name: '[] → []', run: (fn) => assertEqual(fn([]), []) },
      { name: "mezcla de tipos", run: (fn) => assertEqual(fn(['a', [null, [true]]]), ['a', null, true]) },
    ],
  },
  {
    id: 'twoSum',
    title: 'Two Sum',
    statement: 'Dado un array y un target, devuelve los índices de los dos números que suman target (o null).',
    hint: 'La solución O(n²) con dos bucles es válida para empezar. La O(n) usa un Map de valor → índice.',
    reference: twoSum,
    referenceCode: `function twoSum(nums, target) {
  const seen = new Map(); // valor -> índice
  for (let i = 0; i < nums.length; i++) {
    const needed = target - nums[i];
    if (seen.has(needed)) return [seen.get(needed), i];
    seen.set(nums[i], i);
  }
  return null;
}`,
    tests: [
      { name: '[2,7,11,15], 9 → [0,1]', run: (fn) => assertEqual(fn([2, 7, 11, 15], 9), [0, 1]) },
      { name: '[3,2,4], 6 → [1,2]', run: (fn) => assertEqual(fn([3, 2, 4], 6), [1, 2]) },
      { name: '[1,2], 10 → null', run: (fn) => assertEqual(fn([1, 2], 10), null) },
    ],
  },
  {
    id: 'groupBy',
    title: 'groupBy',
    statement: 'Agrupa una lista en un objeto usando la clave que devuelve keyFn.',
    hint: 'reduce con un acumulador {}; ??= es útil para inicializar el array.',
    reference: groupBy,
    referenceCode: `function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}`,
    tests: [
      {
        name: 'agrupa por paridad',
        run: (fn) =>
          assertEqual(fn([1, 2, 3, 4], (n: number) => (n % 2 ? 'impar' : 'par')), {
            impar: [1, 3],
            par: [2, 4],
          }),
      },
      { name: '[] → {}', run: (fn) => assertEqual(fn([], () => 'x'), {}) },
    ],
  },
  {
    id: 'memoize',
    title: 'memoize',
    statement: 'Devuelve una función que cachea el resultado por argumento: fn solo se llama una vez por cada input.',
    hint: 'Closure + Map. Pregunta de seguimiento típica: ¿cómo invalidarías la caché? ¿y con varios argumentos?',
    reference: memoize,
    referenceCode: `function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}`,
    tests: [
      {
        name: 'llama a fn solo una vez por argumento',
        run: (fn) => {
          let calls = 0;
          const square = fn((n: number) => {
            calls++;
            return n * n;
          });
          assertEqual([square(4), square(4), square(5)], [16, 16, 25]);
          assertEqual(calls, 2);
        },
      },
      {
        name: 'cachea también resultados falsy (0, undefined)',
        run: (fn) => {
          let calls = 0;
          const zero = fn(() => {
            calls++;
            return 0;
          });
          zero('a');
          zero('a');
          assertEqual(calls, 1);
        },
      },
    ],
  },
  {
    id: 'debounce',
    title: 'debounce',
    statement: 'Devuelve una función que solo ejecuta fn cuando pasan ms milisegundos sin nuevas llamadas (con los últimos argumentos).',
    hint: 'Guarda el timer en un closure; en cada llamada clearTimeout + setTimeout.',
    reference: debounce,
    referenceCode: `function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}`,
    tests: [
      {
        name: '3 llamadas rápidas → 1 ejecución con el último valor',
        run: async (fn) => {
          const received: string[] = [];
          const d = fn((v: string) => received.push(v), 50);
          d('a');
          d('b');
          d('c');
          await wait(120);
          assertEqual(received, ['c']);
        },
      },
      {
        name: 'llamadas separadas → se ejecutan ambas',
        run: async (fn) => {
          const received: number[] = [];
          const d = fn((v: number) => received.push(v), 30);
          d(1);
          await wait(80);
          d(2);
          await wait(80);
          assertEqual(received, [1, 2]);
        },
      },
    ],
  },
  {
    id: 'promiseAll',
    title: 'Promise.all casero',
    statement: 'Implementa Promise.all: resuelve con los valores en el MISMO orden de entrada o rechaza con el primer error.',
    hint: 'new Promise + contador de pendientes; guarda por índice, no con push (el orden de resolución no es el de entrada).',
    reference: promiseAll,
    referenceCode: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = new Array(promises.length);
    let pending = promises.length;
    if (pending === 0) return resolve(results);
    promises.forEach((p, i) => {
      Promise.resolve(p).then((value) => {
        results[i] = value;
        if (--pending === 0) resolve(results);
      }, reject);
    });
  });
}`,
    tests: [
      {
        name: 'respeta el orden aunque resuelvan desordenadas',
        run: async (fn) => {
          const slow = wait(60).then(() => 'lenta');
          const fast = wait(10).then(() => 'rápida');
          assertEqual(await fn([slow, fast]), ['lenta', 'rápida']);
        },
      },
      { name: '[] → []', run: async (fn) => assertEqual(await fn([]), []) },
      {
        name: 'rechaza con el primer error',
        run: async (fn) => {
          try {
            await fn([wait(50).then(() => 1), Promise.reject(new Error('boom'))]);
            throw new Error('Debía rechazar');
          } catch (e) {
            assertEqual((e as Error).message, 'boom');
          }
        },
      },
    ],
  },
  {
    id: 'deepEqual',
    title: 'deepEqual',
    statement: 'Compara en profundidad dos valores (objetos, arrays, primitivos). NaN debe ser igual a NaN.',
    hint: 'Caso base con Object.is; luego compara cantidad de claves y recursión por cada clave.',
    reference: deepEqual,
    referenceCode: `function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object'
      || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => deepEqual(a[k], b[k]));
}`,
    tests: [
      { name: 'objetos anidados iguales', run: (fn) => assertEqual(fn({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }), true) },
      { name: 'distinto valor anidado', run: (fn) => assertEqual(fn({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] }), false) },
      { name: 'NaN vs NaN', run: (fn) => assertEqual(fn(NaN, NaN), true) },
      { name: 'null vs {}', run: (fn) => assertEqual(fn(null, {}), false) },
      { name: '[] vs {}', run: (fn) => assertEqual(fn([], {}), false) },
    ],
  },
];

export const mySolutions = mine as unknown as Record<string, AnyFn>;
