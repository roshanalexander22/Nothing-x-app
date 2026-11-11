import React from "react";
import { useDeviceStore } from "../../store/useDeviceStore";
import { MiniBudsIcon, PlusIcon } from "../icons/NothingIcons";

export const Header: React.FC = () => {
  const {
    device,
    demoMode,
    setRoute,
    setAddDeviceModalOpen,
    scanDevices,
  } = useDeviceStore();

  const handleOpenAddDevice = () => {
    setAddDeviceModalOpen(true);
    void scanDevices();
  };

  const dotClass = demoMode
    ? "bg-amber-400"
    : device.connected
    ? "bg-[#22C55E]"
    : "bg-[var(--nx-muted)]";

  return (
    <header className="px-4 sm:px-6 md:px-10 pt-3.5 pb-2.5 xl:pt-5 xl:pb-3 shrink-0 max-w-[1680px] mx-auto w-full min-w-0">
      <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <h1 className="font-serif text-[26px] sm:text-[28px] md:text-[34px] leading-none tracking-tight text-[var(--nx-text)] truncate">
            My devices
          </h1>

          {/* On wide desktop screens show device pill inline next to title */}
          <button
            type="button"
            onClick={handleOpenAddDevice}
            title="Switch or connect Bluetooth device"
            className="hidden md:flex relative w-10 h-10 rounded-full bg-[#ECECED] hover:bg-white border border-black/10 items-center justify-center transition-colors cursor-pointer"
          >
            <MiniBudsIcon className="w-6 h-6" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--nx-bg)] ${dotClass}`}
            />
          </button>

          <span className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--nx-card)] border border-[var(--nx-border)] text-xs text-[var(--nx-muted)]">
            <span className="text-[var(--nx-text)] font-medium">
              {device.deviceName}
            </span>
            <span>·</span>
            <span className="font-mono text-[11px]">{device.modelBase}</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddDevice}
            aria-label="Add or scan Bluetooth device"
            title="Scan paired Bluetooth devices"
            className="hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] text-xs font-medium text-[var(--nx-text)] transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Devices</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute("appInfo")}
            title="App info & legal"
            className="w-10 h-10 rounded-full bg-[var(--nx-card)] border border-[var(--nx-border)] flex items-center justify-center overflow-hidden hover:border-[#D71921]/50 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <defs>
                <linearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#262A27" />
                  <stop offset="100%" stopColor="#121214" />
                </linearGradient>
              </defs>
              <rect width="40" height="40" fill="url(#avatarBg)" />
              <circle cx="20" cy="15.5" r="5.5" fill="#E5E5EA" />
              <path
                d="M9.5 34.5c1.8-6 6.2-9 10.5-9s8.7 3 10.5 9"
                fill="#D1D1D6"
              />
              <circle cx="30" cy="10" r="2.2" fill="#D71921" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile-width second row controls */}
      <div className="flex md:hidden items-center justify-between mt-4">
        <button
          type="button"
          onClick={handleOpenAddDevice}
          title="Switch or connect Bluetooth device"
          className="relative w-11 h-11 rounded-full bg-[#ECECED] hover:bg-white border border-black/10 flex items-center justify-center transition-colors cursor-pointer"
        >
          <MiniBudsIcon className="w-7 h-7" />
          <span
            className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--nx-bg)] ${dotClass}`}
          />
        </button>

        <button
          type="button"
          onClick={handleOpenAddDevice}
          aria-label="Add or scan Bluetooth device"
          title="Scan paired Bluetooth devices"
          className="w-11 h-11 rounded-full bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] text-[var(--nx-text)] flex items-center justify-center transition-colors cursor-pointer"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
