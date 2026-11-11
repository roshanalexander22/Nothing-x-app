import React from "react";

export interface StackedItem {
  id: string;
  label: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onClick?: () => void;
}

interface StackedCardProps {
  items: StackedItem[];
  className?: string;
}

export const StackedCard: React.FC<StackedCardProps> = ({
  items,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-[2px] ${className}`}>
      {items.map((item, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        const radiusClass =
          isFirst && isLast
            ? "rounded-[22px]"
            : isFirst
            ? "rounded-t-[22px] rounded-b-[4px]"
            : isLast
            ? "rounded-t-[4px] rounded-b-[22px]"
            : "rounded-[4px]";

        const Wrapper = item.onClick ? "button" : "div";

        return (
          <Wrapper
            key={item.id}
            {...(item.onClick
              ? { type: "button" as const, onClick: item.onClick }
              : {})}
            className={`w-full bg-[var(--nx-card)] border border-[var(--nx-border)] ${
              item.onClick
                ? "hover:bg-[var(--nx-card-hover)] active:scale-[0.992] cursor-pointer"
                : ""
            } ${radiusClass} px-5 py-4 flex items-center justify-between gap-3 text-left transition-[background-color,transform] duration-150 ease-out`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {item.icon ? (
                <span className="text-[var(--nx-text)] shrink-0">
                  {item.icon}
                </span>
              ) : null}
              <div className="min-w-0">
                <div className="text-[15px] text-[var(--nx-text)] font-normal truncate">
                  {item.label}
                </div>
                {item.subtitle ? (
                  <div className="text-[13px] text-[var(--nx-muted)] mt-0.5 truncate">
                    {item.subtitle}
                  </div>
                ) : null}
              </div>
            </div>

            {item.value ? (
              <span className="text-[14px] text-[var(--nx-muted)] shrink-0 text-right">
                {item.value}
              </span>
            ) : null}

            {item.rightElement ? (
              <span className="shrink-0 text-[var(--nx-muted)]">
                {item.rightElement}
              </span>
            ) : null}
          </Wrapper>
        );
      })}
    </div>
  );
};
