import React, { useEffect } from "react";
import { AddDeviceModal } from "./components/device/AddDeviceModal";
import { AncCard } from "./components/device/AncCard";
import { DeviceHero } from "./components/device/DeviceHero";
import { FeatureGrid } from "./components/device/FeatureGrid";
import { Header } from "./components/layout/Header";
import { TitleBar } from "./components/layout/TitleBar";
import { WindowResizeHandles } from "./components/layout/WindowResizeHandles";
import { AboutDevicePage } from "./components/pages/AboutDevicePage";
import { AppInfoPage } from "./components/pages/AppInfoPage";
import { ControlsPage } from "./components/pages/ControlsPage";
import { DeviceSettingsPage } from "./components/pages/DeviceSettingsPage";
import { DualConnectionPage } from "./components/pages/DualConnectionPage";
import { EqualiserPage } from "./components/pages/EqualiserPage";
import { UltraBassSheet } from "./components/pages/UltraBassSheet";
import { useDeviceStore } from "./store/useDeviceStore";

export const App: React.FC = () => {
  const {
    route,
    preferences,
    errorBanner,
    statusToast,
    clearError,
    initialize,
  } = useDeviceStore();

  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [preferences.theme]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let active = true;

    void initialize().then((fn) => {
      if (active) {
        cleanup = fn;
      } else {
        fn();
      }
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, [initialize]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--nx-bg)] text-[var(--nx-text)] overflow-hidden relative">
      <WindowResizeHandles />
      <TitleBar />

      {errorBanner ? (
        <div className="px-6 md:px-10 mt-2 shrink-0 max-w-[1680px] mx-auto w-full">
          <div className="px-4 py-2.5 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/45 flex items-center justify-between gap-3 text-xs text-[var(--nx-text)]">
            <span className="leading-snug">{errorBanner}</span>
            <button
              type="button"
              onClick={clearError}
              className="shrink-0 opacity-75 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {route === "home" ? (
        <main className="flex-1 flex flex-col min-h-0">
          <Header />
          <div className="flex-1 overflow-y-auto overflow-x-hidden nothing-scroll px-4 sm:px-6 xl:px-10 pb-4 md:pb-6 xl:pb-8">
            <div className="max-w-[1680px] mx-auto w-full min-h-full grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 xl:gap-5 items-stretch">
              <div className="md:col-span-5 xl:col-span-4 min-w-0 flex flex-col gap-3.5 sm:gap-4 xl:gap-5 min-h-0">
                <DeviceHero />
                <AncCard />
              </div>

              <div className="md:col-span-7 xl:col-span-8 min-w-0 min-h-0">
                <FeatureGrid />
              </div>
            </div>
          </div>
        </main>
      ) : route === "equaliser" ? (
        <EqualiserPage />
      ) : route === "controls" ? (
        <ControlsPage />
      ) : route === "dualConnection" ? (
        <DualConnectionPage />
      ) : route === "deviceSettings" ? (
        <DeviceSettingsPage />
      ) : route === "aboutDevice" ? (
        <AboutDevicePage />
      ) : (
        <AppInfoPage />
      )}

      <UltraBassSheet />
      <AddDeviceModal />

      {statusToast ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[var(--nx-elevated)] border border-[var(--nx-border)] text-xs text-[var(--nx-text)] shadow-xl pointer-events-none">
          {statusToast}
        </div>
      ) : null}
    </div>
  );
};

export default App;
