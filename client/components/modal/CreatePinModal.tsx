"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { UploadIllustrationIcon } from "@/components/ui/icons";
import type { PinMeta } from "@/app/page";

const CREATE_NEW_CLIENT_VALUE = "__create_new_client__";

export default function CreatePinModal({
  open,
  onClose,
  API,
  clients,
  setClients,
  onPublished,
  onRefresh,
  toast,
  setActiveClient,
}: {
  open: boolean;
  onClose: () => void;
  API: string;
  clients: string[];
  setClients: (next: string[]) => void;
  onPublished: (filename: string, meta: PinMeta) => void;
  onRefresh: () => Promise<void>;
  toast: (type: "success" | "error", msg: string) => void;
  setActiveClient: (v: string) => void;
}) {
  const [isClosing, setIsClosing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [client, setClient] = useState<string>("Other");
  const [publishing, setPublishing] = useState(false);

  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  // ---------- open init ----------
  useEffect(() => {
    if (!open) return;
    setIsClosing(false);

    // pick a safe default client when modal opens
    setClient((prev) => prev || clients[0] || "Other");
    setIsCreatingClient(false);
    setNewClientName("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ---------- lock body scroll + ESC close ----------
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (publishing) return;
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, publishing]);

  // ---------- preview url cleanup ----------
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function resetFields() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle("");
    setClient(clients[0] || "Other");
    setDragActive(false);
    setPublishing(false);
    setIsCreatingClient(false);
    setNewClientName("");
  }

  function close() {
    if (publishing) return; // don’t close mid-upload
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      resetFields();
      onClose();
    }, 180);
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  function handleFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    const img = arr.find((f) => f.type.startsWith("image/"));
    if (!img) {
      toast("error", "Please choose an image file (jpg, png, webp, gif).");
      return;
    }
    setSelectedFile(img);
  }

  async function publish() {
    if (!selectedFile) return;
    setPublishing(true);

    try {
      const form = new FormData();
      form.append("image", selectedFile);
      form.append("title", title);
      form.append("client", client);

      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      const filename: string = data.filename;

      const meta: PinMeta = {
        title: title?.trim() || filename,
        client,
        createdAt: Date.now(),
      };

      onPublished(filename, meta);
      await onRefresh();

      toast("success", "Pin published");
      setActiveClient(client);

      // close nicely
      setIsClosing(true);
      window.setTimeout(() => {
        setIsClosing(false);
        resetFields();
        onClose();
      }, 180);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast("error", msg);
    } finally {
      setPublishing(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* backdrop */}
      <button
        type="button"
        onClick={close}
        className="absolute inset-0 bg-black/40"
        aria-label="Close modal backdrop"
      />

      {/* modal wrapper */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={[
            "relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl",
            "transition-[transform,opacity] duration-200 ease-out",
            isClosing
              ? "opacity-0 translate-y-2 scale-[0.97]"
              : "opacity-100 translate-y-0 scale-100",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          {/* header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <div className="text-sm font-semibold text-neutral-900">
              Create Pin
            </div>
            <button
              type="button"
              onClick={close}
              disabled={publishing}
              className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[380px_1fr]">
            {/* LEFT: uploader */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.currentTarget.value = "";
                }}
              />

              {!selectedFile ? (
                <div
                  onClick={pickFile}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                  }}
                  className={[
                    "cursor-pointer rounded-[28px] border-2 border-dashed p-6",
                    "flex h-[520px] items-center justify-center text-center",
                    "bg-neutral-100 transition",
                    dragActive
                      ? "border-neutral-900 bg-neutral-200/60"
                      : "border-neutral-300 hover:border-neutral-400",
                  ].join(" ")}
                >
                  <div className="space-y-4">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-neutral-400 text-neutral-800 bg-white">
                      <UploadIllustrationIcon />
                    </div>

                    <div className="text-sm font-semibold text-neutral-900">
                      {dragActive
                        ? "Drop to upload"
                        : "Choose a file or drag and drop it here"}
                    </div>

                    <div className="text-xs text-neutral-600">
                      High-quality .jpg recommended (under 20 MB).
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] bg-neutral-50 p-3">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[22px] bg-white">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      disabled={publishing}
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-100 disabled:opacity-40"
                    >
                      Change
                    </button>
                    <div className="text-xs text-neutral-600 truncate max-w-[220px]">
                      {selectedFile.name}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: fields */}
            <div className="flex flex-col gap-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add your title"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"
              />

              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-700">
                  Client
                </div>

                <select
                  value={isCreatingClient ? CREATE_NEW_CLIENT_VALUE : client}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === CREATE_NEW_CLIENT_VALUE) {
                      setIsCreatingClient(true);
                      setNewClientName("");
                      return;
                    }
                    setIsCreatingClient(false);
                    setClient(v);
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-900"
                >
                  {clients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={CREATE_NEW_CLIENT_VALUE}>
                    + Create new client…
                  </option>
                </select>

                {isCreatingClient && (
                  <div className="flex gap-2">
                    <input
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Enter client name"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const name = newClientName.trim();
                        if (!name) return;

                        const next = Array.from(new Set([name, ...clients]));
                        setClients(next);

                        setClient(name);
                        setIsCreatingClient(false);
                        setNewClientName("");
                      }}
                      className="shrink-0 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={publish}
                  disabled={!selectedFile || publishing}
                  className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
