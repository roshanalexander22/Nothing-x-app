import React from "react";
import { useDeviceStore } from "../../store/useDeviceStore";
import { ToggleSwitch } from "../device/ToggleSwitch";
import { SubPageLayout } from "../layout/SubPageLayout";

export const DualConnectionPage: React.FC = () => {
  const {
    device,
    setRoute,
    setDualConnection,
    setDualDeviceLink,
    refreshDualDevices,
  } = useDeviceStore();

  return (
    <SubPageLayout
      title="Dual Connection"
      onBack={() => setRoute("home")}
      rightAction={
        <button
          type="button"
          onClick={() => void refreshDualDevices()}
          className="px-3.5 py-1.5 rounded-full bg-[var(--nx-card)] hover:bg-[var(--nx-card-hover)] border border-[var(--nx-border)] text-xs text-[var(--nx-text)] cursor-pointer"
        >
          Refresh
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[24px] p-5 xl:p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-medium text-[var(--nx-text)]">
              Dual Connection
            </h3>
            <p className="text-xs text-[var(--nx-muted)] mt-1 leading-relaxed">
              Connect CMF Buds 2a simultaneously to two devices (such as this PC
              and your smartphone).
            </p>
          </div>

          <ToggleSwitch
            checked={device.dualConnectionEnabled}
            label="Toggle Dual Connection"
            onChange={(next) => void setDualConnection(next)}
          />
        </div>

        <div className="lg:col-span-7">
          <h3 className="text-[13px] font-medium text-[var(--nx-text-soft)] mb-2.5 px-1">
            Paired Devices
          </h3>

          {device.dualDevices.length === 0 ? (
            <div className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[24px] p-5 text-xs text-[var(--nx-muted)] leading-relaxed">
              No multi-point device list reported yet. Click Refresh to query the
              earbuds over RFCOMM.
            </div>
          ) : (
            <div className="space-y-2.5">
              {device.dualDevices.map((entry) => (
                <div
                  key={entry.mac}
                  className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[24px] px-5 py-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          entry.isConnected
                            ? "bg-[#22C55E]"
                            : "bg-[var(--nx-muted)]"
                        }`}
                      />
                      <span className="text-[15px] text-[var(--nx-text)] font-medium truncate">
                        {entry.name || entry.mac}
                      </span>
                      {entry.isSelf ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--nx-elevated)] text-[var(--nx-text)]">
                          THIS PC
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs font-mono text-[var(--nx-muted)] mt-1 pl-4">
                      {entry.mac} · {entry.isConnected ? "Connected" : "Idle"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={entry.isSelf}
                    onClick={() =>
                      void setDualDeviceLink(entry.mac, !entry.isConnected)
                    }
                    style={
                      !entry.isConnected
                        ? {
                            backgroundColor: "var(--nx-active-bg)",
                            color: "var(--nx-active-text)",
                          }
                        : undefined
                    }
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      entry.isConnected
                        ? "bg-[var(--nx-elevated)] hover:bg-[var(--nx-elevated-hover)] text-[var(--nx-text)]"
                        : "hover:opacity-90"
                    }`}
                  >
                    {entry.isConnected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SubPageLayout>
  );
};
