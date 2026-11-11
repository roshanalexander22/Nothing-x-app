import React from "react";
import type { AncMode } from "../../lib/types";
import { useDeviceStore } from "../../store/useDeviceStore";
import {
  AncActiveIcon,
  AncOffIcon,
  TransparencyIcon,
} from "../icons/NothingIcons";

const ANC_MODES: Array<{
  id: AncMode;
  label: string;
  renderIcon: (cls: string) => React.ReactNode;
}> = [
  {
    id: "noiseCancellation",
    label: "Noise Cancellation",
    renderIcon: (cls) => <AncActiveIcon className={cls} />,
  },
  {
    id: "transparency",
    label: "Transparency",
    renderIcon: (cls) => <TransparencyIcon className={cls} />,
  },
  {
    id: "off",
    label: "Off",
    renderIcon: (cls) => <AncOffIcon className={cls} />,
  },
];

export const AncCard: React.FC = () => {
  const { device, demoMode, setAncMode } = useDeviceStore();
  const interactive = device.connected || demoMode;

  const activeLabel =
    ANC_MODES.find((m) => m.id === device.ancMode)?.label ?? "Off";

  return (
    <section
      className={`min-w-0 bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[24px] xl:rounded-[26px] p-4 xl:p-6 shrink-0 transition-opacity ${
        interactive ? "opacity-100" : "opacity-60 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <h3 className="text-[16px] xl:text-[19px] font-medium text-[var(--nx-text)] leading-snug">
            Noise Cancellation
          </h3>
          <p className="text-[12px] xl:text-[14px] text-[var(--nx-muted)] mt-0.5">
            {activeLabel}
          </p>
        </div>

        <span className="hidden xl:inline-flex shrink-0 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-text-soft)]">
          ANC Control
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3.5 xl:mt-5">
        {ANC_MODES.map((mode) => {
          const active = device.ancMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => void setAncMode(mode.id)}
              className="min-w-0 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div
                style={{
                  backgroundColor: active
                    ? "var(--nx-active-bg)"
                    : "var(--nx-pill-inactive)",
                  color: active
                    ? "var(--nx-active-text)"
                    : "var(--nx-pill-inactive-text)",
                }}
                className="w-12 h-12 sm:w-[54px] sm:h-[54px] xl:w-[62px] xl:h-[62px] rounded-full flex items-center justify-center transition-all duration-150 shadow-sm group-hover:scale-105"
              >
                {mode.renderIcon("w-5 h-5 sm:w-6 sm:h-6")}
              </div>
              <span
                className={`text-[11px] xl:text-[12px] leading-tight text-center transition-colors ${
                  active
                    ? "text-[var(--nx-text)] font-medium"
                    : "text-[var(--nx-muted)]"
                }`}
              >
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
