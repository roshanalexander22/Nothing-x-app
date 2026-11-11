import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EQ_PRESETS } from "../../lib/gestures";
import { prefersReducedMotion } from "../../lib/useMotion";
import type { CustomEqBands, EqPreset } from "../../lib/types";
import { useDeviceStore } from "../../store/useDeviceStore";
import { SubPageLayout } from "../layout/SubPageLayout";

function mapDbToY(db: number): number {
  return 60 - db * 7;
}

function buildSmoothCurvePath(bass: number, mid: number, treble: number): string {
  const y0 = 60;
  const y1 = mapDbToY(bass);
  const y2 = mapDbToY(mid);
  const y3 = mapDbToY(treble);
  const y4 = 60;
  return `M 16 ${y0} C 55 ${y1}, 75 ${y1}, 96 ${y1} C 125 ${y1}, 135 ${y2}, 168 ${y2} C 200 ${y2}, 212 ${y3}, 244 ${y3} C 268 ${y3}, 286 ${y4}, 304 ${y4}`;
}

function formatDb(val: number): string {
  return `${val > 0 ? `+${val}` : val} dB`;
}

export const EqualiserPage: React.FC = () => {
  const { device, setRoute, setEqPreset, setCustomEq } = useDeviceStore();
  const [draftCustom, setDraftCustom] = useState<CustomEqBands>(device.customEq);

  useEffect(() => {
    setDraftCustom(device.customEq);
  }, [device.customEq]);

  const activeMeta =
    EQ_PRESETS.find((p) => p.id === device.eqPreset) ?? EQ_PRESETS[0];

  const [bassVal, midVal, trebleVal] =
    device.eqPreset === "custom"
      ? [draftCustom.bass, draftCustom.mid, draftCustom.treble]
      : activeMeta.curve;

  const curvePathRef = useRef<SVGPathElement>(null);
  const bassDotRef = useRef<SVGCircleElement>(null);
  const midDotRef = useRef<SVGCircleElement>(null);
  const trebleDotRef = useRef<SVGCircleElement>(null);
  const animatedBandsRef = useRef<[number, number, number]>([
    bassVal,
    midVal,
    trebleVal,
  ]);

  useLayoutEffect(() => {
    const [sb, sm, st] = animatedBandsRef.current;
    if (
      Math.abs(sb - bassVal) < 0.01 &&
      Math.abs(sm - midVal) < 0.01 &&
      Math.abs(st - trebleVal) < 0.01
    ) {
      return;
    }

    const applyBands = (b: number, m: number, t: number) => {
      animatedBandsRef.current = [b, m, t];
      curvePathRef.current?.setAttribute("d", buildSmoothCurvePath(b, m, t));
      bassDotRef.current?.setAttribute("cy", String(mapDbToY(b)));
      midDotRef.current?.setAttribute("cy", String(mapDbToY(m)));
      trebleDotRef.current?.setAttribute("cy", String(mapDbToY(t)));
    };

    if (prefersReducedMotion()) {
      applyBands(bassVal, midVal, trebleVal);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();
    const duration = 200;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      applyBands(
        sb + (bassVal - sb) * eased,
        sm + (midVal - sm) * eased,
        st + (trebleVal - st) * eased
      );
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [bassVal, midVal, trebleVal]);

  const [renderBass, renderMid, renderTreble] = animatedBandsRef.current;
  const curvePath = buildSmoothCurvePath(renderBass, renderMid, renderTreble);

  const handleSelectPreset = (preset: EqPreset) => {
    void setEqPreset(preset);
  };

  const handleBandChange = (band: keyof CustomEqBands, value: number) => {
    setDraftCustom({ ...draftCustom, [band]: value });
  };

  const commitCustom = (bands: CustomEqBands) => {
    void setCustomEq(bands);
  };

  return (
    <SubPageLayout title="Equaliser" onBack={() => setRoute("home")}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left column: Acoustic curve visualizer */}
        <div
          data-flip-id="eq-curve"
          className="lg:col-span-5 bg-[var(--nx-card)] rounded-[26px] p-5 xl:p-6 dot-matrix-bg border border-[var(--nx-border)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-[var(--nx-muted)]">
            <span>Response Profile</span>
            <span className="font-mono text-[var(--nx-text)] uppercase px-2.5 py-0.5 rounded-full bg-[var(--nx-elevated)]">
              {activeMeta.label}
            </span>
          </div>

          <div className="my-4 flex-1 flex items-center justify-center">
            <svg viewBox="0 0 320 120" className="w-full h-36 lg:h-52">
              <line
                x1="16"
                y1="60"
                x2="304"
                y2="60"
                stroke="var(--nx-track)"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <path
                ref={curvePathRef}
                d={curvePath}
                fill="none"
                stroke="var(--nx-text)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle
                ref={bassDotRef}
                cx="96"
                cy={mapDbToY(renderBass)}
                r="4.5"
                fill="#D71921"
              />
              <circle
                ref={midDotRef}
                cx="168"
                cy={mapDbToY(renderMid)}
                r="4.5"
                fill="var(--nx-text)"
              />
              <circle
                ref={trebleDotRef}
                cx="244"
                cy={mapDbToY(renderTreble)}
                r="4.5"
                fill="var(--nx-text)"
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--nx-border)] text-center">
            <div className="bg-[var(--nx-bg)]/70 rounded-xl py-2 px-2">
              <div className="text-[10px] font-mono text-[var(--nx-muted)]">
                BASS 140Hz
              </div>
              <div className="text-xs font-mono font-medium text-[var(--nx-text)] mt-0.5 tabular-nums">
                {formatDb(bassVal)}
              </div>
            </div>
            <div className="bg-[var(--nx-bg)]/70 rounded-xl py-2 px-2">
              <div className="text-[10px] font-mono text-[var(--nx-muted)]">
                MID 980Hz
              </div>
              <div className="text-xs font-mono font-medium text-[var(--nx-text)] mt-0.5 tabular-nums">
                {formatDb(midVal)}
              </div>
            </div>
            <div className="bg-[var(--nx-bg)]/70 rounded-xl py-2 px-2">
              <div className="text-[10px] font-mono text-[var(--nx-muted)]">
                TREBLE 6.9kHz
              </div>
              <div className="text-xs font-mono font-medium text-[var(--nx-text)] mt-0.5 tabular-nums">
                {formatDb(trebleVal)}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Presets + Custom 3-band EQ */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[var(--nx-muted)] mb-2.5">
              Sound Modes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EQ_PRESETS.map((preset) => {
                const active = device.eqPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    data-flip-id={`eq-preset-${preset.id}`}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    style={
                      active
                        ? {
                            backgroundColor: "var(--nx-active-bg)",
                            color: "var(--nx-active-text)",
                            borderColor: "var(--nx-active-bg)",
                          }
                        : undefined
                    }
                    className={`rounded-[22px] p-4 text-left transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer border ${
                      active
                        ? ""
                        : "bg-[var(--nx-card)] text-[var(--nx-text)] border-[var(--nx-border)] hover:bg-[var(--nx-card-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-medium">
                        {preset.label}
                      </span>
                      {active ? (
                        <span className="w-2 h-2 rounded-full bg-[#D71921]" />
                      ) : null}
                    </div>
                    <p
                      className={`text-[11px] mt-1 leading-snug ${
                        active ? "opacity-75" : "text-[var(--nx-muted)]"
                      }`}
                    >
                      {preset.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[26px] p-5 xl:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-medium text-[var(--nx-text)]">
                  Custom 3-Band EQ
                </h3>
                <p className="text-xs text-[var(--nx-muted)] mt-0.5">
                  Drag sliders to tune and apply (-6 to +6 dB)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const flat = { bass: 0, mid: 0, treble: 0 };
                  setDraftCustom(flat);
                  commitCustom(flat);
                }}
                className="text-xs px-3 py-1 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-[var(--nx-text)] cursor-pointer"
              >
                Flat
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {(
                [
                  { key: "bass", label: "Bass", freq: "140 Hz" },
                  { key: "mid", label: "Mid", freq: "980 Hz" },
                  { key: "treble", label: "Treble", freq: "6900 Hz" },
                ] as const
              ).map((band) => {
                const val = draftCustom[band.key];
                return (
                  <div key={band.key}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[var(--nx-text)] font-medium">
                        {band.label}{" "}
                        <span className="text-[var(--nx-muted)] font-mono">
                          ({band.freq})
                        </span>
                      </span>
                      <span className="font-mono text-[var(--nx-text)]">
                        {formatDb(val)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={1}
                      value={val}
                      onChange={(e) =>
                        handleBandChange(band.key, Number(e.target.value))
                      }
                      onMouseUp={() => commitCustom(draftCustom)}
                      onTouchEnd={() => commitCustom(draftCustom)}
                      className="nothing-slider"
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => commitCustom(draftCustom)}
              className="w-full mt-5 py-2.5 rounded-full bg-[var(--nx-active-bg)] text-[var(--nx-active-text)] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Apply Custom EQ
            </button>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
};
