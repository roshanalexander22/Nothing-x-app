import React, { useRef } from "react";
import { useLayoutFlip } from "../../lib/useMotion";
import { BackArrowIcon } from "../icons/NothingIcons";

interface SubPageLayoutProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export const SubPageLayout: React.FC<SubPageLayoutProps> = ({
  title,
  onBack,
  rightAction,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutFlip(contentRef);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--nx-bg)]">
      <div className="px-6 md:px-10 pt-4 pb-3 shrink-0 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-2 p-2 rounded-full text-[var(--nx-text)] hover:bg-[var(--nx-elevated)] active:scale-95 transition-[background-color,transform] duration-150 cursor-pointer"
          >
            <BackArrowIcon className="w-6 h-6" />
          </button>
          {rightAction ? <div>{rightAction}</div> : null}
        </div>
        <h1 className="font-serif text-[30px] md:text-[34px] leading-tight tracking-tight text-[var(--nx-text)] mt-2">
          {title}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden nothing-scroll px-6 md:px-10 pb-8">
        <div
          ref={contentRef}
          className="relative max-w-[1440px] mx-auto w-full"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
