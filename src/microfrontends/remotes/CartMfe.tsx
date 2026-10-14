import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, colors } from '@/components/ui';
import { bus, MfeEvents } from '../eventBus';
import type { MfeProps } from '../registry';

type Item = MfeEvents['cart:item-added'];

// El carrito es dueño de SU estado. Otros MFEs solo lo afectan vía eventos.
export default function CartMfe({ user }: MfeProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => bus.on('cart:item-added', (item) => setItems((prev) => [...prev, item])), []);

  // Publica un resumen para quien le interese (el shell muestra un badge).
  useEffect(() => {
    bus.emit('cart:count-changed', {
      count: items.length,
      total: items.reduce((sum, i) => sum + i.price, 0),
    });
  }, [items]);

  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <View style={{ gap: 6 }}>
      {items.length === 0 ? (
        <Text style={{ color: colors.muted }}>Carrito vacío. Agrega algo desde el catálogo.</Text>
      ) : (
        items.map((item, i) => <Text key={i}>• {item.name} · ${item.price}</Text>)
      )}
      <Text style={{ fontWeight: '700' }}>Total: ${total}</Text>
      <Button
        title={user ? 'Pagar' : 'Inicia sesión para pagar'}
        disabled={!user || items.length === 0}
        onPress={() => setItems([])}
      />
    </View>
  );
}
