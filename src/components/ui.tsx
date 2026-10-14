import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';

export const colors = {
  bg: '#F6F7F9',
  card: '#FFFFFF',
  text: '#1B1F24',
  muted: '#5B6470',
  border: '#E1E4E8',
  primary: '#2F5BEA',
  codeBg: '#1E2330',
  codeText: '#E6EDF3',
  ok: '#1A7F37',
  error: '#CF222E',
  warn: '#9A6700',
};

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      {children}
    </ScrollView>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <Text style={styles.note}>{children}</Text>;
}

export function Code({ children }: { children: string }) {
  return (
    <ScrollView horizontal style={styles.code} contentContainerStyle={{ padding: 12 }}>
      <Text style={styles.codeText}>{children}</Text>
    </ScrollView>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && { color: colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/** Consola en pantalla: útil para ver el orden real de ejecución. */
export function LogView({ lines }: { lines: string[] }) {
  return (
    <View style={styles.code}>
      <View style={{ padding: 12 }}>
        {lines.length === 0 ? (
          <Text style={[styles.codeText, { opacity: 0.5 }]}>{'// sin salida todavía'}</Text>
        ) : (
          lines.map((line, i) => (
            <Text key={i} style={styles.codeText}>
              {line}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: 16, paddingBottom: 48, gap: 16 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  note: { fontSize: 14, lineHeight: 20, color: colors.muted },
  code: { backgroundColor: colors.codeBg, borderRadius: 8 },
  codeText: { fontFamily: 'Courier', fontSize: 13, lineHeight: 19, color: colors.codeText },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDanger: { backgroundColor: colors.error },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
});
