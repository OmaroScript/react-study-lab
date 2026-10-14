// Re-export the native module. On web, it will be resolved to DeviceInfoModule.web.ts
// and on native platforms to DeviceInfoModule.ts
export { default } from './src/DeviceInfoModule';
export * from './src/DeviceInfo.types';
