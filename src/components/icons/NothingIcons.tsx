import React from "react";

interface IconProps {
  className?: string;
}

export const BackArrowIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
  </svg>
);

export const ChevronDotsIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
    <circle cx="5.5" cy="4" r="1" />
    <circle cx="8" cy="6" r="1" />
    <circle cx="10.5" cy="8" r="1" />
    <circle cx="8" cy="10" r="1" />
    <circle cx="5.5" cy="12" r="1" />
  </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
    <path d="M9.2 1.5 3.5 9h4.1l-.8 5.5L12.5 7H8.4l.8-5.5Z" />
  </svg>
);

export const MiniBudsIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <circle cx="9.2" cy="10" r="3.4" fill="#1E1E21" />
    <rect x="8.2" y="10" width="3.2" height="10" rx="1.6" fill="#2B2B30" />
    <circle cx="18.8" cy="10" r="3.4" fill="#1E1E21" />
    <rect x="16.6" y="10" width="3.2" height="10" rx="1.6" fill="#2B2B30" />
  </svg>
);

export const AncActiveIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5.5 14.5a6.5 6.5 0 0 1 13 0"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <circle cx="12" cy="15" r="2" fill="currentColor" />
  </svg>
);

export const TransparencyIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="5.5" cy="15" r="1.15" />
    <circle cx="6.2" cy="11.6" r="1.15" />
    <circle cx="8.5" cy="9" r="1.15" />
    <circle cx="12" cy="8" r="1.15" />
    <circle cx="15.5" cy="9" r="1.15" />
    <circle cx="17.8" cy="11.6" r="1.15" />
    <circle cx="18.5" cy="15" r="1.15" />
    <circle cx="12" cy="15" r="1.9" />
  </svg>
);

export const AncOffIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5.5 15a6.5 6.5 0 0 1 8.5-6.18M17.6 11.45A6.5 6.5 0 0 1 18.5 15"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path d="M5.5 6.5 18.5 19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const EqualiserIcon: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 28 28" fill="currentColor" className={className}>
    <circle cx="4" cy="14" r="1.1" />
    <rect x="6.6" y="10.5" width="2" height="7" rx="1" />
    <rect x="10.2" y="7" width="2" height="14" rx="1" />
    <rect x="13.8" y="10.5" width="2" height="8" rx="1" />
    <circle cx="14.8" cy="6.5" r="1" />
    <circle cx="18.2" cy="10" r="1" />
    <circle cx="18.2" cy="14.2" r="1" />
    <circle cx="18.2" cy="18.4" r="1" />
    <circle cx="21.6" cy="7.5" r="1" />
    <circle cx="21.6" cy="11.5" r="1" />
    <circle cx="21.6" cy="15.5" r="1" />
  </svg>
);

export const ControlsIcon: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <circle cx="9" cy="10.5" r="1.05" fill="currentColor" />
    <circle cx="11" cy="7.5" r="1.05" fill="currentColor" />
    <circle cx="14.5" cy="7.5" r="1.05" fill="currentColor" />
    <circle cx="16.5" cy="10.5" r="1.05" fill="currentColor" />
    <path
      d="M12.5 18V10.8a1.3 1.3 0 0 1 2.6 0V15l4.4 1.3a2 2 0 0 1 1.4 2.4l-.8 3.6a2.5 2.5 0 0 1-2.4 1.9h-5a3 3 0 0 1-2.4-1.2l-2.8-3.6a1.4 1.4 0 0 1 2.1-1.8l2.9 2.4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const DualConnectionIcon: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <path
      d="m14 6 8.5 4.5L14 15l-8.5-4.5L14 6Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 15.5 14 20l8.5-4.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DeviceSettingsIcon: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="1.65" />
    <circle cx="14" cy="14" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="14" cy="5.5" r="1.1" fill="currentColor" />
    <circle cx="14" cy="22.5" r="1.1" fill="currentColor" />
    <circle cx="5.5" cy="14" r="1.1" fill="currentColor" />
    <circle cx="22.5" cy="14" r="1.1" fill="currentColor" />
    <circle cx="8" cy="8" r="1.1" fill="currentColor" />
    <circle cx="20" cy="8" r="1.1" fill="currentColor" />
    <circle cx="8" cy="20" r="1.1" fill="currentColor" />
    <circle cx="20" cy="20" r="1.1" fill="currentColor" />
  </svg>
);

export const InfoCircleIcon: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <circle cx="14" cy="14" r="8.2" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="14" cy="10.2" r="1.15" fill="currentColor" />
    <path d="M14 13.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const DownloadTrayIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.65" />
    <path
      d="M12 8v6.5m0 0-2.7-2.7M12 14.5l2.7-2.7M8.5 16.5h7"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FeedbackBubbleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4.5 7.5A3 3 0 0 1 7.5 4.5h9a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H11l-4 3v-3H7.5a3 3 0 0 1-3-3v-6Z"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinejoin="round"
    />
    <circle cx="9.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="12" cy="10.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="10.5" r="1" fill="currentColor" />
  </svg>
);

export const HelpBracketIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M6.5 6.5h-1a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 5.5 17.5h1M17.5 6.5h1A1.5 1.5 0 0 1 20 8v8a1.5 1.5 0 0 1-1.5 1.5h-1"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="4.8" stroke="currentColor" strokeWidth="1.55" />
    <circle cx="12" cy="9.8" r="0.85" fill="currentColor" />
    <path d="M12 11.8v2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const WarrantyBadgeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3.5 14.3 5l2.7-.2.9 2.6 2.3 1.4-.4 2.7 1.3 2.3-1.7 2-.4 2.7-2.6.6-1.9 1.9-2.4-1-2.4 1-1.9-1.9-2.6-.6-.4-2.7-1.7-2 1.3-2.3-.4-2.7 2.3-1.4.9-2.6L9.7 5 12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinejoin="round"
    />
    <path
      d="m9.2 12.2 2 2 3.8-4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const UserAgreementIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.5 9h7M8.5 12h4.5M14.5 15.2l1.2 1.2 2.3-2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PrivacyShieldIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 19.5H7.5a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3V11"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M8.5 9h7M8.5 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M16.5 13.5 19.5 14.7v2.4c0 1.8-1.2 3-3 3.7-1.8-.7-3-1.9-3-3.7v-2.4l3-1.2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const TermsCardIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" />
    <path d="M12 10h4.5M8 14h8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const OpenSourceCodeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="m8.5 8.5-3.5 3.5 3.5 3.5M15.5 8.5l3.5 3.5-3.5 3.5M13.2 7.5l-2.4 9"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ImprovementChartIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5.5 12.5 11.5 7h3m0 0-2-2m2 2-2 2"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 18.5v-2M10 18.5v-4M13.5 18.5v-6M17 18.5v-8.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const NothingXPillMark: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <g transform="rotate(45 32 32)">
      <rect x="14" y="24" width="36" height="16" rx="8" fill="#3A3A3D" fillOpacity="0.7" />
    </g>
    <g transform="rotate(-45 32 32)">
      <rect x="14" y="24" width="36" height="16" rx="8" fill="#FFFFFF" stroke="var(--nx-border)" strokeWidth="1.2" />
      <circle cx="42" cy="32" r="5" fill="#D71921" />
    </g>
  </svg>
);

