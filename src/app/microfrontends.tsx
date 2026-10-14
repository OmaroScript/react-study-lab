import { Component, ComponentType, lazy, LazyExoticComponent, ReactNode, Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';

import { Button, colors, LogView, Note, Row, Screen, Section } from '@/components/ui';
import { bus, MfeEvents } from '@/microfrontends/eventBus';
import { MfeProps, RemoteManifest, remotes, SHELL_REACT_VERSION } from '@/microfrontends/registry';

// ---------------------------------------------------------------------------
// Error Boundary: un remote roto no debe tumbar al shell ni a los demás remotes.
// (Tiene que ser un class component: no existe un hook equivalente.)
// ---------------------------------------------------------------------------
class MfeErrorBoundary extends Component<
  { name: string; onRetry: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Aquí reportarías a Sentry/Datadog con el nombre y versión del remote.
    console.warn(`[shell] el microfrontend "${this.props.name}" falló:`, error.message);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.error }}>
            ⚠️ “{this.props.name}” no está disponible ({this.state.error.message})
          </Text>
          <Button title="Reintentar" variant="secondary" onPress={this.props.onRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}

// Cada remote se "descarga" una sola vez (como el remoteEntry.js cacheado).
const lazyCache = new Map<string, LazyExoticComponent<ComponentType<MfeProps>>>();
function getLazyRemote(remote: RemoteManifest) {
  if (!lazyCache.has(remote.name)) lazyCache.set(remote.name, lazy(remote.load));
  return lazyCache.get(remote.name)!;
}

function MfeSlot({ remote, props }: { remote: RemoteManifest; props: MfeProps }) {
  const [enabled, setEnabled] = useState(remote.enabledByDefault ?? true);
  const [attempt, setAttempt] = useState(0);
  // El componente lazy se guarda en estado: debe ser una referencia estable entre renders
  // (si cambiara en cada render, React desmontaría y volvería a montar el remote).
  const [Remote, setRemote] = useState(() => getLazyRemote(remote));
  const compatible = remote.requiresReact === SHELL_REACT_VERSION;

  const retry = () => {
    lazyCache.delete(remote.name); // descarta el módulo (o la promesa rechazada) en caché
    setRemote(() => getLazyRemote(remote));
    setAttempt((a) => a + 1);
  };

  let content: ReactNode;
  if (!enabled) {
    content = (
      <Text style={{ color: colors.muted }}>
        {remote.enabledByDefault === false
          ? 'Apagado. Este remote tiene un bug a propósito: al encenderlo verás el overlay rojo de desarrollo; ciérralo y observa que el shell y los demás remotes siguen funcionando.'
          : 'Desactivado por feature flag (kill switch).'}
      </Text>
    );
  } else if (!compatible) {
    content = (
      <Text style={{ color: colors.warn }}>
        ⛔ Requiere React {remote.requiresReact}, el shell comparte React {SHELL_REACT_VERSION}. No se
        carga para evitar dos copias de React (hooks rotos, contextos que no se comparten).
      </Text>
    );
  } else {
    content = (
      <MfeErrorBoundary key={attempt} name={remote.name} onRetry={retry}>
        <Suspense
          fallback={
            <Row>
              <ActivityIndicator />
              <Text style={{ color: colors.muted }}>Descargando {remote.name}@{remote.version}…</Text>
            </Row>
          }
        >
          <Remote {...props} />
        </Suspense>
      </MfeErrorBoundary>
    );
  }

  return (
    <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 10, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700' }}>
          {remote.name} <Text style={{ color: colors.muted, fontWeight: '400' }}>v{remote.version} · {remote.team}</Text>
        </Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
      {content}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shell (host): layout, sesión, navegación y orquestación de remotes.
// ---------------------------------------------------------------------------
export default function MicrofrontendsShell() {
  const [user, setUser] = useState<string | null>(null);
  const [cart, setCart] = useState<MfeEvents['cart:count-changed']>({ count: 0, total: 0 });
  const [busLog, setBusLog] = useState<string[]>([]);
  const [route, setRoute] = useState('home');

  useEffect(() => {
    const push = (s: string) => setBusLog((prev) => [...prev.slice(-7), s]);
    const offs = [
      bus.on('cart:count-changed', (c) => setCart(c), { replay: true }),
      bus.on('cart:item-added', (p) => push(`cart:item-added ${JSON.stringify(p)}`)),
      bus.on('cart:count-changed', (p) => push(`cart:count-changed ${JSON.stringify(p)}`)),
      bus.on('auth:changed', (p) => push(`auth:changed ${JSON.stringify(p)}`)),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const toggleLogin = () => {
    const next = user ? null : 'Ana';
    setUser(next);
    bus.emit('auth:changed', { user: next });
  };

  const props: MfeProps = {
    user,
    onNavigate: (to) => {
      setRoute(to);
      bus.emit('shell:navigate', { to });
    },
  };

  return (
    <Screen>
      <Section title="🧩 Shell (host)">
        <Row>
          <Text>Usuario: {user ?? 'invitado'}</Text>
          <Text>🛒 {cart.count} · ${cart.total}</Text>
          <Text>Ruta: /{route}</Text>
        </Row>
        <Button title={user ? 'Cerrar sesión' : 'Iniciar sesión'} variant="secondary" onPress={toggleLogin} />
        <Note>
          El shell es dueño de: sesión, navegación, layout y de decidir QUÉ remotes cargar y
          CUÁNDO. El badge del carrito se actualiza por un evento, no porque el shell lea el estado
          interno del carrito.
        </Note>
      </Section>

      <Section title="Remotes">
        {remotes.map((r) => (
          <MfeSlot key={r.name} remote={r} props={props} />
        ))}
      </Section>

      <Section title="Tráfico del event bus">
        <LogView lines={busLog} />
        <Note>
          Experimentos:{'\n'}
          • Agrega productos: catálogo → evento → carrito → evento → shell.{'\n'}
          • Apaga el carrito con su switch y agrega productos: los eventos se pierden (nadie
          escucha). Vuelve a encenderlo: su estado se reinició. ¿Dónde debería vivir ese estado?{'\n'}
          • Enciende “recommendations”: falla en runtime (en desarrollo sale un overlay rojo; ciérralo) y{'\n'}el Error Boundary lo aísla: el resto sigue funcionando.{'\n'}
          • “legacy-profile” pide otra versión de React: el shell lo bloquea.
        </Note>
      </Section>
    </Screen>
  );
}
