// lib/dragScroll.ts
import type React from "react";

type GetEl = () => HTMLDivElement | null;

type Options = {
  desktopOnly?: boolean;
  momentum?: boolean;
  axisLock?: boolean;
  lockThreshold?: number;

  /** Base friction for momentum. Final friction is adjusted by container width. */
  baseFriction?: number; // 0.90–0.97
  /** Clamp velocity (px/ms). */
  maxVelocity?: number;

  /** Enable rubber band resistance near edges */
  rubberBand?: boolean;
  /** How strong the resistance is near edges (0.25–0.55 recommended) */
  rubberStrength?: number;

  /** Selector list to ignore drag start on */
  ignoreSelector?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function createDragScroll(getEl: GetEl, opts: Options = {}) {
  const {
    desktopOnly = true,
    momentum = true,
    axisLock = true,
    lockThreshold = 6,

    baseFriction = 0.935,
    maxVelocity = 3.2,

    rubberBand = true,
    rubberStrength = 0.42,

    ignoreSelector = "input,textarea,select,button,a,[data-no-drag]",
  } = opts;

  const state = {
    isDown: false,
    dragging: false,
    axis: "pending" as "pending" | "horizontal" | "vertical",
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    dragged: false,

    raf: 0 as number | 0,
    lastX: 0,
    lastT: 0,
    v: 0, // px/ms
  };

  const isFinePointer =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: fine)").matches;

  function enabled() {
    return desktopOnly ? isFinePointer : true;
  }

  function cancelMomentum() {
    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
  }

  function shouldIgnoreStart(e: React.PointerEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement | null;
    if (!t) return false;
    return !!t.closest(ignoreSelector);
  }

  /** Resistance factor when near edges (Pinterest-y “rubber band” feel) */
  function edgeResistance(el: HTMLDivElement, desiredScrollLeft: number) {
    const max = el.scrollWidth - el.clientWidth;

    // if content doesn't overflow, no drag-scroll
    if (max <= 0) return { scrollLeft: 0, factor: 0 };

    // Rubber band only when trying to go beyond edges
    if (!rubberBand) return { scrollLeft: clamp(desiredScrollLeft, 0, max), factor: 1 };

    // Within bounds: normal
    if (desiredScrollLeft >= 0 && desiredScrollLeft <= max) {
      return { scrollLeft: desiredScrollLeft, factor: 1 };
    }

    // Past bounds: clamp but reduce effective movement (“resistance”)
    // resistance increases as you pull further past boundary
    const over = desiredScrollLeft < 0 ? -desiredScrollLeft : desiredScrollLeft - max;

    // scale based on container width so it feels consistent across sizes
    const width = Math.max(240, el.clientWidth);
    const normalized = clamp(over / (width * 0.35), 0, 1);

    // factor goes down as over-scroll increases
    const factor = 1 - normalized * rubberStrength; // e.g., 1 -> 0.58
    const clamped = clamp(desiredScrollLeft, 0, max);

    return { scrollLeft: clamped, factor: clamp(factor, 0.25, 1) };
  }

  /** Adjust friction by container width: wider row glides longer */
  function frictionForWidth(el: HTMLDivElement) {
    const w = Math.max(320, el.clientWidth);

    // map 320px -> 0.90, 1400px+ -> 0.965 (longer glide)
    const t = clamp((w - 320) / (1400 - 320), 0, 1);
    const widthFriction = 0.9 + t * 0.065;

    // mix with base friction
    return clamp(baseFriction * 0.5 + widthFriction * 0.5, 0.88, 0.975);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled()) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (shouldIgnoreStart(e)) return;

    const el = getEl();
    if (!el) return;

    // if no overflow, skip
    if (el.scrollWidth <= el.clientWidth + 2) return;

    cancelMomentum();

    state.isDown = true;
    state.dragging = false;
    state.axis = "pending";
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startScrollLeft = el.scrollLeft;
    state.dragged = false;

    state.lastX = e.clientX;
    state.lastT = performance.now();
    state.v = 0;

    // Don't capture yet; wait for axis decision
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled()) return;

    const el = getEl();
    if (!el || !state.isDown) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    // Axis lock
    if (axisLock && state.axis === "pending") {
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (adx < lockThreshold && ady < lockThreshold) return;

      if (adx > ady + 2) {
        state.axis = "horizontal";
        state.dragging = true;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {}
        el.classList.add("cursor-grabbing");
      } else {
        // allow page vertical scroll
        state.axis = "vertical";
        state.isDown = false;
        state.dragging = false;
        return;
      }
    }

    if (axisLock && state.axis !== "horizontal") return;

    state.dragging = true;

    if (Math.abs(dx) > 3) state.dragged = true;

    // Desired scroll
    const desired = state.startScrollLeft - dx;

    // Rubber band resistance
    const { scrollLeft: nextScroll, factor } = edgeResistance(el, desired);
    el.scrollLeft = nextScroll;

    // Velocity for momentum (reduce velocity when resistance is active)
    const now = performance.now();
    const dt = Math.max(1, now - state.lastT);
    const vx = (e.clientX - state.lastX) / dt; // px/ms

    // smooth + damp by resistance factor near edges
    const dampedV = vx * factor;

    state.v = state.v * 0.8 + dampedV * 0.2;
    state.v = clamp(state.v, -maxVelocity, maxVelocity);

    state.lastX = e.clientX;
    state.lastT = now;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled()) return;

    const el = getEl();
    if (!el) return;

    const wasDragging = state.dragging;

    state.isDown = false;
    state.dragging = false;

    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}

    el.classList.remove("cursor-grabbing");

    // Momentum (desktop)
    if (momentum && wasDragging) {
      const startV = state.v;
      if (Math.abs(startV) < 0.05) return;

      const fr = frictionForWidth(el);

      const step = () => {
        const el2 = getEl();
        if (!el2) return;

        const max = el2.scrollWidth - el2.clientWidth;

        // Stop if no overflow
        if (max <= 0) {
          state.raf = 0;
          return;
        }

        // apply velocity
        const next = el2.scrollLeft - state.v * 16;

        // add edge resistance during momentum too (so it gently stops)
        const { scrollLeft, factor } = edgeResistance(el2, next);
        el2.scrollLeft = scrollLeft;

        // decay velocity; stronger decay when hitting edges
        state.v *= fr * (0.92 + factor * 0.08);

        if (Math.abs(state.v) > 0.02) {
          state.raf = requestAnimationFrame(step);
        } else {
          state.raf = 0;
        }
      };

      state.raf = requestAnimationFrame(step);
    }
  }

  function stopClickIfDragged(e: React.MouseEvent) {
    if (state.dragged) {
      e.preventDefault();
      e.stopPropagation();
      state.dragged = false;
    }
  }

  function destroy() {
    cancelMomentum();
  }

  return { onPointerDown, onPointerMove, onPointerUp, stopClickIfDragged, destroy };
}
