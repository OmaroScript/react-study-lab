// Event bus tipado: los microfrontends se comunican por CONTRATO (nombre de evento + payload),
// sin importarse entre sí. Equivale a CustomEvent en window, BroadcastChannel o un pub/sub.

export type MfeEvents = {
  'cart:item-added': { id: string; name: string; price: number };
  'cart:count-changed': { count: number; total: number };
  'auth:changed': { user: string | null };
  'shell:navigate': { to: string };
};

type Handler<T> = (payload: T) => void;

class EventBus<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<Handler<any>>>();
  /** Último valor por evento: permite que un MFE que carga tarde reciba el estado actual. */
  private lastValue = new Map<keyof Events, unknown>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>, { replay = false } = {}) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    if (replay && this.lastValue.has(event)) handler(this.lastValue.get(event) as Events[K]);
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    this.lastValue.set(event, payload);
    this.handlers.get(event)?.forEach((h) => {
      // Un suscriptor roto no debe tumbar a los demás.
      try {
        h(payload);
      } catch (e) {
        console.warn(`[bus] handler de "${String(event)}" falló`, e);
      }
    });
  }

  listenerCount() {
    let n = 0;
    this.handlers.forEach((set) => (n += set.size));
    return n;
  }
}

export const bus = new EventBus<MfeEvents>();
