import React, { useRef } from "react";
import { useAnimatedPresence } from "../../lib/useMotion";

export interface DialogMessage {
  title: string;
  body: string;
}

interface InfoDialogProps {
  dialog: DialogMessage | null;
  buttonLabel?: string;
  onClose: () => void;
}

export const InfoDialog: React.FC<InfoDialogProps> = ({
  dialog,
  buttonLabel = "Close",
  onClose,
}) => {
  const { mounted, closing } = useAnimatedPresence(Boolean(dialog));
  const lastDialogRef = useRef<DialogMessage | null>(null);
  if (dialog) {
    lastDialogRef.current = dialog;
  } else if (!mounted) {
    lastDialogRef.current = null;
  }

  const activeDialog = dialog ?? lastDialogRef.current;
  if (!mounted || !activeDialog) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 ${
        closing ? "nx-backdrop-exit" : "nx-backdrop-enter"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[400px] bg-[var(--nx-modal)] border border-[var(--nx-border)] rounded-[24px] p-5 shadow-2xl ${
          closing ? "nx-modal-exit" : "nx-modal-enter"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-serif text-xl text-[var(--nx-text)]">
          {activeDialog.title}
        </h4>
        <p className="text-xs text-[var(--nx-text-soft)] whitespace-pre-line leading-relaxed mt-3">
          {activeDialog.body}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-full bg-[var(--nx-active-bg)] text-[var(--nx-active-text)] text-xs font-medium cursor-pointer hover:opacity-90"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};
