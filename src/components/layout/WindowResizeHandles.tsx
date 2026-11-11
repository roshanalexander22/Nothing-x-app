import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriRuntime } from "../../lib/tauri";

type ResizeDirection =
  | "North"
  | "South"
  | "East"
  | "West"
  | "NorthEast"
  | "NorthWest"
  | "SouthEast"
  | "SouthWest";

interface ResizeEdgeConfig {
  direction: ResizeDirection;
  className: string;
}

const RESIZE_HANDLES: ResizeEdgeConfig[] = [
  { direction: "North", className: "top-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { direction: "South", className: "bottom-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { direction: "West", className: "top-2 bottom-2 left-0 w-1.5 cursor-ew-resize" },
  { direction: "East", className: "top-2 bottom-2 right-0 w-1.5 cursor-ew-resize" },
  { direction: "NorthWest", className: "top-0 left-0 w-3 h-3 cursor-nwse-resize" },
  { direction: "NorthEast", className: "top-0 right-0 w-3 h-3 cursor-nesw-resize" },
  { direction: "SouthWest", className: "bottom-0 left-0 w-3 h-3 cursor-nesw-resize" },
  { direction: "SouthEast", className: "bottom-0 right-0 w-3 h-3 cursor-nwse-resize" },
];

export const WindowResizeHandles: React.FC = () => {
  if (!isTauriRuntime()) return null;

  const beginResize = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    void getCurrentWindow().startResizeDragging(direction);
  };

  return (
    <>
      {RESIZE_HANDLES.map((edge) => (
        <div
          key={edge.direction}
          aria-hidden="true"
          onMouseDown={beginResize(edge.direction)}
          className={`fixed z-[70] select-none ${edge.className}`}
        />
      ))}
    </>
  );
};

