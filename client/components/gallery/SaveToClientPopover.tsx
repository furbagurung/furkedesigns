"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function SaveToClientPopover({
  open,
  anchorRef,
  onClose,
  clients,
  currentClient,
  onSaveToClient,
  onCreateClient,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  clients: string[];
  currentClient: string;
  onSaveToClient: (client: string) => void;
  onCreateClient: (client: string) => void;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);

  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) => c.toLowerCase().includes(s));
  }, [clients, q]);

  // Popover position (fixed, so it won't be clipped)
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // When opening: reset UI + compute position from anchor
   useEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();

      const POP_W = 320;
      const GAP = 10;

      let top = r.bottom + GAP;
      let left = r.left;

      left = Math.max(12, Math.min(left, window.innerWidth - POP_W - 12));

      const estimatedHeight = 420;
      if (top + estimatedHeight > window.innerHeight - 12) {
        top = Math.max(12, r.top - GAP - estimatedHeight);
      }

      setPos({ top, left });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  // close on outside click (but ignore clicks on anchor itself)
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const pop = popRef.current;
      const anchor = anchorRef.current;
      const target = e.target as Node;

      if (!pop) return;
      if (pop.contains(target)) return;
      if (anchor && anchor.contains(target)) return;

      onClose();
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, onClose, anchorRef]);

  // Esc to close
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popRef}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[9999] w-[320px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
      role="dialog"
      aria-modal="true"
    >
      <div className="p-3">
        <div className="text-center text-sm font-semibold text-neutral-900">
          Save
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
          <span className="text-neutral-500">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-3 max-h-[260px] overflow-y-auto pr-1">
          <div className="px-1 pb-2 text-xs font-semibold text-neutral-600">
            All clients
          </div>

          <div className="flex flex-col gap-1">
            {filtered.map((c) => {
              const active = c === currentClient;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onSaveToClient(c);
                    onClose();
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                    "hover:bg-neutral-100",
                    active ? "bg-neutral-100 font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  <span className="truncate">{c}</span>
                  <span className="text-xs text-neutral-500">
                    {active ? "Selected" : "Save"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 border-t border-neutral-200 pt-3">
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-neutral-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-xl">
                +
              </div>
              <span>Create client</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="Client name"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <button
                type="button"
                onClick={() => {
                  const name = newClient.trim();
                  if (!name) return;
                  onCreateClient(name);
                  onSaveToClient(name);
                  onClose();
                }}
                className="shrink-0 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
