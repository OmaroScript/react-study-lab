import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';

import { Button, Code, colors, LogView, Note, Row, Screen, Section } from '@/components/ui';
import DeviceInfo from '../../modules/device-info';

const SWIFT_SNIPPET = `// modules/device-info/ios/DeviceInfoModule.swift
public class DeviceInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeviceInfo")
    Events("onPing")
    Constant("platform") { "ios" }
    Function("getDeviceSummary") { ... }       // síncrona
    AsyncFunction("getBatteryLevelAsync") { ... } // → Promise
  }
}`;

const JS_SNIPPET = `// modules/device-info/src/DeviceInfoModule.ts
export default requireOptionalNativeModule('DeviceInfo');

// Uso
const info = DeviceInfo.getDeviceSummary();
const level = await DeviceInfo.getBatteryLevelAsync();
const sub = DeviceInfo.addListener('onPing', (e) => ...);
sub.remove();`;

export default function NativeModuleScreen() {
  const [lines, setLines] = useState<string[]>([]);
  const log = (s: string) => setLines((prev) => [...prev.slice(-8), s]);

  // Suscripción a eventos nativo → JS; el cleanup evita fugas de listeners.
  useEffect(() => {
    if (!DeviceInfo) return;
    const sub = DeviceInfo.addListener('onPing', (e) => {
      log(`📨 evento onPing desde nativo: "${e.message}" @ ${new Date(e.receivedAt).toLocaleTimeString()}`);
    });
    return () => sub.remove();
  }, []);

  if (!DeviceInfo) {
    return (
      <Screen>
        <Section title="El módulo nativo no está en este binario">
          <Note>
            Estás en Expo Go (o en web). Expo Go solo trae los módulos nativos que Expo empaqueta;
            tu código Swift/Kotlin necesita compilarse en un “development build”:
          </Note>
          <Code>{`npx expo run:ios      # requiere Xcode
npx expo run:android  # requiere Android Studio`}</Code>
          <Note>
            Mientras tanto, esto es lo que JS puede saber sin módulo propio: {Platform.OS}{' '}
            {String(Platform.Version)}. Gracias a requireOptionalNativeModule la app muestra este
            fallback en vez de crashear: es el mismo patrón que usarías para degradar con gracia
            una funcionalidad opcional.
          </Note>
        </Section>
        <Section title="Cómo está hecho">
          <Code>{SWIFT_SNIPPET}</Code>
          <Code>{JS_SNIPPET}</Code>
        </Section>
      </Screen>
    );
  }

  const module = DeviceInfo;

  return (
    <Screen>
      <Section title="Llamadas JS → nativo">
        <Text style={{ color: colors.muted }}>Constante platform: {module.platform}</Text>
        <Row>
          <Button
            title="getDeviceSummary() (sync)"
            onPress={() => log(`📱 ${JSON.stringify(module.getDeviceSummary())}`)}
          />
          <Button
            title="getBatteryLevelAsync()"
            onPress={async () => {
              const level = await module.getBatteryLevelAsync();
              log(level < 0 ? '🔋 desconocido (¿simulador?)' : `🔋 ${Math.round(level * 100)}%`);
            }}
          />
          <Button
            title="pingAsync() → evento"
            variant="secondary"
            onPress={() => module.pingAsync('hola desde JS')}
          />
        </Row>
        <LogView lines={lines} />
      </Section>
      <Section title="Cómo está hecho">
        <Code>{SWIFT_SNIPPET}</Code>
        <Code>{JS_SNIPPET}</Code>
      </Section>
    </Screen>
  );
}
