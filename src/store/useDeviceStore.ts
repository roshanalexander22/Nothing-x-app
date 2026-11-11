import { create } from "zustand";
import { B185_DEFAULT_GESTURES } from "../lib/gestures";
import {
  DEFAULT_PREFERENCES,
  createDemoSnapshot,
  createDisconnectedSnapshot,
  ipc,
  isTauriRuntime,
} from "../lib/tauri";
import type {
  AncMode,
  AppPreferences,
  AppRoute,
  CustomEqBands,
  DeviceStateSnapshot,
  EqPreset,
  GestureMapping,
  PairedBluetoothDevice,
  ProtocolLogEntry,
} from "../lib/types";

const MAX_LOG_ENTRIES = 250;

function makeDemoLog(label: string, hex: string): ProtocolLogEntry {
  return {
    timestampMs: Date.now(),
    direction: "DEMO",
    label,
    hex,
  };
}

interface DeviceStore {
  route: AppRoute;
  ultraBassSheetOpen: boolean;
  addDeviceModalOpen: boolean;
  demoMode: boolean;
  connecting: boolean;
  scanning: boolean;
  errorBanner: string | null;
  statusToast: string | null;
  pairedDevices: PairedBluetoothDevice[];
  device: DeviceStateSnapshot;
  preferences: AppPreferences;
  logs: ProtocolLogEntry[];
  ringingLeft: boolean;
  ringingRight: boolean;

  setRoute: (route: AppRoute) => void;
  setUltraBassSheetOpen: (open: boolean) => void;
  setAddDeviceModalOpen: (open: boolean) => void;
  clearError: () => void;
  showToast: (msg: string) => void;

  initialize: () => Promise<() => void>;
  enterDemoMode: () => void;
  exitDemoMode: () => Promise<void>;
  scanDevices: () => Promise<void>;
  connectToDevice: (address: string | null) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  refreshState: () => Promise<void>;

