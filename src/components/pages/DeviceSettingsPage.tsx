import React, { useState } from "react";
import { useDeviceStore } from "../../store/useDeviceStore";
import { ToggleSwitch } from "../device/ToggleSwitch";
import { SubPageLayout } from "../layout/SubPageLayout";

export const DeviceSettingsPage: React.FC = () => {
  const {
    device,
    demoMode,
    preferences,
    logs,
    ringingLeft,
    ringingRight,
    setRoute,
    toggleRingBud,
    updatePreferences,
    refreshState,
    disconnectDevice,
    clearLogs,
    setAddDeviceModalOpen,
    showToast,
  } = useDeviceStore();

  const [nickname, setNickname] = useState(
    preferences.customName ?? device.deviceName
  );
  const interactive = device.connected || demoMode;

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nickname.trim();
    await updatePreferences({ customName: cleaned || null });
    showToast("Device nickname updated");
  };

  return (
    <SubPageLayout title="Device Settings" onBack={() => setRoute("home")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Find My Earbuds */}
        <section
          data-flip-id="settings-find"
          className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[22px] p-5 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-[16px] font-medium text-[var(--nx-text)]">
              Find My Earbuds
            </h3>
            <p className="text-xs text-[var(--nx-muted)] mt-1">
              Play an audible tone on either bud to locate it. Remove earbuds
              from your ears before ringing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              disabled={!interactive}
              onClick={() => void toggleRingBud(true)}
              className={`py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                ringingLeft
                  ? "bg-[#D71921] text-white"
                  : "bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-[var(--nx-text)]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ringingLeft
                    ? "bg-white animate-ping"
                    : "bg-[var(--nx-muted)]"
                }`}
              />
              {ringingLeft ? "Stop Left" : "Ring Left"}
            </button>

            <button
              type="button"
              disabled={!interactive}
              onClick={() => void toggleRingBud(false)}
              className={`py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                ringingRight
                  ? "bg-[#D71921] text-white"
                  : "bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-[var(--nx-text)]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ringingRight
                    ? "bg-white animate-ping"
                    : "bg-[var(--nx-muted)]"
                }`}
              />
              {ringingRight ? "Stop Right" : "Ring Right"}
            </button>
          </div>
        </section>

        {/* Appearance & Nickname */}
        <div data-flip-id="settings-appearance-col" className="space-y-3.5">
          {/* Appearance */}
          <section className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[22px] p-5">
            <h3 className="text-[15px] font-medium text-[var(--nx-text)]">
              Appearance
            </h3>
            <p className="text-xs text-[var(--nx-muted)] mt-0.5">
              Switch between Nothing Dark and Light theme
            </p>
            <div className="mt-3 bg-[var(--nx-bg)] border border-[var(--nx-border)] p-1 rounded-full grid grid-cols-2 gap-1">
              {(["dark", "light"] as const).map((mode) => {
                const active = preferences.theme === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => void updatePreferences({ theme: mode })}
                    style={
                      active
                        ? {
                            backgroundColor: "var(--nx-active-bg)",
                            color: "var(--nx-active-text)",
                          }
                        : undefined
                    }
                    className={`py-2 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                      active
                        ? ""
                        : "text-[var(--nx-muted)] hover:text-[var(--nx-text)]"
                    }`}
                  >
                    {mode} Mode
                  </button>
                );
              })}
            </div>
          </section>

          {/* Device Name */}
          <form
            onSubmit={(e) => void handleSaveNickname(e)}
            className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[22px] p-5"
          >
            <label className="block text-[15px] font-medium text-[var(--nx-text)]">
              Device Nickname
            </label>
            <div className="flex gap-2 mt-2.5">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Roshan's CMF Buds 2a"
                className="flex-1 bg-[var(--nx-bg)] border border-[var(--nx-border)] focus:border-[var(--nx-text)] rounded-xl px-3.5 py-2 text-sm text-[var(--nx-text)] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--nx-active-bg)] text-[var(--nx-active-text)] text-xs font-medium hover:opacity-90 cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 items-stretch">
        {/* App Behavior */}
        <section
          data-flip-id="settings-behavior"
          className="lg:col-span-5 bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[22px] p-5 space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[15px] text-[var(--nx-text)]">
                  Auto-connect on launch
                </div>
                <div className="text-xs text-[var(--nx-muted)] mt-0.5">
                  Connect to paired B185 earbuds automatically at startup
                </div>
              </div>
              <ToggleSwitch
                checked={preferences.autoConnect}
                label="Auto-connect on launch"
                onChange={(next) =>
                  void updatePreferences({ autoConnect: next })
                }
              />
            </div>

            <div className="h-px bg-[var(--nx-border)]" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[15px] text-[var(--nx-text)]">
                  Minimize to tray on close
                </div>
                <div className="text-xs text-[var(--nx-muted)] mt-0.5">
                  Keep Nothing X running cleanly in the Windows background
                </div>
              </div>
              <ToggleSwitch
                checked={preferences.minimizeToTray}
                label="Minimize to tray"
                onChange={(next) =>
                  void updatePreferences({ minimizeToTray: next })
                }
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void refreshState()}
              className="flex-1 py-2.5 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-xs font-medium text-[var(--nx-text)] cursor-pointer"
            >
              Sync State
            </button>
            {interactive ? (
              <button
                type="button"
                onClick={() => void disconnectDevice()}
                className="flex-1 py-2.5 rounded-full bg-[var(--nx-elevated)] hover:bg-[#D71921] hover:text-white text-xs font-medium text-[var(--nx-text)] transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAddDeviceModalOpen(true)}
                className="flex-1 py-2.5 rounded-full bg-[var(--nx-active-bg)] text-[var(--nx-active-text)] text-xs font-medium cursor-pointer"
              >
                Connect
              </button>
            )}
          </div>
        </section>

        {/* Protocol Inspector */}
        <section
          data-flip-id="settings-inspector"
          className="lg:col-span-7 bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[22px] p-5 flex flex-col"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-medium text-[var(--nx-text)]">
                Protocol Frame Inspector
              </h3>
              <p className="text-[11px] font-mono text-[var(--nx-muted)] mt-0.5">
                RFCOMM 0x55 frames & CRC-16/MODBUS logs
              </p>
            </div>
            <button
              type="button"
              onClick={() => void clearLogs()}
              className="px-3 py-1 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-xs text-[var(--nx-text)] cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 flex-1 bg-[var(--nx-console-bg)] rounded-2xl p-3 max-h-64 min-h-[160px] overflow-y-auto nothing-scroll font-mono text-[11px] space-y-2 border border-[var(--nx-border)]">
            {logs.length === 0 ? (
              <div className="text-[var(--nx-muted)] py-3 text-center">
                No RFCOMM frames captured yet.
              </div>
            ) : (
              logs.slice(0, 60).map((entry, idx) => (
                <div
                  key={`${entry.timestampMs}-${idx}`}
                  className="border-b border-[var(--nx-border)] pb-1.5 last:border-b-0"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={
                        entry.direction === "TX"
                          ? "text-[#D71921] font-semibold"
                          : entry.direction === "RX"
                          ? "text-[#22C55E] font-semibold"
                          : "text-amber-500 font-semibold"
                      }
                    >
                      [{entry.direction}] {entry.label}
                    </span>
                  </div>
                  <div className="text-[var(--nx-text-soft)] break-all mt-0.5">
                    {entry.hex}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SubPageLayout>
  );
};
