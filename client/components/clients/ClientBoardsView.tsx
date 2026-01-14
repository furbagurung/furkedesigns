"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Img = { filename: string; url: string; width: number; height: number };
type PinMeta = { title: string; client: string; createdAt: number };
type PinMetaMap = Record<string, PinMeta>;

function BoardMenu({
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-2 top-10 z-20 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
    >
      <button
        type="button"
        onClick={onEdit}
        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-neutral-100"
      >
        Delete
      </button>
    </div>
  );
}

function BoardCover4({ urls, label }: { urls: string[]; label: string }) {
  // Pinterest-ish: 1 big + 3 small
  const a = urls[0] || "";
  const b = urls[1] || "";
  const c = urls[2] || "";
  const d = urls[3] || "";

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100">
      <div className="grid h-full w-full grid-cols-3 gap-[2px] bg-white">
        {/* Left big */}
        <div className="col-span-2 relative overflow-hidden bg-neutral-100">
          {a ? (
            <Image
              src={a}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>

        {/* Right stack 3 */}
        <div className="grid grid-rows-3 gap-[2px] bg-white">
          {[b, c, d].map((u, idx) => (
            <div key={idx} className="relative overflow-hidden bg-neutral-100">
              {u ? (
                <Image
                  src={u}
                  alt={label}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* subtle overlay on hover handled by parent */}
    </div>
  );
}

export default function ClientBoardsView({
  clients,
  images,
  metaMap,
  onOpenClient,
  onCreateClient,
  onRenameClient,
  onDeleteClient,
}: {
  clients: string[];
  images: Img[];
  metaMap: PinMetaMap;
  onOpenClient: (client: string) => void;
  onCreateClient: (name: string) => void;
  onRenameClient: (from: string, to: string) => void;
  onDeleteClient: (name: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const [menuFor, setMenuFor] = useState<string | null>(null);

  const [renameFor, setRenameFor] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const pinsByClient = useMemo(() => {
    const map = new Map<string, Img[]>();
    for (const c of clients) map.set(c, []);
    for (const img of images) {
      const client = metaMap[img.filename]?.client;
      if (!client) continue;
      if (!map.has(client)) map.set(client, []);
      map.get(client)!.push(img);
    }
    return map;
  }, [clients, images, metaMap]);

  function top4Urls(client: string) {
    const pins = pinsByClient.get(client) || [];
    // newest first (based on meta)
    const sorted = [...pins].sort((a, b) => {
      const ma = metaMap[a.filename]?.createdAt || 0;
      const mb = metaMap[b.filename]?.createdAt || 0;
      return mb - ma;
    });
    return sorted.slice(0, 4).map((p) => p.url);
  }

  function count(client: string) {
    return (pinsByClient.get(client) || []).length;
  }

  function openCreate() {
    setCreateOpen(true);
    setNewName("");
  }

  function submitCreate() {
    const name = newName.trim();
    if (!name) return;
    onCreateClient(name);
    setCreateOpen(false);
  }

  function startRename(client: string) {
    setMenuFor(null);
    setRenameFor(client);
    setRenameValue(client);
  }

  function submitRename() {
    const from = renameFor;
    const to = renameValue.trim();
    if (!from || !to) return;
    if (from === to) {
      setRenameFor(null);
      return;
    }
    onRenameClient(from, to);
    setRenameFor(null);
  }

  return (
    <div className="px-6 py-6">
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
          <p className="text-sm text-neutral-500">Boards like Pinterest</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          + Create new client
        </button>
      </div>

      {/* Create client inline */}
      {createOpen && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">
            Create new client
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Client name (e.g., Rally Gully)"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitCreate}
                className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename inline */}
      {renameFor && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">
            Rename client
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitRename}
                className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setRenameFor(null)}
                className="rounded-xl bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-200"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Tip: renaming keeps pins, but their metadata will be moved to the
            new client name.
          </div>
        </div>
      )}

      {/* Boards grid */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {clients.map((client) => {
          const urls = top4Urls(client);
          const n = count(client);

          return (
            <div key={client} className="relative">
              {/* CLICKABLE CARD (NOT a button) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onOpenClient(client)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpenClient(client);
                }}
                className="group w-full text-left  cursor-pointer select-none"
              >
                <div className="relative">
                  <BoardCover4 urls={urls} label={client}   />

                  {/* hover darken */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/0 transition group-hover:bg-black/5" />

                  {/* menu button */}
                  <div className="absolute right-2 top-2 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuFor((prev) => (prev === client ? null : client));
                      }}
                      className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-white"
                      aria-label="Board menu"
                      title="Board menu"
                    >
                      •••
                    </button>

                    <BoardMenu
                      open={menuFor === client}
                      onClose={() => setMenuFor(null)}
                      onEdit={() => startRename(client)}
                      onDelete={() => {
                        setMenuFor(null);
                        const ok = window.confirm(`Delete client "${client}"?`);
                        if (ok) onDeleteClient(client);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <div className="truncate text-sm font-semibold text-neutral-900">
                    {client}
                  </div>
                  <div className="text-xs text-neutral-500">{n} pins</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
