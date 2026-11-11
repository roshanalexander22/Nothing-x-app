import React, { useState } from "react";
import {
  ACTION_CATALOG,
  B185_GESTURE_SLOTS,
  DEFAULT_BUTTON,
  DEVICE_LEFT,
  DEVICE_RIGHT,
  getActionLabel,
} from "../../lib/gestures";
import { useDeviceStore } from "../../store/useDeviceStore";
import { ChevronDotsIcon } from "../icons/NothingIcons";
import { SubPageLayout } from "../layout/SubPageLayout";

type EarbudSide = "left" | "right";

interface EditingTarget {
  side: EarbudSide;
  gesture: number;
}

export const ControlsPage: React.FC = () => {
  const { device, setRoute, setGesture, resetGestures } = useDeviceStore();
  const [selectedSide, setSelectedSide] = useState<EarbudSide>("left");
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null);

  const getDeviceId = (side: EarbudSide) =>
    side === "left" ? DEVICE_LEFT : DEVICE_RIGHT;

  const getCurrentAction = (
    side: EarbudSide,
    gestureCode: number,
    fallback: number
  ): number => {
    const devId = getDeviceId(side);
    const found = device.gestures.find(
      (g) => g.device === devId && g.gesture === gestureCode
    );
    return found?.action ?? fallback;
  };

  const renderEarbudColumn = (side: EarbudSide, title: string) => (
    <div>
      <div className="hidden lg:flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[var(--nx-elevated)] border border-[var(--nx-border)] text-[11px] font-mono flex items-center justify-center text-[var(--nx-text)]">
            {side === "left" ? "L" : "R"}
          </span>
          <h2 className="text-[15px] font-medium text-[var(--nx-text)]">
            {title}
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[var(--nx-muted)] uppercase">
          Touch Controls
        </span>
      </div>

      <div className="flex flex-col gap-[2px]">
        {B185_GESTURE_SLOTS.map((slot, idx) => {
          const actionCode = getCurrentAction(
            side,
            slot.gesture,
            slot.defaultAction
          );
          const isFirst = idx === 0;
          const isLast = idx === B185_GESTURE_SLOTS.length - 1;
          const radius = isFirst
            ? "rounded-t-[24px] rounded-b-[4px]"
            : isLast
            ? "rounded-t-[4px] rounded-b-[24px]"
            : "rounded-[4px]";

          return (
            <button
              key={`${side}-${slot.gesture}`}
              type="button"
              onClick={() => setEditingTarget({ side, gesture: slot.gesture })}
              className={`w-full bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] ${radius} px-5 py-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer`}
            >
              <div className="min-w-0">
                <div className="text-[15px] text-[var(--nx-text)] font-medium">
                  {slot.label}
                </div>
                <div className="text-xs text-[var(--nx-muted)] mt-0.5">
                  {slot.description}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[13px] text-[var(--nx-text-soft)]">
                  {getActionLabel(actionCode)}
                </span>
                <ChevronDotsIcon className="w-4 h-4 text-[var(--nx-muted)]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const editingSlot =
    editingTarget !== null
      ? B185_GESTURE_SLOTS.find((s) => s.gesture === editingTarget.gesture) ??
        null
      : null;

  return (
    <SubPageLayout
      title="Controls"
      onBack={() => setRoute("home")}
      rightAction={
        <button
          type="button"
          onClick={() => void resetGestures()}
          className="px-4 py-1.5 rounded-full bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] text-xs text-[var(--nx-text)] cursor-pointer"
        >
          Reset to Default
        </button>
      }
    >
      {/* Mobile / narrow segmented pill */}
      <div className="lg:hidden bg-[var(--nx-card)] border border-[var(--nx-border)] p-1 rounded-full grid grid-cols-2 gap-1 max-w-[460px] mb-4">
        {(
          [
            { id: "left", label: "Left Earbud" },
            { id: "right", label: "Right Earbud" },
          ] as const
        ).map((tab) => {
          const active = selectedSide === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSide(tab.id)}
              style={
                active
                  ? {
                      backgroundColor: "var(--nx-active-bg)",
                      color: "var(--nx-active-text)",
                    }
                  : undefined
              }
              className={`py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? ""
                  : "text-[var(--nx-muted)] hover:text-[var(--nx-text)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Narrow view: active side only */}
      <div className="lg:hidden">
        {renderEarbudColumn(
          selectedSide,
          selectedSide === "left" ? "Left Earbud" : "Right Earbud"
        )}
      </div>

      {/* Desktop / fullscreen: Left & Right Earbuds side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-5">
        {renderEarbudColumn("left", "Left Earbud")}
        {renderEarbudColumn("right", "Right Earbud")}
      </div>

      {/* Action selector sheet */}
      {editingSlot && editingTarget ? (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setEditingTarget(null)}
        >
          <div
            className="w-full max-w-[440px] bg-[var(--nx-modal)] border border-[var(--nx-border)] rounded-[28px] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[var(--nx-track)] mx-auto mb-3 sm:hidden" />
            <h3 className="font-serif text-xl text-[var(--nx-text)]">
              {editingTarget.side === "left" ? "Left" : "Right"} ·{" "}
              {editingSlot.label}
            </h3>
            <p className="text-xs text-[var(--nx-muted)] mt-0.5">
              Choose the function triggered on your CMF Buds 2a
            </p>

            <div className="mt-4 space-y-1.5 max-h-72 overflow-y-auto nothing-scroll">
              {editingSlot.allowedActions.map((code) => {
                const current = getCurrentAction(
                  editingTarget.side,
                  editingSlot.gesture,
                  editingSlot.defaultAction
                );
                const selected = current === code;
                const label = ACTION_CATALOG[code]?.label ?? `Action #${code}`;

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      void setGesture({
                        device: getDeviceId(editingTarget.side),
                        button: DEFAULT_BUTTON,
                        gesture: editingSlot.gesture,
                        action: code,
                      });
                      setEditingTarget(null);
                    }}
                    style={
                      selected
                        ? {
                            backgroundColor: "var(--nx-active-bg)",
                            color: "var(--nx-active-text)",
                          }
                        : undefined
                    }
                    className={`w-full px-4 py-3 rounded-2xl flex items-center justify-between text-left text-sm transition-colors cursor-pointer ${
                      selected
                        ? "font-medium"
                        : "bg-[var(--nx-card)] hover:bg-[var(--nx-elevated)] text-[var(--nx-text)] border border-[var(--nx-border)]"
                    }`}
                  >
                    <span>{label}</span>
                    {selected ? (
                      <span className="w-2 h-2 rounded-full bg-[#D71921]" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setEditingTarget(null)}
              className="w-full mt-4 py-2.5 rounded-full bg-[var(--nx-elevated)] text-sm text-[var(--nx-text)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </SubPageLayout>
  );
};
