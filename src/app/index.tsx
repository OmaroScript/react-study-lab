import { Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, Note, Screen } from '@/components/ui';

const topics: { href: Href; title: string; subtitle: string; guide: string }[] = [
  {
    href: '/js-basics',
    title: 'Fundamentos de JS',
    subtitle: 'var / let / const, hoisting, NaN, null, undefined, coerción',
    guide: '§1',
  },
  {
    href: '/closures',
    title: 'Scope y closures',
    subtitle: 'Estado privado, var vs let, stale closures en React',
    guide: '§1.5',
  },
  {
    href: '/challenges',
    title: 'Retos de lógica',
    subtitle: 'Implementa funciones y corre los tests en el teléfono',
    guide: '§2',
  },
  {
    href: '/promises',
    title: 'Promesas y event loop',
    subtitle: 'all, allSettled, race, any, async/await, microtareas',
    guide: '§3',
  },
  {
    href: '/hooks',
    title: 'Hooks',
    subtitle: 'useState, useEffect, useMemo, useCallback, useRef, useReducer, custom hooks',
    guide: '§4',
  },
  {
    href: '/prop-drilling',
    title: 'Prop drilling',
    subtitle: 'El mismo árbol con props, composición y Context',
    guide: '§4.7',
  },
  {
    href: '/redux',
    title: 'Redux Toolkit',
    subtitle: 'Slices, thunks, entity adapter, selectores memoizados',
    guide: '§5',
  },
  {
    href: '/offline',
    title: 'Offline first',
    subtitle: 'Persistencia, cola de sincronización, reintentos, conflictos',
    guide: '§7',
  },
  {
    href: '/native-module',
    title: 'Módulo nativo',
    subtitle: 'Swift + Kotlin con la Expo Modules API, eventos nativo → JS',
    guide: '§6',
  },
  {
    href: '/microfrontends',
    title: 'Microfrontends',
    subtitle: 'Shell + remotes, carga diferida, event bus, aislamiento de errores',
    guide: '§8',
  },
];

export default function Home() {
  return (
    <Screen>
      <Note>
        Cada pantalla corresponde a una sección de GUIA.md. Lee la teoría, luego juega aquí y
        explica en voz alta lo que ves, como si estuvieras en la entrevista.
      </Note>
      {topics.map((t) => (
        <Link key={t.title} href={t.href} asChild>
          <Pressable style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.title}>{t.title}</Text>
              <Text style={s.subtitle}>{t.subtitle}</Text>
            </View>
            <Text style={s.badge}>{t.guide}</Text>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  badge: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
