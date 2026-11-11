import React from "react";
import cmfBudsHero from "../../assets/cmf-buds-2a-dark.jpg";
import type { BatteryReading } from "../../lib/types";
import { useDeviceStore } from "../../store/useDeviceStore";
import { BoltIcon } from "../icons/NothingIcons";

interface BatteryBarProps {
  label: string;
  reading: BatteryReading | null;
}

const BatteryBar: React.FC<BatteryBarProps> = ({ label, reading }) => {
  const level = reading?.level ?? 0;
  const isLow = level > 0 && level <= 15;

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
      <div className="w-14 h-[3px] rounded-full bg-[var(--nx-track)] overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isLow ? "bg-[#D71921]" : "bg-[var(--nx-text)]"
          }`}
          style={{
            width: `${reading ? Math.max(4, Math.min(100, level)) : 0}%`,
          }}
        />
      </div>
      <div className="flex items-center gap-0.5 text-[12px] tracking-tight text-[var(--nx-text-soft)] font-normal tabular-nums">
        <span>
          {label} {reading ? `${level}%` : "--"}
        </span>
        {reading?.charging ? (
          <BoltIcon className="w-3 h-3 text-[#22C55E]" />
        ) : null}
      </div>
    </div>
  );
};

export const DeviceHero: React.FC = () => {
  const {
    device,
    demoMode,
    connecting,
    setAddDeviceModalOpen,
    scanDevices,
    enterDemoMode,
  } = useDeviceStore();

  const isActive = device.connected || demoMode;

  return (
    <section className="md:flex-1 min-w-0 flex flex-col justify-between bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[24px] xl:rounded-[26px] p-4 xl:p-6 select-none">
      {/* Subtle hardware meta strip */}
      <div className="flex items-center justify-between gap-2 text-[10px] xl:text-[11px] font-mono text-[var(--nx-muted)] min-w-0">
        <span className="inline-flex items-center gap-1.5 tracking-wider uppercase truncate">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              connecting
                ? "bg-amber-400 animate-pulse"
                : demoMode
                ? "bg-amber-400"
                : device.connected
                ? "bg-[#22C55E]"
                : "bg-[var(--nx-muted)]"
            }`}
          />
          {device.modelBase}
          <span className="hidden xl:inline"> · {device.colorway}</span>
        </span>

        <span className="truncate tabular-nums shrink-0 max-w-[140px]">
          {isActive ? device.bluetoothAddress : "RFCOMM IDLE"}
        </span>
      </div>

      {/* Centered studio product stage — pure black backdrop blends JPEG cleanly */}
      <div className="flex-1 flex flex-col items-center justify-center py-2.5 md:py-3 xl:py-6 min-w-0">
        <div className="relative w-full max-w-[260px] md:max-w-[280px] xl:max-w-[340px] h-36 md:h-40 xl:h-60 2xl:h-64 rounded-[22px] xl:rounded-[24px] bg-[#000000] border border-white/[0.06] flex items-center justify-center overflow-hidden shadow-inner">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60 pointer-events-none dot-matrix-bg"
          />
          <img
            src={cmfBudsHero}
            alt={device.modelName}
            draggable={false}
            className={`relative z-10 w-[86%] h-[86%] object-contain mix-blend-lighten transition-all duration-300 ${
              isActive
                ? "opacity-100 scale-100 brightness-[0.97] contrast-[1.15]"
                : "opacity-55 grayscale scale-95 brightness-[0.95] contrast-[1.15]"
            }`}
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 68% 68% at 50% 50%, black 44%, transparent 94%)",
              maskImage:
                "radial-gradient(ellipse 68% 68% at 50% 50%, black 44%, transparent 94%)",
            }}
          />
        </div>

        <h2 className="font-serif text-[22px] sm:text-[24px] xl:text-[28px] leading-snug tracking-tight text-[var(--nx-text)] text-center mt-4 max-w-full truncate">
          {device.deviceName}
        </h2>

        {isActive ? (
          <div className="flex items-center justify-center gap-6 mt-3">
            <BatteryBar label="L" reading={device.battery.left} />
            <BatteryBar label="R" reading={device.battery.right} />
            {device.battery.case && device.battery.case.level > 0 ? (
              <BatteryBar label="C" reading={device.battery.case} />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 mt-2.5">
            <p className="text-xs text-[var(--nx-muted)] text-center">
              Earbuds disconnected or inside charging case
            </p>
            <div className="flex items-center gap-2.5 mt-0.5">
              <button
                type="button"
                disabled={connecting}
                onClick={() => {
                  setAddDeviceModalOpen(true);
                  void scanDevices();
                }}
                className="px-4 py-1.5 rounded-full bg-[var(--nx-active-bg)] text-[var(--nx-active-text)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
              >
                {connecting ? "Connecting..." : "Connect Buds"}
              </button>
              <button
                type="button"
                onClick={enterDemoMode}
                className="px-4 py-1.5 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] border border-[var(--nx-border)] text-[var(--nx-text)] text-xs transition-colors cursor-pointer"
              >
                Demo Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
