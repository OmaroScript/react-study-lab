export type PingEventPayload = {
  message: string;
  receivedAt: number;
};

export type DeviceInfoModuleEvents = {
  onPing: (params: PingEventPayload) => void;
};

export type DeviceSummary = {
  model: string;
  systemName: string;
  systemVersion: string;
};
