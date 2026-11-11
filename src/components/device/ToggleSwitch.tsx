import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  stopPropagation?: boolean;
  label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  stopPropagation = false,
  label = "Toggle setting",
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      style={{
        backgroundColor: checked ? "var(--nx-toggle-on)" : "var(--nx-toggle-off)",
      }}
      className={`relative inline-flex items-center w-[46px] h-[26px] rounded-full p-[3px] transition-colors duration-200 focus:outline-none ${
        disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span
        style={{ backgroundColor: "var(--nx-toggle-knob)" }}
        className={`w-[20px] h-[20px] rounded-full transition-transform duration-200 shadow-sm ${
          checked ? "translate-x-[20px]" : "translate-x-0"
        }`}
      />
    </button>
  );
};
