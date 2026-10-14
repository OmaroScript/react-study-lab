import { Text } from 'react-native';

import type { MfeProps } from '../registry';

type Recommendation = { title: string };

// Simula un remote desplegado con un bug: espera un campo que la API ya no envía.
export default function BrokenMfe(_: MfeProps) {
  const apiResponse = { data: null } as unknown as { data: { items: Recommendation[] } };
  return <Text>{apiResponse.data.items.map((r) => r.title).join(', ')}</Text>;
}
