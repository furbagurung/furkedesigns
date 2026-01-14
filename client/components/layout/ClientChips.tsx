"use client";

import React, { useEffect, useRef } from "react";
import { createDragScroll } from "@/lib/dragScroll";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
      "shrink-0 max-w-50 rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
,
        active
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

type DragApi = ReturnType<typeof createDragScroll>;

export default function ClientChips({
  clients,
  activeClient,
  setActiveClient,
}: {
  clients: string[];
  activeClient: string;
  setActiveClient: (v: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // ✅ store drag handlers in a ref (not state)
  const dragRef = useRef<DragApi | null>(null);

  // ✅ init after mount (safe)
  useEffect(() => {
    dragRef.current = createDragScroll(() => wrapRef.current, {
      desktopOnly: true,
      momentum: true,
      axisLock: true,
      lockThreshold: 6,
      friction: 0.94,
    });

    return () => {
      dragRef.current?.destroy?.();
    };
  }, []);

  const drag = dragRef.current;

  return (
    <div className="relative px-4 pb-3">
      {/* right edge fade */}
      <div className="pointer-events-none absolute right-4 top-0 h-full w-16 bg-gradient-to-l from-white via-white/80 to-transparent" />

      <div
        ref={wrapRef}
        // ✅ only attach handlers if ready
        onPointerDown={drag?.onPointerDown}
        onPointerMove={drag?.onPointerMove}
        onPointerUp={drag?.onPointerUp}
        onPointerCancel={drag?.onPointerUp}
        className="flex data-no-drag
 items-center gap-2 overflow-x-auto no-scrollbar select-none cursor-default md:cursor-grab"
      >
        <div onClickCapture={(e) => drag?.stopClickIfDragged(e)}>
          <Chip
            label="All"
            active={activeClient === "All"}
            onClick={() => setActiveClient("All")}
          />
        </div>

        {clients.map((c) => (
          <div key={c} onClickCapture={(e) => drag?.stopClickIfDragged(e)}>
            <Chip
              label={c}
              active={activeClient === c}
              onClick={() => setActiveClient(c)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
