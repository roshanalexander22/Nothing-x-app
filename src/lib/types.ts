export type AncMode = "noiseCancellation" | "transparency" | "off";

export type EqPreset =
  | "dirac"
  | "rock"
  | "electronic"
  | "pop"
  | "vocals"
  | "classical"
  | "custom";

export interface CustomEqBands {
  bass: number;
  mid: number;
  treble: number;
}

export interface UltraBassState {
  enabled: boolean;
  level: number;
}

export interface BatteryReading {
  level: number;
  charging: boolean;
}

export interface BatteryState {
  left: BatteryReading | null;
  right: BatteryReading | null;
  case: BatteryReading | null;
}

export interface DualDeviceEntry {
  mac: string;
  name: string;
  isSelf: boolean;
  isConnected: boolean;
}

export interface GestureMapping {
  device: number;
  button: number;
  gesture: number;
  action: number;
}

export interface DeviceStateSnapshot {
  connected: boolean;
  deviceName: string;
  customName: string | null;
  modelName: string;
  modelBase: string;
  modelId: string;
  colorway: string;
  bluetoothAddress: string;
  serialNumber: string;
  firmwareVersion: string;
  battery: BatteryState;
  ancMode: AncMode;
  ultraBass: UltraBassState;
  eqPreset: EqPreset;
  customEq: CustomEqBands;
  lowLagMode: boolean;
  dualConnectionEnabled: boolean;
  dualDevices: DualDeviceEntry[];
  gestures: GestureMapping[];
}

export interface PairedBluetoothDevice {
  address: string;
  name: string;
  connected: boolean;
  supportsControl: boolean;
}

export interface ProtocolLogEntry {
  timestampMs: number;
  direction: string;
  label: string;
  hex: string;
}

export type AppTheme = "dark" | "light";

export interface AppPreferences {
  customName: string | null;
  lastAddress: string | null;
  autoConnect: boolean;
  minimizeToTray: boolean;
  improvementProgramme: boolean;
  theme: AppTheme;
}

export type AppRoute =
  | "home"
  | "equaliser"
  | "controls"
  | "dualConnection"
  | "deviceSettings"
  | "aboutDevice"
  | "appInfo";

