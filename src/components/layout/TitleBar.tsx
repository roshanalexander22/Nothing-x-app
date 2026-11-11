import React, { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriRuntime } from "../../lib/tauri";
import { useDeviceStore } from "../../store/useDeviceStore";

export const TitleBar: React.FC = () => {
  const {
    device,
    demoMode,
    connecting,
    preferences,
    updatePreferences,
    setAddDeviceModalOpen,
  } = useDeviceStore();

  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    const win = getCurrentWindow();
    let mounted = true;
    let unlisten: (() => void) | undefined;

    void win.isMaximized().then((m) => {
      if (mounted) setMaximized(m);
    });

    void win
      .onResized(async () => {
        const m = await win.isMaximized();
        if (mounted) setMaximized(m);
      })
      .then((fn) => {
        if (mounted) unlisten = fn;
        else fn();
      });

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  const handleMinimize = () => {
    if (!isTauriRuntime()) return;
    void getCurrentWindow().minimize();
  };

  const handleToggleMaximize = async () => {
    if (!isTauriRuntime()) return;
    const win = getCurrentWindow();
    await win.toggleMaximize();
    setMaximized(await win.isMaximized());
  };

  const handleClose = () => {
    if (!isTauriRuntime()) return;
    void getCurrentWindow().close();
  };

  const isLight = preferences.theme === "light";

  const statusLabel = connecting
    ? "CONNECTING"
    : demoMode
    ? "DEMO MODE"
    : device.connected
    ? "CONNECTED"
    : "OFFLINE";

  const statusDotClass = connecting
    ? "bg-amber-400 animate-pulse"
    : demoMode
    ? "bg-amber-400"
    : device.connected
    ? "bg-[#22C55E]"
    : "bg-[var(--nx-muted)]";

  return (
    <div
      data-tauri-drag-region="deep"
      className="h-10 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 bg-[var(--nx-bg)] border-b border-[var(--nx-border)] select-none"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.12em] sm:tracking-[0.18em] text-[var(--nx-text-soft)] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0" />
          NOTHING X
        </span>
        <button
          type="button"
          onClick={() => setAddDeviceModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] text-[9px] sm:text-[10px] font-mono tracking-wider text-[var(--nx-text-soft)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Manage Bluetooth Connection"
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass}`} />
          {statusLabel}
        </button>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {/* Theme switcher pill */}
        <button
          type="button"
          onClick={() =>
            void updatePreferences({ theme: isLight ? "dark" : "light" })
          }
          title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle Light / Dark theme"
          className="h-7 px-2 sm:px-2.5 mr-0.5 sm:mr-1 rounded-full bg-[var(--nx-card)] hover:bg-[var(--nx-elevated)] border border-[var(--nx-border)] text-[11px] font-medium text-[var(--nx-text-soft)] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isLight ? (
            <>
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.3 9.7A5.5 5.5 0 0 1 6.3 2.7a5.5 5.5 0 1 0 7 7Z" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Minimize */}
        <button
          type="button"
          onClick={handleMinimize}
          aria-label="Minimize window"
          title="Minimize"
          className="w-8 h-7 rounded-lg flex items-center justify-center text-[var(--nx-text-soft)] hover:text-[var(--nx-text)] hover:bg-[var(--nx-elevated)] transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5">
            <path d="M3.5 8.5h9" strokeLinecap="round" />
          </svg>
        </button>

        {/* Maximize / Restore Down */}
        <button
          type="button"
          onClick={() => void handleToggleMaximize()}
          aria-label={maximized ? "Restore window" : "Maximize window"}
          title={maximized ? "Restore Down" : "Maximize"}
          className="w-8 h-7 rounded-lg flex items-center justify-center text-[var(--nx-text-soft)] hover:text-[var(--nx-text)] hover:bg-[var(--nx-elevated)] transition-colors cursor-pointer"
        >
          {maximized ? (
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.35">
              <rect x="3.2" y="5.2" width="7.2" height="7.2" rx="1" />
              <path d="M5.6 5.2V3.8a1 1 0 0 1 1-1h5.6a1 1 0 0 1 1 1v5.6a1 1 0 0 1-1 1h-1.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.35">
              <rect x="3.5" y="3.5" width="9" height="9" rx="1.2" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close window"
          title="Close"
          className="w-8 h-7 rounded-lg flex items-center justify-center text-[var(--nx-text-soft)] hover:text-white hover:bg-[#D71921] transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5">
            <path d="M4.5 4.5l7 7m0-7l-7 7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};
