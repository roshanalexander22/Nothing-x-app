import React, { useState } from "react";
import { useDeviceStore } from "../../store/useDeviceStore";
import { ToggleSwitch } from "../device/ToggleSwitch";
import {
  ChevronDotsIcon,
  ImprovementChartIcon,
  NothingXPillMark,
  OpenSourceCodeIcon,
  PrivacyShieldIcon,
  TermsCardIcon,
  UserAgreementIcon,
} from "../icons/NothingIcons";
import { SubPageLayout } from "../layout/SubPageLayout";
import { InfoDialog, type DialogMessage } from "./InfoDialog";
import { StackedCard } from "./StackedCard";

export const AppInfoPage: React.FC = () => {
  const { preferences, setRoute, updatePreferences } = useDeviceStore();
  const [modal, setModal] = useState<DialogMessage | null>(null);

  return (
    <SubPageLayout title="About" onBack={() => setRoute("home")}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div data-flip-id="appinfo-legal" className="lg:col-span-7">
          <StackedCard
            items={[
              {
                id: "user-agreement",
                icon: <UserAgreementIcon className="w-6 h-6" />,
                label: "User Agreement",
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setModal({
                    title: "User Agreement",
                    body: "Nothing X Desktop is an independent local Windows companion for CMF Buds 2a. It communicates exclusively over your local Windows Bluetooth RFCOMM adapter with no cloud login required.",
                  }),
              },
              {
                id: "privacy-policy",
                icon: <PrivacyShieldIcon className="w-6 h-6" />,
                label: "Privacy Policy",
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setModal({
                    title: "Privacy Policy",
                    body: "All preferences (custom nickname, auto-connect, tray preference, theme) stay strictly local in your Windows AppData directory. Zero telemetry or audio data is transmitted over the internet.",
                  }),
              },
              {
                id: "terms",
                icon: <TermsCardIcon className="w-6 h-6" />,
                label: "Terms of service",
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setModal({
                    title: "Terms of Service",
                    body: "This desktop build communicates using documented Classic Bluetooth RFCOMM control frames. OTA firmware flashing is intentionally omitted to protect earbud flash memory.",
                  }),
              },
              {
                id: "licenses",
                icon: <OpenSourceCodeIcon className="w-6 h-6" />,
                label: "OPEN SOURCE LICENSES",
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setModal({
                    title: "Open Source Stack",
                    body: "• Tauri 2.0 (MIT / Apache-2.0)\n• Rust Win32 / WinRT Bluetooth RFCOMM backend\n• React 19, TypeScript, Zustand, Tailwind CSS v4\n• Protocol research inspired by open-source Nothing X reverse-engineering efforts (nothingctl / ear-web / earctl).",
                  }),
              },
            ]}
          />
        </div>

        <div data-flip-id="appinfo-meta" className="lg:col-span-5">
          <h3 className="text-[13px] font-medium text-[var(--nx-text-soft)] mb-2.5 px-1">
            Improvement programme
          </h3>

          <div className="bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[22px] px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <ImprovementChartIcon className="w-6 h-6 text-[var(--nx-text)] shrink-0" />
              <span className="text-[15px] text-[var(--nx-text)] truncate">
                Join improvement programme
              </span>
            </div>
            <ToggleSwitch
              checked={preferences.improvementProgramme}
              label="Join improvement programme"
              onChange={(next) =>
                void updatePreferences({ improvementProgramme: next })
              }
            />
          </div>

          <p className="text-[12px] text-[var(--nx-muted)] leading-relaxed mt-2.5 px-1">
            Your data will be completely anonymized and your identity will not
            be visible to us. Review the details{" "}
            <button
              type="button"
              onClick={() =>
                setModal({
                  title: "Local Diagnostics Note",
                  body: "On this Windows desktop companion, enabling or disabling this preference stores your choice locally; no external analytics endpoints are contacted.",
                })
              }
              className="text-[var(--nx-text)] font-semibold hover:underline cursor-pointer"
            >
              here
            </button>
            .
          </p>

          {/* Bottom Nothing X badge */}
          <div className="mt-8 bg-[var(--nx-card)] border border-[var(--nx-border)] rounded-[24px] py-8 px-5 flex flex-col items-center text-center">
            <NothingXPillMark className="w-12 h-12" />
            <span className="text-[12px] text-[var(--nx-muted)] mt-3 font-mono">
              V 3.10.3
            </span>
            <p className="text-[11px] text-[var(--nx-muted)] mt-1">
              © 2025-2026 Nothing Technology Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <InfoDialog
        dialog={modal}
        buttonLabel="Done"
        onClose={() => setModal(null)}
      />
    </SubPageLayout>
  );
};
