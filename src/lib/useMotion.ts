import { useLayoutEffect, useState } from "react";
import type React from "react";

interface LayoutRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PendingFlip {
  id: string;
  el: HTMLElement;
  prev: LayoutRect;
  next: LayoutRect;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  hadActive: boolean;
}

const FLIP_DURATION_MS = 270;
const FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getLayoutRect(el: HTMLElement, root: HTMLElement): LayoutRect {
  let left = 0;
  let top = 0;
  let curr: HTMLElement | null = el;

  while (curr && curr !== root && root.contains(curr)) {
    left += curr.offsetLeft;
    top += curr.offsetTop;
    curr = curr.offsetParent as HTMLElement | null;
  }

  return {
    left,
    top,
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}

function getVisualRect(el: HTMLElement, root: HTMLElement): LayoutRect {
  const elBox = el.getBoundingClientRect();
  const rootBox = root.getBoundingClientRect();
  return {
    left: elBox.left - rootBox.left,
    top: elBox.top - rootBox.top,
    width: elBox.width,
    height: elBox.height,
  };
}

/**
 * Manages mount/unmount lifecycle for modals & sheets so closed overlays hold
 * zero DOM nodes and zero GPU layers while still animating smoothly in and out.
 */
export function useAnimatedPresence(
  open: boolean,
  exitDurationMs = 170
): { mounted: boolean; closing: boolean } {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useLayoutEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }

    if (!mounted) return;

    const delay = prefersReducedMotion() ? 0 : exitDurationMs;
    if (delay === 0) {
      setMounted(false);
      setClosing(false);
      return;
    }

    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [open, mounted, exitDurationMs]);

  return {
    mounted: mounted || open,
    closing: open ? false : closing,
  };
}

/**
 * Hardware-accelerated FLIP layout transitions for `[data-flip-id]` cards during
 * responsive breakpoint reflows or maximize/restore jumps, with zero DOM clones
 * and zero overhead during smooth continuous border dragging.
 */
export function useLayoutFlip<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>,
  active = true
): void {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!active || !root || typeof ResizeObserver === "undefined") {
      return;
    }

    const lastRects = new Map<string, LayoutRect>();
    const activeAnims = new Map<string, Animation>();
    let prevW = root.clientWidth;
    let prevH = root.clientHeight;
    let rafId = 0;

    const snapshotInitial = () => {
      const elements = root.querySelectorAll<HTMLElement>("[data-flip-id]");
      for (const el of elements) {
        const id = el.dataset.flipId;
        if (!id || (!el.offsetWidth && !el.offsetHeight)) continue;
        lastRects.set(id, getLayoutRect(el, root));
      }
    };

    const runFlip = () => {
      rafId = 0;
      const containerW = root.clientWidth;
      const containerH = root.clientHeight;
      if (containerW === 0 || containerH === 0) return;

      const dContainerW = Math.abs(containerW - prevW);
      const dContainerH = Math.abs(containerH - prevH);
      prevW = containerW;
      prevH = containerH;

      const elements = root.querySelectorAll<HTMLElement>("[data-flip-id]");
      const batch: PendingFlip[] = [];
      let anyReflow = dContainerW > 72 || dContainerH > 72;

      for (const el of elements) {
        const id = el.dataset.flipId;
        if (!id || (!el.offsetWidth && !el.offsetHeight)) continue;

        const next = getLayoutRect(el, root);
        const cachedPrev = lastRects.get(id);
        lastRects.set(id, next);

        if (!cachedPrev) continue;

        const runningAnim = activeAnims.get(id);
        const prev = runningAnim ? getVisualRect(el, root) : cachedPrev;

        const prevCx = prev.left + prev.width / 2;
        const prevCy = prev.top + prev.height / 2;
        const nextCx = next.left + next.width / 2;
        const nextCy = next.top + next.height / 2;

        const dx = prevCx - nextCx;
        const dy = prevCy - nextCy;
        const dw = Math.abs(prev.width - next.width);
        const dh = Math.abs(prev.height - next.height);

        const unexpectedMove =
          Math.abs(cachedPrev.left - next.left) > Math.max(24, dContainerW + 14) ||
          Math.abs(cachedPrev.top - next.top) > Math.max(24, dContainerH + 14);

        if (unexpectedMove) {
          anyReflow = true;
        }

        batch.push({
          id,
          el,
          prev,
          next,
          dx,
          dy,
          dw,
          dh,
          hadActive: Boolean(runningAnim),
        });
      }

      if (!anyReflow || prefersReducedMotion()) {
        return;
      }

      for (const item of batch) {
        if (
          Math.abs(item.dx) < 3 &&
          Math.abs(item.dy) < 3 &&
          item.dw < 6 &&
          item.dh < 6
        ) {
          continue;
        }

        if (item.hadActive) {
          activeAnims.get(item.id)?.cancel();
        }

        const rawSx = item.next.width > 0 ? item.prev.width / item.next.width : 1;
        const rawSy = item.next.height > 0 ? item.prev.height / item.next.height : 1;
        const sx = clamp(rawSx, 0.84, 1.18);
        const sy = clamp(rawSy, 0.84, 1.18);

        if (typeof item.el.animate !== "function") continue;

        const anim = item.el.animate(
          [
            {
              transformOrigin: "center center",
              transform: `translate3d(${item.dx.toFixed(1)}px, ${item.dy.toFixed(
                1
              )}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`,
            },
            {
              transformOrigin: "center center",
              transform: "translate3d(0px, 0px, 0) scale(1, 1)",
            },
          ],
          {
            duration: FLIP_DURATION_MS,
            easing: FLIP_EASING,
          }
        );

        activeAnims.set(item.id, anim);
        anim.onfinish = () => {
          if (activeAnims.get(item.id) === anim) {
            activeAnims.delete(item.id);
          }
        };
        anim.oncancel = () => {
          if (activeAnims.get(item.id) === anim) {
            activeAnims.delete(item.id);
          }
        };
      }
    };

    snapshotInitial();

    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(runFlip);
    });

    ro.observe(root);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      for (const anim of activeAnims.values()) {
        anim.cancel();
      }
      activeAnims.clear();
      lastRects.clear();
    };
  }, [containerRef, active]);
}
