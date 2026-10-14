import { ComponentType } from 'react';

import { wait } from '@/services/fakeServer';

// "Manifiesto" de remotes. En Module Federation real esto sería la config de `remotes`
// (o un manifest JSON servido por un backend para decidir en runtime qué versión cargar).

/** Lo que el shell promete a cada microfrontend: su "API pública". */
export type MfeProps = {
  user: string | null;
  /** Callback hacia arriba (patrón props down / events up). */
  onNavigate: (to: string) => void;
};

export type RemoteManifest = {
  name: string;
  team: string;
  version: string;
  /** Versión de React con la que se compiló; debe ser compatible con la del shell (singleton compartido). */
  requiresReact: string;
  /** Si es false, el slot arranca apagado y el usuario lo enciende con su switch. */
  enabledByDefault?: boolean;
  /** Simula descargar el remoteEntry.js por red y evaluarlo. */
  load: () => Promise<{ default: ComponentType<MfeProps> }>;
};

export const SHELL_REACT_VERSION = '19';

export const remotes: RemoteManifest[] = [
  {
    name: 'catalog',
    team: 'Equipo Catálogo',
    version: '2.3.0',
    requiresReact: '19',
    load: () => wait(700).then(() => import('./remotes/CatalogMfe')),
  },
  {
    name: 'cart',
    team: 'Equipo Checkout',
    version: '1.8.1',
    requiresReact: '19',
    load: () => wait(1200).then(() => import('./remotes/CartMfe')),
  },
  {
    name: 'recommendations',
    team: 'Equipo Growth',
    version: '0.9.0-beta',
    requiresReact: '19',
    // Remote con un bug en runtime: el Error Boundary del shell lo aísla.
    // Arranca apagado porque, en desarrollo, React Native muestra un overlay rojo por cada
    // error de render aunque un Error Boundary lo atrape.
    enabledByDefault: false,
    load: () => wait(900).then(() => import('./remotes/BrokenMfe')),
  },
  {
    name: 'legacy-profile',
    team: 'Equipo Cuentas',
    version: '4.0.0',
    // Compilado contra otra versión mayor de React → el shell se niega a cargarlo.
    requiresReact: '17',
    load: () => wait(500).then(() => import('./remotes/CartMfe')),
  },
];
