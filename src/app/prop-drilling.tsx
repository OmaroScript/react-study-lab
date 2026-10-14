import { createContext, memo, ReactNode, useContext, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Code, colors, Note, Row, Screen, Section } from '@/components/ui';
import { useRenderCount } from '@/components/useRenderCount';

type User = { name: string };
const NAMES = ['Ana', 'Luis', 'Eva', 'Leo'];
const nextName = (name: string) => NAMES[(NAMES.indexOf(name) + 1) % NAMES.length];

/** Caja visual de cada nivel del árbol: nombre, si recibe `user` y cuántas veces renderizó. */
function Box({
  name,
  knowsUser,
  renders,
  children,
}: {
  name: string;
  knowsUser: boolean;
  renders: number;
  children?: ReactNode;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: knowsUser ? colors.warn : colors.border,
        borderRadius: 8,
        padding: 8,
        gap: 6,
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ fontSize: 12, color: colors.muted }}>
        <Text style={{ fontWeight: '700', color: colors.text }}>{name}</Text>
        {'  '}renders: {renders}
        {knowsUser ? '  · conoce `user`' : ''}
      </Text>
      {children}
    </View>
  );
}

function AvatarView({ user, renders }: { user: User; renders: number }) {
  return (
    <Box name="Avatar" knowsUser renders={renders}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>👤 {user.name}</Text>
    </Box>
  );
}

function Controls({ onRename, onUnrelated, unrelated }: { onRename: () => void; onUnrelated: () => void; unrelated: number }) {
  return (
    <Row>
      <Button title="Cambiar nombre" onPress={onRename} />
      <Button title={`Estado no relacionado: ${unrelated}`} variant="secondary" onPress={onUnrelated} />
    </Row>
  );
}

// ---------------------------------------------------------------------------
// A. Prop drilling
// ---------------------------------------------------------------------------
function DLayout({ user }: { user: User }) {
  return (
    <Box name="Layout" knowsUser renders={useRenderCount()}>
      <DSidebar user={user} />
    </Box>
  );
}
function DSidebar({ user }: { user: User }) {
  return (
    <Box name="Sidebar" knowsUser renders={useRenderCount()}>
      <DMenu user={user} />
    </Box>
  );
}
function DMenu({ user }: { user: User }) {
  return (
    <Box name="Menu" knowsUser renders={useRenderCount()}>
      <DAvatar user={user} />
    </Box>
  );
}
function DAvatar({ user }: { user: User }) {
  return <AvatarView user={user} renders={useRenderCount()} />;
}

