import type { EqPreset, GestureMapping } from "./types";

export const DEVICE_LEFT = 2;
export const DEVICE_RIGHT = 3;
export const DEFAULT_BUTTON = 1;

export interface GestureSlotMeta {
  gesture: number;
  label: string;
  description: string;
  defaultAction: number;
  allowedActions: number[];
}

export interface ActionMeta {
  code: number;
  label: string;
  shortLabel?: string;
}

export const ACTION_CATALOG: Record<number, ActionMeta> = {
  1: { code: 1, label: "No action" },
  2: { code: 2, label: "Play / Pause" },
  8: { code: 8, label: "Skip back" },
  9: { code: 9, label: "Skip forward" },
  10: { code: 10, label: "Noise Control: All 3 modes", shortLabel: "Noise Control (All)" },
  11: { code: 11, label: "Voice Assistant" },
  18: { code: 18, label: "Volume up" },
  19: { code: 19, label: "Volume down" },
  20: { code: 20, label: "Noise Control: NC / Off", shortLabel: "NC / Off" },
  21: { code: 21, label: "Noise Control: Transparency / Off", shortLabel: "Transparency / Off" },
  22: { code: 22, label: "Noise Control: NC / Transparency", shortLabel: "NC / Transparency" },
  31: { code: 31, label: "Essential News" },
};

export const B185_GESTURE_SLOTS: GestureSlotMeta[] = [
  {
    gesture: 2,
    label: "Double tap",
    description: "Tap the touch area twice quickly",
    defaultAction: 9,
    allowedActions: [1, 2, 8, 9, 11],
  },
  {
    gesture: 3,
    label: "Triple tap",
    description: "Tap the touch area three times quickly",
    defaultAction: 8,
    allowedActions: [1, 2, 8, 9, 11],
  },
  {
    gesture: 7,
    label: "Tap and hold",
    description: "Press and hold for 1 second",
    defaultAction: 22,
    allowedActions: [1, 10, 22, 20, 21, 11],
  },
  {
    gesture: 9,
    label: "Double tap and hold",
    description: "Tap once, then press and hold",
    defaultAction: 1,
    allowedActions: [1, 18, 19, 11, 31],
  },
];

export const B185_DEFAULT_GESTURES: GestureMapping[] = [
  { device: DEVICE_LEFT, button: DEFAULT_BUTTON, gesture: 2, action: 9 },
  { device: DEVICE_LEFT, button: DEFAULT_BUTTON, gesture: 3, action: 8 },
  { device: DEVICE_LEFT, button: DEFAULT_BUTTON, gesture: 7, action: 22 },
  { device: DEVICE_LEFT, button: DEFAULT_BUTTON, gesture: 9, action: 1 },
  { device: DEVICE_RIGHT, button: DEFAULT_BUTTON, gesture: 2, action: 9 },
  { device: DEVICE_RIGHT, button: DEFAULT_BUTTON, gesture: 3, action: 8 },
  { device: DEVICE_RIGHT, button: DEFAULT_BUTTON, gesture: 7, action: 22 },
  { device: DEVICE_RIGHT, button: DEFAULT_BUTTON, gesture: 9, action: 1 },
];

export function isDefaultGestureSet(gestures: GestureMapping[]): boolean {
  if (gestures.length === 0) return true;
  return B185_DEFAULT_GESTURES.every((def) => {
    const found = gestures.find(
      (g) => g.device === def.device && g.gesture === def.gesture
    );
    return !found || found.action === def.action;
  });
}

export function getActionLabel(action: number): string {
  return ACTION_CATALOG[action]?.shortLabel ?? ACTION_CATALOG[action]?.label ?? `Action #${action}`;
}

export interface EqPresetOption {
  id: EqPreset;
  label: string;
  subtitle: string;
  curve: [number, number, number];
}

export const EQ_PRESETS: EqPresetOption[] = [
  {
    id: "dirac",
    label: "Dirac",
    subtitle: "Default acoustic tuning by Dirac Opteo",
    curve: [1, 0, 1],
  },
  {
    id: "rock",
    label: "Rock",
    subtitle: "Punchy drums & electric guitar presence",
    curve: [3, 1, 3],
  },
  {
    id: "electronic",
    label: "Electronic",
    subtitle: "Deep sub-bass & crisp synthetic highs",
    curve: [4, -1, 3],
  },
  {
    id: "pop",
    label: "Pop",
    subtitle: "Balanced warmth with lifted clarity",
    curve: [2, 2, 1],
  },
  {
    id: "vocals",
    label: "Enhance vocals",
    subtitle: "Clear mid-range voices & dialogue",
    curve: [-2, 4, 2],
  },
  {
    id: "classical",
    label: "Classical",
    subtitle: "Natural concert hall dynamics",
    curve: [0, 1, 2],
  },
  {
    id: "custom",
    label: "Custom",
    subtitle: "3-band Bass, Mid & Treble control",
    curve: [0, 0, 0],
  },
];

export function getEqPresetLabel(preset: EqPreset): string {
  return EQ_PRESETS.find((item) => item.id === preset)?.label ?? "Dirac";
}

