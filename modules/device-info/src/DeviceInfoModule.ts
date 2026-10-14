import { NativeModule, requireOptionalNativeModule } from 'expo';

import { DeviceInfoModuleEvents, DeviceSummary } from './DeviceInfo.types';

declare class DeviceInfoModule extends NativeModule<DeviceInfoModuleEvents> {
  platform: string;
  getDeviceSummary(): DeviceSummary;
  getBatteryLevelAsync(): Promise<number>;
  pingAsync(message: string): Promise<void>;
}

// "Optional" devuelve null en lugar de lanzar un error si el binario no incluye el módulo
// (por ejemplo, en Expo Go). Así la app puede mostrar un fallback en vez de crashear.
export default requireOptionalNativeModule<DeviceInfoModule>('DeviceInfo');
