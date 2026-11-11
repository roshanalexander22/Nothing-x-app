import React from "react";
import {
  EQ_PRESETS,
  getEqPresetLabel,
  isDefaultGestureSet,
} from "../../lib/gestures";
import { useDeviceStore } from "../../store/useDeviceStore";
import {
  ChevronDotsIcon,
  ControlsIcon,
  DeviceSettingsIcon,
  DualConnectionIcon,
  EqualiserIcon,
  InfoCircleIcon,
} from "../icons/NothingIcons";
import { ToggleSwitch } from "./ToggleSwitch";

function mapMiniDbToY(db: number): number {
  return 22 - db * 2.2;
}

function buildMiniEqPath(bass: number, mid: number, treble: number): string {
  const y0 = 22;
  const y1 = mapMiniDbToY(bass);
  const y2 = mapMiniDbToY(mid);
  const y3 = mapMiniDbToY(treble);
  const y4 = 22;
  return `M 4 ${y0} C 18 ${y1}, 28 ${y1}, 36 ${y1} C 48 ${y1}, 54 ${y2}, 66 ${y2} C 78 ${y2}, 84 ${y3}, 96 ${y3} C 106 ${y3}, 114 ${y4}, 122 ${y4}`;
}

export const FeatureGrid: React.FC = () => {
  const {
    device,
    demoMode,
    setRoute,
    setUltraBass,
    setUltraBassSheetOpen,
    setLowLagMode,
  } = useDeviceStore();

  const interactive = device.connected || demoMode;
  const controlsSubtitle = isDefaultGestureSet(device.gestures)
    ? "Default"
    : "Customised";

  const activeEqMeta =
    EQ_PRESETS.find((p) => p.id === device.eqPreset) ?? EQ_PRESETS[0];
  const [miniBass, miniMid, miniTreble] =
    device.eqPreset === "custom"
      ? [device.customEq.bass, device.customEq.mid, device.customEq.treble]
      : activeEqMeta.curve;
  const miniEqPath = buildMiniEqPath(miniBass, miniMid, miniTreble);

  const connectedDualCount = device.dualDevices.filter(
    (d) => d.isConnected
  ).length;

  return (
    <section className="min-w-0 grid grid-cols-2 md:grid-rows-4 md:h-full xl:grid-cols-6 xl:grid-rows-3 gap-3 sm:gap-3.5 xl:gap-4">
      {/* Row 1 Left: Ultra Bass */}
      <div
        data-flip-id="ultra-bass"
        role="button"
        tabIndex={0}
        onClick={() => interactive && setUltraBassSheetOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && interactive) setUltraBassSheetOpen(true);
        }}
        className={`min-w-0 col-span-1 xl:col-span-3 bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] rounded-[22px] xl:rounded-[26px] p-4 xl:p-6 min-h-[120px] xl:min-h-[144px] h-full flex flex-col justify-between transition-[background-color,transform] duration-150 ease-out ${
          interactive ? "cursor-pointer active:scale-[0.985]" : "opacity-60 cursor-not-allowed"
        }`}
      >
        <div className="flex items-start justify-between gap-2 xl:gap-3 min-w-0">
          <div className="min-w-0">
            <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-tight truncate">
              Ultra Bass
            </h3>
            <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-1 truncate">
              {device.ultraBass.enabled
                ? `Level ${device.ultraBass.level} / 5`
                : "Off"}
            </p>
          </div>
          <span className="hidden xl:inline-flex shrink-0 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-text-soft)]">
            {device.ultraBass.enabled ? "ACTIVE" : "BASS"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 xl:pt-4">
          <ToggleSwitch
            checked={device.ultraBass.enabled}
            disabled={!interactive}
            stopPropagation
            label="Toggle Ultra Bass"
            onChange={(next) =>
              void setUltraBass(next, device.ultraBass.level || 3)
            }
          />

          <div
            className="flex items-end gap-[5px] xl:gap-[6px]"
            aria-label={`Ultra Bass level ${device.ultraBass.level}`}
          >
            {[1, 2, 3, 4, 5].map((tick) => {
              const active =
                device.ultraBass.enabled && tick <= device.ultraBass.level;
              return (
                <button
                  key={tick}
                  type="button"
                  disabled={!interactive}
                  title={`Set Ultra Bass Level ${tick}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (interactive) void setUltraBass(true, tick);
                  }}
                  style={{
                    backgroundColor: active
                      ? "var(--nx-text)"
                      : "var(--nx-track)",
                    height: `${10 + tick * 2.5}px`,
                  }}
                  className="w-[3px] rounded-full transition-colors cursor-pointer hover:opacity-80 disabled:cursor-not-allowed"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 1 Right: Equaliser */}
      <button
        data-flip-id="equaliser"
        type="button"
        disabled={!interactive}
        onClick={() => setRoute("equaliser")}
        className="min-w-0 col-span-1 xl:col-span-3 bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] disabled:opacity-60 rounded-[22px] xl:rounded-[26px] p-4 xl:p-6 min-h-[120px] xl:min-h-[144px] h-full flex flex-col justify-between text-left transition-[background-color,transform] duration-150 ease-out active:enabled:scale-[0.985] cursor-pointer disabled:cursor-not-allowed"
      >
        <div className="flex items-start justify-between gap-2 xl:gap-3 w-full min-w-0">
          <div className="min-w-0">
            <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-tight truncate">
              Equaliser
            </h3>
            <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-1 truncate">
              {getEqPresetLabel(device.eqPreset)}
            </p>
          </div>
          <span className="hidden xl:inline-flex shrink-0 items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-text-soft)]">
            EQ Profile
            <ChevronDotsIcon className="w-3 h-3 text-[var(--nx-muted)]" />
          </span>
        </div>

        <div className="flex items-end justify-between gap-4 pt-3 w-full">
          <div className="text-[var(--nx-text)] shrink-0">
            <EqualiserIcon className="w-6 h-6 xl:w-8 xl:h-8" />
          </div>

          <svg
            viewBox="0 0 126 44"
            className="hidden xl:block w-48 h-12 opacity-90 shrink-0"
            aria-hidden="true"
          >
            <line
              x1="4"
              y1="22"
              x2="122"
              y2="22"
              stroke="var(--nx-track)"
              strokeDasharray="2 3"
              strokeWidth="1"
            />
            <path
              d={miniEqPath}
              fill="none"
              stroke="var(--nx-text)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="36" cy={mapMiniDbToY(miniBass)} r="2.5" fill="#D71921" />
          </svg>
        </div>
      </button>

      {/* Row 2 Left: Controls */}
      <button
        data-flip-id="controls"
        type="button"
        disabled={!interactive}
        onClick={() => setRoute("controls")}
        className="min-w-0 col-span-1 xl:col-span-2 bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] disabled:opacity-60 rounded-[22px] xl:rounded-[26px] p-4 xl:p-6 min-h-[120px] xl:min-h-[144px] h-full flex flex-col justify-between text-left transition-[background-color,transform] duration-150 ease-out active:enabled:scale-[0.985] cursor-pointer disabled:cursor-not-allowed"
      >
        <div className="flex items-start justify-between gap-2 w-full min-w-0">
          <div className="min-w-0">
            <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-tight truncate">
              Controls
            </h3>
            <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-1 truncate">
              {controlsSubtitle}
            </p>
          </div>
          <span className="hidden xl:inline-flex shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-muted)]">
            L · R
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 w-full text-[var(--nx-text)]">
          <ControlsIcon className="w-6 h-6 xl:w-8 xl:h-8" />
          <ChevronDotsIcon className="hidden xl:block w-4 h-4 text-[var(--nx-muted)]" />
        </div>
      </button>

      {/* Row 2 Center: Low Lag Mode */}
      <div
        data-flip-id="low-lag"
        role="button"
        tabIndex={0}
        onClick={() => interactive && void setLowLagMode(!device.lowLagMode)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && interactive)
            void setLowLagMode(!device.lowLagMode);
        }}
        className={`min-w-0 col-span-1 xl:col-span-2 bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] rounded-[22px] xl:rounded-[26px] p-4 xl:p-6 min-h-[120px] xl:min-h-[144px] h-full flex flex-col justify-between transition-[background-color,transform] duration-150 ease-out ${
          interactive ? "cursor-pointer active:scale-[0.985]" : "opacity-60 cursor-not-allowed"
        }`}
      >
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-tight truncate">
              Low Lag Mode
            </h3>
            <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-1 truncate">
              {device.lowLagMode ? "On · Low latency" : "Off"}
            </p>
          </div>
          <span className="hidden xl:inline-flex shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-muted)]">
            SYNC
          </span>
        </div>

        <div className="pt-3 xl:pt-4">
          <ToggleSwitch
            checked={device.lowLagMode}
            disabled={!interactive}
            stopPropagation
            label="Toggle Low Lag Mode"
            onChange={(next) => void setLowLagMode(next)}
          />
        </div>
      </div>

      {/* Row 2 Right / Row 3 Left: Dual Connection */}
      <button
        data-flip-id="dual-connection"
        type="button"
        disabled={!interactive}
        onClick={() => setRoute("dualConnection")}
        className="min-w-0 col-span-1 xl:col-span-2 bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] disabled:opacity-60 rounded-[22px] xl:rounded-[26px] p-4 xl:p-6 min-h-[120px] xl:min-h-[144px] h-full flex flex-col justify-between text-left transition-[background-color,transform] duration-150 ease-out active:enabled:scale-[0.985] cursor-pointer disabled:cursor-not-allowed"
      >
        <div className="flex items-start justify-between gap-2 w-full min-w-0">
          <div className="min-w-0">
            <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-tight truncate">
              Dual Connection
            </h3>
            <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-1 truncate">
              {device.dualConnectionEnabled
                ? connectedDualCount > 0
                  ? `On · ${connectedDualCount} linked`
                  : "On"
                : "Off"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 w-full text-[var(--nx-text)]">
          <DualConnectionIcon className="w-6 h-6 xl:w-8 xl:h-8" />
          <ChevronDotsIcon className="hidden xl:block w-4 h-4 text-[var(--nx-muted)]" />
        </div>
      </button>

      {/* Row 3 Right / Left: Device Settings */}
      <button
        data-flip-id="device-settings"
        type="button"
        onClick={() => setRoute("deviceSettings")}
        className="min-w-0 col-span-1 xl:col-span-3 bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] rounded-[22px] xl:rounded-[26px] p-4 xl:p-6 min-h-[120px] xl:min-h-[144px] h-full flex flex-col justify-between text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.985] cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2 xl:gap-3 w-full min-w-0">
          <div className="min-w-0">
            <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-tight truncate">
              Device Settings
            </h3>
            <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-1 truncate">
              Find buds, Theme & Logs
            </p>
          </div>
          <span className="hidden xl:inline-flex shrink-0 items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-text-soft)]">
            Preferences
            <ChevronDotsIcon className="w-3 h-3 text-[var(--nx-muted)]" />
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 w-full text-[var(--nx-text)]">
          <DeviceSettingsIcon className="w-6 h-6 xl:w-8 xl:h-8" />
          <span className="hidden xl:inline text-[11px] font-mono text-[var(--nx-muted)] truncate">
            Ring L / R · Nickname · Console
          </span>
        </div>
      </button>

      {/* Row 4 (medium & mobile) / Row 3 Right (fullscreen): About */}
      <button
        data-flip-id="about"
        type="button"
        onClick={() => setRoute("aboutDevice")}
        className="min-w-0 col-span-2 xl:col-span-3 bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] rounded-[22px] xl:rounded-[26px] p-4 xl:p-6 min-h-[116px] xl:min-h-[144px] h-full flex flex-col justify-between text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2 xl:gap-3 w-full min-w-0">
          <div className="min-w-0">
            <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-tight truncate">
              About
            </h3>
            <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-1 truncate">
              {device.deviceName} · Firmware {device.firmwareVersion}
            </p>
          </div>
          <span className="hidden xl:inline-flex shrink-0 items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-text-soft)]">
            FW {device.firmwareVersion}
            <ChevronDotsIcon className="w-3 h-3 text-[var(--nx-muted)]" />
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 w-full text-[var(--nx-text)]">
          <InfoCircleIcon className="w-6 h-6 xl:w-8 xl:h-8" />
          <span className="hidden xl:inline text-[11px] font-mono text-[var(--nx-muted)] tabular-nums truncate">
            SN {device.serialNumber}
          </span>
        </div>
      </button>
    </section>
  );
};
