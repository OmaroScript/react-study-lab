import { Text, View } from 'react-native';

import { Button, colors } from '@/components/ui';
import { bus } from '../eventBus';
import type { MfeProps } from '../registry';

const PRODUCTS = [
  { id: 'p1', name: 'Teclado', price: 45 },
  { id: 'p2', name: 'Mouse', price: 20 },
  { id: 'p3', name: 'Monitor', price: 180 },
];

// El catálogo NO conoce al carrito: solo emite un evento del contrato.
export default function CatalogMfe({ user, onNavigate }: MfeProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.muted }}>Hola {user ?? 'invitado'} (dato recibido por props del shell)</Text>
      {PRODUCTS.map((p) => (
        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text>
            {p.name} · ${p.price}
          </Text>
          <Button title="Agregar" onPress={() => bus.emit('cart:item-added', p)} />
        </View>
      ))}
      <Button title="Ir al carrito (callback al shell)" variant="secondary" onPress={() => onNavigate('cart')} />
    </View>
  );
}
