import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { B185_DEFAULT_GESTURES } from "./gestures";
import type {
  AncMode,
  AppPreferences,
  CustomEqBands,
  DeviceStateSnapshot,
  EqPreset,
  GestureMapping,
  PairedBluetoothDevice,
  ProtocolLogEntry,
} from "./types";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

export function createDemoSnapshot(): DeviceStateSnapshot {
  return {
    connected: true,
    deviceName: "Roshan's CMF Buds 2a",
    customName: "Roshan's CMF Buds 2a",
    modelName: "CMF Buds 2a",
    modelBase: "B185",
    modelId: "b185",
    colorway: "Dark Grey",
    bluetoothAddress: "2C:BE:EE:3A:BD:92",
    serialNumber: "SH10062603005976",
    firmwareVersion: "1.0.1.60",
    battery: {
      left: { level: 100, charging: false },
      right: { level: 100, charging: false },
      case: { level: 85, charging: false },
    },
    ancMode: "transparency",
    ultraBass: {
      enabled: false,
      level: 3,
    },
    eqPreset: "dirac",
    customEq: {
      bass: 0,
      mid: 0,
      treble: 0,
    },
    lowLagMode: false,
    dualConnectionEnabled: true,
    dualDevices: [
      {
        mac: "2C:BE:EE:3A:BD:01",
        name: "Roshan's Phone",
        isSelf: false,
        isConnected: true,
      },
      {
        mac: "E4:5F:01:88:91:AA",
        name: "Roshan's Windows PC",
        isSelf: true,
        isConnected: true,
      },
    ],
    gestures: [...B185_DEFAULT_GESTURES],
  };
}

export function createDisconnectedSnapshot(
  prefs?: Partial<AppPreferences>
): DeviceStateSnapshot {
  const customName = prefs?.customName ?? "Roshan's CMF Buds 2a";
  return {
    connected: false,
    deviceName: customName,
    customName,
    modelName: "CMF Buds 2a",
    modelBase: "B185",
    modelId: "b185",
    colorway: "Dark Grey",
    bluetoothAddress: prefs?.lastAddress ?? "2C:BE:EE:3A:BD:92",
    serialNumber: "SH10062603005976",
    firmwareVersion: "1.0.1.60",
    battery: { left: null, right: null, case: null },
    ancMode: "off",
    ultraBass: { enabled: false, level: 3 },
    eqPreset: "dirac",
    customEq: { bass: 0, mid: 0, treble: 0 },
    lowLagMode: false,
    dualConnectionEnabled: false,
    dualDevices: [],
    gestures: [...B185_DEFAULT_GESTURES],
  };
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  customName: "Roshan's CMF Buds 2a",
  lastAddress: "2C:BE:EE:3A:BD:92",
  autoConnect: true,
  minimizeToTray: false,
  improvementProgramme: false,
  theme: "dark",
};

export const ipc = {
  scanBluetoothDevices(): Promise<PairedBluetoothDevice[]> {
    return invoke("scan_bluetooth_devices");
  },

  connectDevice(address: string | null): Promise<DeviceStateSnapshot> {
    return invoke("connect_device", { address });
  },

  disconnectDevice(): Promise<DeviceStateSnapshot> {
    return invoke("disconnect_device");
  },

  getDeviceState(): Promise<DeviceStateSnapshot> {
    return invoke("get_device_state");
  },

  refreshDeviceState(): Promise<void> {
    return invoke("refresh_device_state");
  },

  setAncMode(mode: AncMode): Promise<void> {
    return invoke("set_anc_mode", { mode });
  },

  setUltraBass(enabled: boolean, level: number): Promise<void> {
    return invoke("set_ultra_bass", { enabled, level });
  },

  setEqPreset(preset: EqPreset): Promise<void> {
    return invoke("set_eq_preset", { preset });
  },

  setCustomEq(bands: CustomEqBands): Promise<void> {
    return invoke("set_custom_eq", { bands });
  },

  setLowLagMode(enabled: boolean): Promise<void> {
    return invoke("set_low_lag_mode", { enabled });
  },

  setGesture(mapping: GestureMapping): Promise<void> {
    return invoke("set_gesture", { mapping });
  },

  resetGestures(): Promise<void> {
    return invoke("reset_gestures");
  },

  setDualConnection(enabled: boolean): Promise<void> {
    return invoke("set_dual_connection", { enabled });
  },

  setDualDeviceLink(mac: string, connect: boolean): Promise<void> {
    return invoke("set_dual_device_link", { mac, connect });
  },

  refreshDualDevices(): Promise<void> {
    return invoke("refresh_dual_devices");
  },

  ringBud(left: boolean, enable: boolean): Promise<void> {
    return invoke("ring_bud", { left, enable });
  },

  getProtocolLogs(): Promise<ProtocolLogEntry[]> {
    return invoke("get_protocol_logs");
  },

  clearProtocolLogs(): Promise<void> {
    return invoke("clear_protocol_logs");
  },

  getPreferences(): Promise<AppPreferences> {
    return invoke("get_preferences");
  },

  updatePreferences(prefs: AppPreferences): Promise<AppPreferences> {
    return invoke("update_preferences", { prefs });
  },

  async subscribeEvents(handlers: {
    onDeviceState: (snapshot: DeviceStateSnapshot) => void;
    onProtocolLog: (entry: ProtocolLogEntry) => void;
    onBluetoothError: (message: string) => void;
  }): Promise<() => void> {
    const unlisteners: UnlistenFn[] = await Promise.all([
      listen<DeviceStateSnapshot>("device-state", (e) =>
        handlers.onDeviceState(e.payload)
      ),
      listen<ProtocolLogEntry>("protocol-log", (e) =>
        handlers.onProtocolLog(e.payload)
      ),
      listen<string>("bluetooth-error", (e) =>
        handlers.onBluetoothError(e.payload)
      ),
    ]);

    return () => {
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  },
};

