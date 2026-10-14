// "Backend" simulado en memoria. Tiene latencia y falla al azar para practicar
// manejo de errores, reintentos y sincronización offline-first.

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const randomDelay = (min = 300, max = 1200) => min + Math.random() * (max - min);

export class NetworkError extends Error {
  constructor(message = 'Error de red simulado') {
    super(message);
    this.name = 'NetworkError';
  }
}

type RequestOptions = { delay?: number; failRate?: number };

/** Resuelve `value` tras un retraso; falla con probabilidad `failRate` (0..1). */
export async function fakeRequest<T>(value: T, { delay, failRate = 0 }: RequestOptions = {}) {
  await wait(delay ?? randomDelay());
  if (Math.random() < failRate) throw new NetworkError();
  return value;
}

// ---- Todos (para la pantalla de Redux) ----

export type TodoDto = { id: string; title: string; done: boolean };

export function fetchTodosFromServer() {
  return fakeRequest<TodoDto[]>(
    [
      { id: 't1', title: 'Repasar hoisting', done: true },
      { id: 't2', title: 'Explicar el event loop', done: false },
      { id: 't3', title: 'Dibujar la arquitectura de microfrontends', done: false },
    ],
    { failRate: 0.2 },
  );
}

// ---- Notas (para la pantalla offline-first) ----

export type ServerNote = { id: string; text: string; updatedAt: number };

const serverNotes = new Map<string, ServerNote>();

/**
 * Guarda una nota con estrategia "last write wins": si el servidor tiene una
 * versión más reciente, la conserva y la devuelve para que el cliente la adopte.
 */
export async function pushNoteToServer(note: ServerNote): Promise<ServerNote> {
  await wait(randomDelay(400, 900));
  if (Math.random() < 0.25) throw new NetworkError('El servidor no respondió (25% de fallos simulados)');

  const existing = serverNotes.get(note.id);
  if (existing && existing.updatedAt > note.updatedAt) return existing;

  serverNotes.set(note.id, note);
  return note;
}

export function getServerNotesCount() {
  return serverNotes.size;
}
