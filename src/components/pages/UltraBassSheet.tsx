import React from "react";
import { useAnimatedPresence } from "../../lib/useMotion";
import { useDeviceStore } from "../../store/useDeviceStore";
import { ToggleSwitch } from "../device/ToggleSwitch";

export const UltraBassSheet: React.FC = () => {
  const {
    device,
    ultraBassSheetOpen,
    setUltraBassSheetOpen,
    setUltraBass,
  } = useDeviceStore();

  const { mounted, closing } = useAnimatedPresence(ultraBassSheetOpen);

  if (!mounted) return null;

  const { enabled, level } = device.ultraBass;

  return (
    <div
      className={`fixed inset-0 z-40 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 ${
        closing ? "nx-backdrop-exit" : "nx-backdrop-enter"
      }`}
      onClick={() => setUltraBassSheetOpen(false)}
    >
      <div
        className={`w-full max-w-[420px] bg-[var(--nx-modal)] border border-[var(--nx-border)] rounded-[28px] p-6 shadow-2xl ${
          closing ? "nx-modal-exit" : "nx-modal-enter"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[var(--nx-track)] mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-[26px] text-[var(--nx-text)] leading-tight">
              Ultra Bass
            </h2>
            <p className="text-xs text-[var(--nx-muted)] mt-1">
              Real-time low-frequency enhancement
            </p>
          </div>

          <ToggleSwitch
            checked={enabled}
            label="Toggle Ultra Bass"
            onChange={(next) => void setUltraBass(next, level || 3)}
          />
        </div>

        <div className="mt-6 bg-[var(--nx-bg)] border border-[var(--nx-border)] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--nx-muted)]">
            <span>Intensity Level</span>
            <span className="font-mono text-[var(--nx-text)]">
              {enabled ? `LEVEL ${level} / 5` : "OFF"}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((lv) => {
              const selected = enabled && level === lv;
              const filled = enabled && lv <= level;
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => void setUltraBass(true, lv)}
                  style={
                    selected
                      ? {
                          backgroundColor: "var(--nx-active-bg)",
                          color: "var(--nx-active-text)",
                          borderColor: "var(--nx-active-bg)",
                        }
                      : undefined
                  }
                  className={`py-3 rounded-xl text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-95 cursor-pointer border ${
                    selected
                      ? ""
                      : filled
                      ? "bg-[var(--nx-elevated)] text-[var(--nx-text)] border-[var(--nx-border)]"
                      : "bg-[var(--nx-card)] text-[var(--nx-muted)] border-transparent hover:bg-[var(--nx-card-hover)]"
                  }`}
                >
                  {lv}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={level}
              onChange={(e) =>
                void setUltraBass(true, Number(e.target.value))
              }
              className="nothing-slider"
            />
            <div className="flex justify-between text-[11px] text-[var(--nx-muted)] mt-1.5">
              <span>Subtle</span>
              <span>Balanced</span>
              <span>Deep Punch</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUltraBassSheetOpen(false)}
          className="w-full mt-5 py-3 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-sm font-medium text-[var(--nx-text)] transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
