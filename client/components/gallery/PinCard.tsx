"use client";

import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
import type { Img, PinMeta } from "@/app/page";
import SaveToClientPopover from "@/components/gallery/SaveToClientPopover";

export default function PinCard({
  img,
  meta,
  clients,
  onSaveToClient,
  onCreateClient,
}: {
  img: Img;
  meta?: PinMeta;
  clients: string[];
  onSaveToClient: (filename: string, client: string) => void;
  onCreateClient: (client: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // ✅ NEW: anchor ref for portal positioning
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const currentClient = meta?.client || "Other";
  const title = meta?.title || img.filename;

  // show overlay only on hover, BUT keep it visible if popover open
  const overlayClass = useMemo(() => {
    return open
      ? "opacity-100 pointer-events-auto"
      : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto";
  }, [open]);

  return (
    <div className="mb-2">
      <div className="group relative overflow-hidden rounded-xl">
        <Image
          src={img.url}
          alt={title}
          width={img.width}
          height={img.height}
          className="w-full rounded-xl transition group-hover:brightness-[0.78]"
          unoptimized
        />

        {/* HOVER OVERLAY */}
        <div className={`absolute inset-0 transition-opacity ${overlayClass}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/10" />

          {/* Top controls */}
          <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-2">
            {/* Dropdown trigger */}
            <div className="relative">
              <button
                ref={anchorRef} // ✅ NEW
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-100"
              >
                <span className="max-w-[140px] truncate">{currentClient}</span>
                <span className="text-[10px]">▾</span>
              </button>

              {/* ✅ Portal popover (NOT inside the pin layout anymore) */}
              <SaveToClientPopover
                key={open ? img.filename : "closed"} // ✅ forces remount when opened
                open={open}
                anchorRef={anchorRef}
                onClose={() => setOpen(false)}
                clients={clients}
                currentClient={currentClient}
                onCreateClient={onCreateClient}
                onSaveToClient={(client) =>
                  onSaveToClient(img.filename, client)
                }
              />
            </div>

            {/* Save button just opens the popover */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Optional title under card */}
      {meta?.title ? (
        <div className="mt-1 px-1 text-xs font-medium text-neutral-800 line-clamp-2">
          {meta.title}
        </div>
      ) : null}
    </div>
  );
}
