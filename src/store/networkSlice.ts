import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './index';

type NetworkState = {
  /** Lo que reporta NetInfo (la conexión real del dispositivo). */
  isConnected: boolean;
  /** Interruptor manual para simular "modo avión" sin tocar el dispositivo. */
  forcedOffline: boolean;
};

const initialState: NetworkState = { isConnected: true, forcedOffline: false };

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    connectionChanged: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    forcedOfflineToggled: (state) => {
      state.forcedOffline = !state.forcedOffline;
    },
  },
});

export const { connectionChanged, forcedOfflineToggled } = networkSlice.actions;
export default networkSlice.reducer;

export const selectIsOnline = (state: RootState) =>
  state.network.isConnected && !state.network.forcedOffline;
