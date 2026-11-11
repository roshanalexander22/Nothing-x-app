import React, { useState } from "react";
import { useDeviceStore } from "../../store/useDeviceStore";
import {
  ChevronDotsIcon,
  DownloadTrayIcon,
  FeedbackBubbleIcon,
  HelpBracketIcon,
  WarrantyBadgeIcon,
} from "../icons/NothingIcons";
import { SubPageLayout } from "../layout/SubPageLayout";
import { InfoDialog, type DialogMessage } from "./InfoDialog";
import { StackedCard } from "./StackedCard";

export const AboutDevicePage: React.FC = () => {
  const { device, setRoute } = useDeviceStore();
  const [dialog, setDialog] = useState<DialogMessage | null>(null);

  return (
    <SubPageLayout title="About" onBack={() => setRoute("home")}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div data-flip-id="about-main" className="lg:col-span-7">
          {/* Firmware update card */}
          <StackedCard
            items={[
              {
                id: "firmware-update",
                icon: <DownloadTrayIcon className="w-6 h-6" />,
                label: "Firmware update",
                subtitle: `Up to date (${device.firmwareVersion})`,
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setDialog({
                    title: "Firmware Update",
                    body: `Current firmware version on your ${device.modelName} is ${device.firmwareVersion}. For hardware safety, OTA firmware flashing is restricted to the official Nothing X mobile app on Android or iOS.`,
                  }),
              },
            ]}
          />

          {/* Device information section */}
          <h3 className="text-[13px] font-medium text-[var(--nx-text-soft)] mt-6 mb-2.5 px-1">
            Device information
          </h3>
          <StackedCard
            items={[
              {
                id: "model",
                label: "Model",
                value: device.deviceName,
              },
              {
                id: "serial",
                label: "Serial number",
                value: device.serialNumber,
              },
              {
                id: "bt-addr",
                label: "Bluetooth address",
                value: device.bluetoothAddress,
              },
              {
                id: "fw-ver",
                label: "Firmware Version",
                value: device.firmwareVersion,
              },
            ]}
          />
        </div>

        {/* Support section */}
        <div data-flip-id="about-support" className="lg:col-span-5">
          <h3 className="text-[13px] font-medium text-[var(--nx-text-soft)] mb-2.5 px-1">
            Support
          </h3>
          <StackedCard
            items={[
              {
                id: "feedback",
                icon: <FeedbackBubbleIcon className="w-6 h-6" />,
                label: "Send feedback",
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setDialog({
                    title: "Send Feedback",
                    body: "This is an unofficial Rust + Tauri Windows companion for CMF Buds 2a (Model B185). To inspect live Classic Bluetooth RFCOMM packets or troubleshoot a command, open Device Settings → Protocol Frame Inspector.",
                  }),
              },
              {
                id: "help",
                icon: <HelpBracketIcon className="w-6 h-6" />,
                label: "Help articles",
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setDialog({
                    title: "Windows Connection Tips",
                    body: "1. Pair CMF Buds 2a in Windows Settings → Bluetooth.\n2. Take both buds out of the case so Windows connects audio.\n3. Ensure the Nothing X phone app isn't actively holding the RFCOMM control channel.\n4. Click the + / Devices button to reconnect if earbuds sleep.",
                  }),
              },
              {
                id: "warranty",
                icon: <WarrantyBadgeIcon className="w-6 h-6" />,
                label: "Warranty status",
                rightElement: <ChevronDotsIcon className="w-4 h-4" />,
                onClick: () =>
                  setDialog({
                    title: "Warranty Status",
                    body: `Serial Number: ${device.serialNumber}\nModel ID: ${device.modelBase} (${device.colorway})\n\nCheck official coverage on cmf.tech / nothing.tech/support using your serial number.`,
                  }),
              },
            ]}
          />
        </div>
      </div>

      <InfoDialog dialog={dialog} onClose={() => setDialog(null)} />
    </SubPageLayout>
  );
};
