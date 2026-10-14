import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { colors } from '@/components/ui';
import { NOTES_STORAGE_KEY, store, useAppDispatch } from '@/store';
import { connectionChanged } from '@/store/networkSlice';
import { notesHydrated } from '@/store/notesSlice';

/** Conecta el mundo exterior (red, disco) con Redux una sola vez al arrancar. */
function Bootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Suscripción a cambios de red; la función devuelta desuscribe (cleanup).
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isConnected puede ser null mientras se determina: lo tratamos como conectado.
      dispatch(connectionChanged(state.isConnected !== false));
    });

    AsyncStorage.getItem(NOTES_STORAGE_KEY)
      .then((raw) => dispatch(notesHydrated(raw ? JSON.parse(raw) : null)))
      .catch(() => dispatch(notesHydrated(null)));

    return unsubscribe;
  }, [dispatch]);

  return null;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Bootstrap />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Práctica de entrevista' }} />
        <Stack.Screen name="js-basics" options={{ title: 'JS: var, hoisting, NaN…' }} />
        <Stack.Screen name="closures" options={{ title: 'Scope y closures' }} />
        <Stack.Screen name="challenges" options={{ title: 'Retos de lógica' }} />
        <Stack.Screen name="promises" options={{ title: 'Promesas y event loop' }} />
        <Stack.Screen name="hooks" options={{ title: 'Hooks' }} />
        <Stack.Screen name="prop-drilling" options={{ title: 'Prop drilling' }} />
        <Stack.Screen name="redux" options={{ title: 'Redux Toolkit' }} />
        <Stack.Screen name="offline" options={{ title: 'Offline first' }} />
        <Stack.Screen name="native-module" options={{ title: 'Módulo nativo' }} />
        <Stack.Screen name="microfrontends" options={{ title: 'Microfrontends' }} />
      </Stack>
    </Provider>
  );
}