  setAncMode: (mode: AncMode) => Promise<void>;
  setUltraBass: (enabled: boolean, level: number) => Promise<void>;
  setEqPreset: (preset: EqPreset) => Promise<void>;
  setCustomEq: (bands: CustomEqBands) => Promise<void>;
  setLowLagMode: (enabled: boolean) => Promise<void>;
  setGesture: (mapping: GestureMapping) => Promise<void>;
  resetGestures: () => Promise<void>;
  setDualConnection: (enabled: boolean) => Promise<void>;
  setDualDeviceLink: (mac: string, connect: boolean) => Promise<void>;
  refreshDualDevices: () => Promise<void>;
  toggleRingBud: (left: boolean) => Promise<void>;
  updatePreferences: (patch: Partial<AppPreferences>) => Promise<void>;
  clearLogs: () => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useDeviceStore = create<DeviceStore>((set, get) => {
  const pushDemoLog = (label: string, hex: string) => {
    set((state) => ({
      logs: [makeDemoLog(label, hex), ...state.logs].slice(0, MAX_LOG_ENTRIES),
    }));
  };

  const handleBackendError = (err: unknown, fallbackMessage: string) => {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : fallbackMessage;
    set({ errorBanner: message });
  };

  return {
    route: "home",
    ultraBassSheetOpen: false,
    addDeviceModalOpen: false,
    demoMode: !isTauriRuntime(),
    connecting: false,
    scanning: false,
    errorBanner: null,
    statusToast: null,
    pairedDevices: isTauriRuntime()
      ? []
      : [
          {
            address: "2C:BE:EE:3A:BD:92",
            name: "CMF Buds 2a",
            connected: true,
            supportsControl: true,
          },
        ],
    device: isTauriRuntime()
      ? createDisconnectedSnapshot(DEFAULT_PREFERENCES)
      : createDemoSnapshot(),
    preferences: { ...DEFAULT_PREFERENCES },
    logs: [],
    ringingLeft: false,
    ringingRight: false,

    setRoute: (route) => set({ route }),
    setUltraBassSheetOpen: (ultraBassSheetOpen) => set({ ultraBassSheetOpen }),
    setAddDeviceModalOpen: (addDeviceModalOpen) => set({ addDeviceModalOpen }),
    clearError: () => set({ errorBanner: null }),

    showToast: (msg) => {
      if (toastTimer) clearTimeout(toastTimer);
      set({ statusToast: msg });
      toastTimer = setTimeout(() => {
        set({ statusToast: null });
      }, 2600);
    },

    initialize: async () => {
      if (!isTauriRuntime()) {
        set({
          demoMode: true,
          device: createDemoSnapshot(),
          logs: [
            makeDemoLog(
              "Demo Session Ready (B185 · CMF Buds 2a)",
              "55 60 01 C0 42 00 00 01 ..."
            ),
          ],
        });
        return () => {};
      }

      const cleanupEvents = await ipc.subscribeEvents({
        onDeviceState: (snapshot) => {
          set((state) => ({
            device: snapshot,
            demoMode: snapshot.connected ? false : state.demoMode,
            errorBanner: snapshot.connected ? null : state.errorBanner,
          }));
        },
        onProtocolLog: (entry) => {
          set((state) => ({
            logs: [entry, ...state.logs].slice(0, MAX_LOG_ENTRIES),
          }));
        },
        onBluetoothError: (message) => {
          set({ errorBanner: message, connecting: false });
        },
      });

      try {
        const [snapshot, prefs, existingLogs, devices] = await Promise.all([
          ipc.getDeviceState(),
          ipc.getPreferences(),
          ipc.getProtocolLogs(),
          ipc.scanBluetoothDevices().catch(() => [] as PairedBluetoothDevice[]),
        ]);

        set({
          device: snapshot,
          preferences: prefs,
          logs: existingLogs.slice().reverse().slice(0, MAX_LOG_ENTRIES),
          pairedDevices: devices,
          demoMode: false,
        });

        if (!snapshot.connected && prefs.autoConnect) {
          const candidate =
            devices.find((d) => d.connected && d.supportsControl) ??
            devices.find((d) => d.address === prefs.lastAddress) ??
            devices.find((d) => d.supportsControl);

          if (candidate) {
            void get().connectToDevice(candidate.address);
          }
        }
      } catch (err) {
        handleBackendError(err, "Failed to initialize Bluetooth backend");
      }

      return cleanupEvents;
    },

    enterDemoMode: () => {
      const { preferences } = get();
      const demo = createDemoSnapshot();
      const displayName = preferences.customName || "Roshan's CMF Buds 2a";
      set({
        demoMode: true,
        addDeviceModalOpen: false,
        errorBanner: null,
        device: {
          ...demo,
          customName: displayName,
          deviceName: displayName,
        },
      });
      pushDemoLog(
        "Demo Preview Mode Enabled",
        "55 60 01 40 07 00 00 00 ..."
      );
      get().showToast("Previewing UI in Demo Mode");
    },

    exitDemoMode: async () => {
      if (!isTauriRuntime()) return;
      set({ demoMode: false, ringingLeft: false, ringingRight: false });
      try {
        const snapshot = await ipc.getDeviceState();
        set({ device: snapshot });
      } catch {
        set({ device: createDisconnectedSnapshot(get().preferences) });
      }
    },

    scanDevices: async () => {
      if (!isTauriRuntime()) {
        set({
          pairedDevices: [
            {
              address: "2C:BE:EE:3A:BD:92",
              name: "CMF Buds 2a",
              connected: true,
              supportsControl: true,
            },
          ],
        });
        return;
      }

      set({ scanning: true, errorBanner: null });
      try {
        const devices = await ipc.scanBluetoothDevices();
        set({ pairedDevices: devices, scanning: false });
      } catch (err) {
        set({ scanning: false });
        handleBackendError(err, "Failed to enumerate paired Bluetooth devices");
      }
    },

    connectToDevice: async (address) => {
      if (!isTauriRuntime()) {
        get().enterDemoMode();
        return;
      }

      set({ connecting: true, errorBanner: null, demoMode: false });
      try {
        const snapshot = await ipc.connectDevice(address);
        set({
          device: snapshot,
          connecting: false,
          addDeviceModalOpen: false,
          demoMode: false,
        });
        get().showToast(`Connected to ${snapshot.deviceName}`);
      } catch (err) {
        set({ connecting: false });
        handleBackendError(
          err,
          "Could not open RFCOMM channel to CMF Buds 2a"
        );
      }
    },

    disconnectDevice: async () => {
      set({ ringingLeft: false, ringingRight: false });
      if (get().demoMode || !isTauriRuntime()) {
        set({
          demoMode: false,
          device: createDisconnectedSnapshot(get().preferences),
        });
        get().showToast("Disconnected");
        return;
      }

      try {
        const snapshot = await ipc.disconnectDevice();
        set({ device: snapshot });
        get().showToast("Disconnected from earbuds");
      } catch (err) {
        handleBackendError(err, "Failed to disconnect");
      }
    },

    refreshState: async () => {
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog("Refresh State (Demo)", "55 60 01 C0 07 00 00 02");
        get().showToast("State refreshed");
        return;
      }
      try {
        await ipc.refreshDeviceState();
      } catch (err) {
        handleBackendError(err, "Failed to refresh device state");
      }
    },

    setAncMode: async (mode) => {
      const prev = get().device.ancMode;
      set((state) => ({ device: { ...state.device, ancMode: mode } }));
      if (get().demoMode || !isTauriRuntime()) {
        const code =
          mode === "noiseCancellation" ? "01" : mode === "transparency" ? "07" : "05";
        pushDemoLog(`Set ANC -> ${mode}`, `55 60 01 F0 0F 03 00 01 ${code} 00`);
        return;
      }
      try {
        await ipc.setAncMode(mode);
      } catch (err) {
        set((state) => ({ device: { ...state.device, ancMode: prev } }));
        handleBackendError(err, "Failed to update Noise Cancellation mode");
      }
    },

    setUltraBass: async (enabled, level) => {
      const clampedLevel = Math.max(1, Math.min(5, Math.round(level)));
      const prev = get().device.ultraBass;
      set((state) => ({
        device: {
          ...state.device,
          ultraBass: { enabled, level: clampedLevel },
        },
      }));
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(
          `Set Ultra Bass -> ${enabled ? `Lv.${clampedLevel}` : "Off"}`,
          `55 60 01 F0 51 02 00 0${enabled ? 1 : 0} 0${(clampedLevel * 2).toString(16).toUpperCase()}`
        );
        return;
      }
      try {
        await ipc.setUltraBass(enabled, clampedLevel);
      } catch (err) {
        set((state) => ({ device: { ...state.device, ultraBass: prev } }));
        handleBackendError(err, "Failed to update Ultra Bass");
      }
    },

    setEqPreset: async (preset) => {
      const prev = get().device.eqPreset;
      set((state) => ({ device: { ...state.device, eqPreset: preset } }));
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(`Set EQ Preset -> ${preset}`, "55 60 01 F0 10 02 00 ...");
        return;
      }
      try {
        await ipc.setEqPreset(preset);
      } catch (err) {
        set((state) => ({ device: { ...state.device, eqPreset: prev } }));
        handleBackendError(err, "Failed to apply EQ preset");
      }
    },