function DrillingVersion() {
  const [user, setUser] = useState<User>({ name: 'Ana' });
  const [unrelated, setUnrelated] = useState(0);
  return (
    <Section title="A. Prop drilling">
      <Code>{`<App user>  →  <Layout user>  →  <Sidebar user>
           →  <Menu user>  →  <Avatar user>`}</Code>
      <Controls
        unrelated={unrelated}
        onRename={() => setUser((u) => ({ name: nextName(u.name) }))}
        onUnrelated={() => setUnrelated((n) => n + 1)}
      />
      <Box name="App" knowsUser renders={useRenderCount()}>
        <DLayout user={user} />
      </Box>
      <Note>
        Los 3 intermediarios (en amarillo) tienen que declarar y pasar `user` aunque no lo usen. Y
        cualquier cambio en App re-renderiza todo el árbol.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// B. Composición: App construye el Avatar y lo pasa como "slot"
// ---------------------------------------------------------------------------
function CLayout({ sidebar }: { sidebar: ReactNode }) {
  return (
    <Box name="Layout" knowsUser={false} renders={useRenderCount()}>
      {sidebar}
    </Box>
  );
}
function CSidebar({ menu }: { menu: ReactNode }) {
  return (
    <Box name="Sidebar" knowsUser={false} renders={useRenderCount()}>
      {menu}
    </Box>
  );
}
function CMenu({ avatar }: { avatar: ReactNode }) {
  return (
    <Box name="Menu" knowsUser={false} renders={useRenderCount()}>
      {avatar}
    </Box>
  );
}
function CAvatar({ user }: { user: User }) {
  return <AvatarView user={user} renders={useRenderCount()} />;
}

function CompositionVersion() {
  const [user, setUser] = useState<User>({ name: 'Ana' });
  const [unrelated, setUnrelated] = useState(0);
  return (
    <Section title="B. Composición (children / slots)">
      <Code>{`<Layout sidebar={
  <Sidebar menu={
    <Menu avatar={<Avatar user={user} />} />
  } />
} />`}</Code>
      <Controls
        unrelated={unrelated}
        onRename={() => setUser((u) => ({ name: nextName(u.name) }))}
        onUnrelated={() => setUnrelated((n) => n + 1)}
      />
      <Box name="App" knowsUser renders={useRenderCount()}>
        <CLayout sidebar={<CSidebar menu={<CMenu avatar={<CAvatar user={user} />} />} />} />
      </Box>
      <Note>
        Los intermediarios ya NO conocen `user`: solo reciben “algo que pintar”. Se elimina el
        acoplamiento sin librerías ni Context. Pero siguen re-renderizando, porque App crea
        elementos nuevos en cada render.
      </Note>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// C. Context + memo
// ---------------------------------------------------------------------------
const UserContext = createContext<User | null>(null);

function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error('useUser debe usarse dentro de <UserContext.Provider>');
  return user;
}

// memo: como no reciben props, si su padre re-renderiza ellos NO lo hacen.
const XLayout = memo(function XLayout() {
  return (
    <Box name="Layout (memo)" knowsUser={false} renders={useRenderCount()}>
      <XSidebar />
    </Box>
  );
});
const XSidebar = memo(function XSidebar() {
  return (
    <Box name="Sidebar (memo)" knowsUser={false} renders={useRenderCount()}>
      <XMenu />
    </Box>
  );
});
const XMenu = memo(function XMenu() {
  return (
    <Box name="Menu (memo)" knowsUser={false} renders={useRenderCount()}>
      <XAvatar />
    </Box>
  );
});
function XAvatar() {
  const user = useUser(); // lo lee directo del contexto
  return <AvatarView user={user} renders={useRenderCount()} />;
}

function ContextVersion() {
  const [name, setName] = useState('Ana');
  const [unrelated, setUnrelated] = useState(0);
  // Memoizar el value: si fuera un objeto nuevo en cada render, todos los consumidores
  // re-renderizarían también con el "estado no relacionado".
  const user = useMemo(() => ({ name }), [name]);
  return (
    <Section title="C. Context + memo">
      <Code>{`<UserContext.Provider value={user}>
  <Layout />           // memo, sin props
</UserContext.Provider>

function Avatar() {
  const user = useContext(UserContext);
}`}</Code>
      <Controls
        unrelated={unrelated}
        onRename={() => setName(nextName)}
        onUnrelated={() => setUnrelated((n) => n + 1)}
      />
      <Box name="App" knowsUser renders={useRenderCount()}>
        <UserContext.Provider value={user}>
          <XLayout />
        </UserContext.Provider>
      </Box>
      <Note>
        Cambia el nombre: solo App y Avatar re-renderizan; los intermediarios memo se lo saltan
        porque el contexto “salta” directo al consumidor. Con “estado no relacionado” solo
        re-renderiza App. Compara los contadores con A y B.
      </Note>
    </Section>
  );
}

const VERSIONS = {
  A: { label: 'A. Drilling', Component: DrillingVersion },
  B: { label: 'B. Composición', Component: CompositionVersion },
  C: { label: 'C. Context', Component: ContextVersion },
} as const;

export default function PropDrilling() {
  const [version, setVersion] = useState<keyof typeof VERSIONS>('A');
  const { Component } = VERSIONS[version];

  return (
    <Screen>
      <Note>
        Guía §4.7. El mismo árbol App → Layout → Sidebar → Menu → Avatar, donde solo Avatar usa
        `user`, resuelto de 3 formas. Pulsa los botones y compara los contadores de renders.
      </Note>
      <Row>
        {(Object.keys(VERSIONS) as (keyof typeof VERSIONS)[]).map((key) => (
          <Button
            key={key}
            title={VERSIONS[key].label}
            variant={key === version ? 'primary' : 'secondary'}
            onPress={() => setVersion(key)}
          />
        ))}
      </Row>
      <Component key={version} />
      <Section title="¿Cuál uso?">
        <Note>
          • 1–2 niveles: pasa las props, es lo más claro.{'\n'}
          • El estado está muy arriba: bájalo a donde se usa.{'\n'}
          • Los intermedios solo “acomodan” cosas: composición.{'\n'}
          • Dato global que cambia poco (usuario, tema, idioma): Context.{'\n'}
          • Estado compartido grande o que cambia mucho: Redux o Zustand (ver guía §9).
        </Note>
      </Section>
    </Screen>
  );
}
