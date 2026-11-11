import React from "react";
import { isTauriRuntime } from "../../lib/tauri";
import { useAnimatedPresence } from "../../lib/useMotion";
import { useDeviceStore } from "../../store/useDeviceStore";

export const AddDeviceModal: React.FC = () => {
  const {
    addDeviceModalOpen,
    setAddDeviceModalOpen,
    pairedDevices,
    device,
    demoMode,
    scanning,
    connecting,
    scanDevices,
    connectToDevice,
    disconnectDevice,
    enterDemoMode,
    exitDemoMode,
  } = useDeviceStore();

  const { mounted, closing } = useAnimatedPresence(addDeviceModalOpen);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 ${
        closing ? "nx-backdrop-exit" : "nx-backdrop-enter"
      }`}
      onClick={() => setAddDeviceModalOpen(false)}
    >
      <div
        className={`w-full max-w-[440px] bg-[var(--nx-modal)] border border-[var(--nx-border)] rounded-[26px] p-5 shadow-2xl ${
          closing ? "nx-modal-exit" : "nx-modal-enter"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl text-[var(--nx-text)] leading-tight">
              Bluetooth Devices
            </h2>
            <p className="text-xs text-[var(--nx-muted)] mt-1">
              Classic Bluetooth RFCOMM · Nothing X Protocol
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddDeviceModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[var(--nx-elevated)] text-[var(--nx-text-soft)] hover:text-[var(--nx-text)] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-[var(--nx-muted)]">
            Paired on Windows
          </span>
          <button
            type="button"
            disabled={scanning}
            onClick={() => void scanDevices()}
            className="text-xs text-[var(--nx-text)] px-3 py-1 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] cursor-pointer disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Refresh"}
          </button>
        </div>

        <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto nothing-scroll">
          {pairedDevices.length === 0 ? (
            <div className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-2xl p-4 text-xs text-[var(--nx-muted)]">
              No paired Bluetooth audio devices returned yet. Pair your CMF Buds
              2a in Windows Settings → Bluetooth first.
            </div>
          ) : (
            pairedDevices.map((d) => {
              const isCurrent =
                device.connected &&
                !demoMode &&
                device.bluetoothAddress.toLowerCase() ===
                  d.address.toLowerCase();

              return (
                <div
                  key={d.address}
                  className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--nx-text)] truncate">
                        {d.name}
                      </span>
                      {d.supportsControl ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nx-elevated)] text-[var(--nx-text)] font-mono">
                          B185
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] font-mono text-[var(--nx-muted)] mt-0.5">
                      {d.address} · {d.connected ? "Paired & Active" : "Paired"}
                    </p>
                  </div>

                  {isCurrent ? (
                    <button
                      type="button"
                      onClick={() => void disconnectDevice()}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-xs text-[var(--nx-text)] cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={connecting}
                      onClick={() => void connectToDevice(d.address)}
                      className="shrink-0 px-3.5 py-1.5 rounded-full bg-[var(--nx-active-bg)] text-[var(--nx-active-text)] text-xs font-medium hover:opacity-90 cursor-pointer disabled:opacity-50"
                    >
                      {connecting ? "..." : "Connect"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--nx-border)] space-y-2.5">
          <p className="text-[11px] leading-relaxed text-[var(--nx-muted)]">
            Note: Only one Nothing X client can hold the RFCOMM control socket at
            a time. Close Nothing X on your phone if connection is busy.
          </p>

          <div className="flex items-center justify-between gap-2">
            {demoMode ? (
              <button
                type="button"
                disabled={!isTauriRuntime()}
                onClick={() => void exitDemoMode()}
                className="flex-1 py-2 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-xs text-[var(--nx-text)] cursor-pointer disabled:opacity-45"
              >
                Exit Demo Mode
              </button>
            ) : (
              <button
                type="button"
                onClick={enterDemoMode}
                className="flex-1 py-2 rounded-full bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-xs text-[var(--nx-text)] cursor-pointer"
              >
                Preview UI (Demo Mode)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