    setCustomEq: async (bands) => {
      const normalized: CustomEqBands = {
        bass: Math.max(-6, Math.min(6, Math.round(bands.bass))),
        mid: Math.max(-6, Math.min(6, Math.round(bands.mid))),
        treble: Math.max(-6, Math.min(6, Math.round(bands.treble))),
      };
      const prevPreset = get().device.eqPreset;
      const prevEq = get().device.customEq;
      set((state) => ({
        device: {
          ...state.device,
          eqPreset: "custom",
          customEq: normalized,
        },
      }));
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(
          `Set Custom EQ (${normalized.bass}/${normalized.mid}/${normalized.treble})`,
          "55 60 01 F0 44 2A 00 ..."
        );
        return;
      }
      try {
        await ipc.setCustomEq(normalized);
      } catch (err) {
        set((state) => ({
          device: { ...state.device, eqPreset: prevPreset, customEq: prevEq },
        }));
        handleBackendError(err, "Failed to write Custom EQ curves");
      }
    },

    setLowLagMode: async (enabled) => {
      const prev = get().device.lowLagMode;
      set((state) => ({ device: { ...state.device, lowLagMode: enabled } }));
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(
          `Set Low Lag Mode -> ${enabled ? "On" : "Off"}`,
          `55 60 01 F0 40 02 00 0${enabled ? 1 : 2} 00`
        );
        return;
      }
      try {
        await ipc.setLowLagMode(enabled);
      } catch (err) {
        set((state) => ({ device: { ...state.device, lowLagMode: prev } }));
        handleBackendError(err, "Failed to update Low Lag Mode");
      }
    },

    setGesture: async (mapping) => {
      const prev = get().device.gestures;
      set((state) => {
        const filtered = state.device.gestures.filter(
          (g) => !(g.device === mapping.device && g.gesture === mapping.gesture)
        );
        return {
          device: { ...state.device, gestures: [...filtered, mapping] },
        };
      });
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(
          `Set Gesture d=${mapping.device} g=${mapping.gesture} -> a=${mapping.action}`,
          "55 60 01 F0 03 05 00 ..."
        );
        return;
      }
      try {
        await ipc.setGesture(mapping);
      } catch (err) {
        set((state) => ({ device: { ...state.device, gestures: prev } }));
        handleBackendError(err, "Failed to update gesture mapping");
      }
    },

    resetGestures: async () => {
      const prev = get().device.gestures;
      set((state) => ({
        device: { ...state.device, gestures: [...B185_DEFAULT_GESTURES] },
      }));
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog("Reset Gestures to B185 Default", "55 60 01 F0 03 ...");
        get().showToast("Controls reset to default");
        return;
      }
      try {
        await ipc.resetGestures();
        get().showToast("Controls reset to default");
      } catch (err) {
        set((state) => ({ device: { ...state.device, gestures: prev } }));
        handleBackendError(err, "Failed to reset controls");
      }
    },

    setDualConnection: async (enabled) => {
      const prev = get().device.dualConnectionEnabled;
      set((state) => ({
        device: { ...state.device, dualConnectionEnabled: enabled },
      }));
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(
          `Set Dual Connection -> ${enabled ? "On" : "Off"}`,
          `55 60 01 F0 2E 01 00 0${enabled ? 1 : 0}`
        );
        return;
      }
      try {
        await ipc.setDualConnection(enabled);
      } catch (err) {
        set((state) => ({
          device: { ...state.device, dualConnectionEnabled: prev },
        }));
        handleBackendError(err, "Failed to toggle Dual Connection");
      }
    },

    setDualDeviceLink: async (mac, connect) => {
      const prev = get().device.dualDevices;
      set((state) => ({
        device: {
          ...state.device,
          dualDevices: state.device.dualDevices.map((d) =>
            d.mac === mac ? { ...d, isConnected: connect } : d
          ),
        },
      }));
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(
          `${connect ? "Connect" : "Disconnect"} Dual Device ${mac}`,
          "55 60 01 F0 29 07 00 ..."
        );
        return;
      }
      try {
        await ipc.setDualDeviceLink(mac, connect);
      } catch (err) {
        set((state) => ({ device: { ...state.device, dualDevices: prev } }));
        handleBackendError(err, "Failed to update paired device connection");
      }
    },

    refreshDualDevices: async () => {
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog("Query Dual Devices (Demo)", "55 60 01 C0 2B 00 00");
        return;
      }
      try {
        await ipc.refreshDualDevices();
      } catch (err) {
        handleBackendError(err, "Failed to query dual connection list");
      }
    },

    toggleRingBud: async (left) => {
      const current = left ? get().ringingLeft : get().ringingRight;
      const enable = !current;
      set(left ? { ringingLeft: enable } : { ringingRight: enable });
      if (get().demoMode || !isTauriRuntime()) {
        pushDemoLog(
          `${enable ? "Start" : "Stop"} Ring ${left ? "Left" : "Right"} Bud`,
          `55 60 01 F0 02 02 00 0${left ? 2 : 3} 0${enable ? 1 : 0}`
        );
        return;
      }
      try {
        await ipc.ringBud(left, enable);
      } catch (err) {
        set(left ? { ringingLeft: current } : { ringingRight: current });
        handleBackendError(err, "Failed to trigger Find My Earbuds ring");
      }
    },

    updatePreferences: async (patch) => {
      const next: AppPreferences = { ...get().preferences, ...patch };
      set((state) => ({
        preferences: next,
        device:
          patch.customName !== undefined
            ? {
                ...state.device,
                customName: patch.customName,
                deviceName: patch.customName || state.device.modelName,
              }
            : state.device,
      }));
      if (!isTauriRuntime()) {
        return;
      }
      try {
        const saved = await ipc.updatePreferences(next);
        set({ preferences: saved });
      } catch (err) {
        handleBackendError(err, "Failed to save preferences");
      }
    },

    clearLogs: async () => {
      set({ logs: [] });
      if (!isTauriRuntime()) return;
      try {
        await ipc.clearProtocolLogs();
      } catch (err) {
        handleBackendError(err, "Failed to clear protocol logs");
      }
    },
  };
});

