// ✍️  TU ARCHIVO DE PRÁCTICA
// Implementa cada función y guarda: la app recarga sola (Fast Refresh).
// Abre "Retos de lógica" en la app y pulsa "Correr tests".
// No mires src/practice/challenges.ts hasta intentarlo 😉

/** true si el texto se lee igual al revés, ignorando mayúsculas, espacios y signos. */
export function isPalindrome(text: string): boolean {
  throw new Error('Sin implementar');
}

/** Aplana arrays anidados a cualquier profundidad: [1,[2,[3]]] → [1,2,3]. Sin usar .flat(). */
export function flatten(arr: unknown[]): unknown[] {
  throw new Error('Sin implementar');
}

/** Índices de los dos números que suman target, o null. Idealmente O(n). */
export function twoSum(nums: number[], target: number): [number, number] | null {
  throw new Error('Sin implementar');
}

/** Agrupa elementos por la clave que devuelve keyFn. */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  throw new Error('Sin implementar');
}

/** Devuelve una versión de fn que cachea resultados por argumento. */
export function memoize<A, R>(fn: (arg: A) => R): (arg: A) => R {
  throw new Error('Sin implementar');
}

/** Solo ejecuta fn cuando pasan `ms` milisegundos sin nuevas llamadas. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  return (...args: A): void => {
    throw new Error('Sin implementar');
  };
}

/** Tu propio Promise.all: resuelve con los valores EN ORDEN, o rechaza con el primer error. */
export function promiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
  return Promise.reject(new Error('Sin implementar'));
}

/** Comparación profunda de objetos/arrays/primitivos. */
export function deepEqual(a: unknown, b: unknown): boolean {
  throw new Error('Sin implementar');
}
