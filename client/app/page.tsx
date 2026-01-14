"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import GalleryMasonry from "@/components/gallery/GalleryMasonry";
import CreatePinModal from "@/components/modal/CreatePinModal";
import Toast, { ToastState } from "@/components/ui/Toast";
import { fetchImages } from "@/lib/api";
import ClientBoardsView from "@/components/clients/ClientBoardsView";

import {
  loadClients,
  loadMeta,
  saveClients,
  saveMetaMap,
  DEFAULT_CLIENTS,
} from "@/lib/pinStorage";

export type Img = {
  filename: string;
  url: string;
  width: number;
  height: number;
};
export type PinMeta = { title: string; client: string; createdAt: number };
export type PinMetaMap = Record<string, PinMeta>;

export default function Page() {
  const API = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000",
    []
  );

  const [toast, setToast] = useState<ToastState>(null);
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), 2500);
  };

  const [images, setImages] = useState<Img[]>([]);
  const [query, setQuery] = useState("");
  const [activeClient, setActiveClient] = useState("All");
  const [metaMap, setMetaMap] = useState<PinMetaMap>({});
  const [clients, setClients] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<
    "Home" | "Create" | "Clients" | "Notifications" | "Messages"
  >("Home");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function refreshImages() {
    const data = await fetchImages(API);
    setImages(data);
  }
  function openCreate() {
    setActiveMenu("Create");
    setIsCreateOpen(true);
  }

  function closeCreate() {
    setIsCreateOpen(false);
    setActiveMenu("Home"); // ✅ THIS IS THE KEY
  }
  useEffect(() => {
    // meta
    setMetaMap(loadMeta());

    // clients
    const saved = loadClients();
    const merged = Array.from(new Set([...saved, ...DEFAULT_CLIENTS]));
    setClients(merged);
    saveClients(merged);

    // images
    refreshImages().catch(() => showToast("error", "Failed to load images"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  const filtered = images
    .filter((i) =>
      query ? i.filename.toLowerCase().includes(query.toLowerCase()) : true
    )
    .filter((i) => {
      if (activeClient === "All") return true;
      return metaMap[i.filename]?.client === activeClient;
    });

  return (
    <div className="min-h-screen bg-white">
      <Toast toast={toast} />

      <Sidebar
        active={activeMenu}
        onHome={() => setActiveMenu("Home")}
        onCreate={() => {
          setActiveMenu("Create");
          setIsCreateOpen(true); // ✅ open modal
        }}
        onClients={() => setActiveMenu("Clients")}
      />
      <main className="pl-[88px]">
        {activeMenu === "Clients" ? (
          <ClientBoardsView
            clients={clients}
            images={images}
            metaMap={metaMap}
            onOpenClient={(c) => {
              setActiveClient(c);
              setActiveMenu("Home");
            }}
            onCreateClient={(name) => {
              const next = Array.from(new Set([name, ...clients]));
              setClients(next);
              saveClients(next);
            }}
            onRenameClient={(from, to) => {
              // rename client list
              const nextClients = clients.map((c) => (c === from ? to : c));
              const uniqClients = Array.from(new Set(nextClients));
              setClients(uniqClients);
              saveClients(uniqClients);

              // update pin metadata
              const nextMeta = { ...metaMap };
              for (const k of Object.keys(nextMeta)) {
                if (nextMeta[k]?.client === from) {
                  nextMeta[k] = { ...nextMeta[k], client: to };
                }
              }
              setMetaMap(nextMeta);
              saveMetaMap(nextMeta);

              // keep active client in sync
              if (activeClient === from) setActiveClient(to);
            }}
            onDeleteClient={(name) => {
              // remove client
              const nextClients = clients.filter((c) => c !== name);
              setClients(nextClients);
              saveClients(nextClients);

              // move pins to "Other"
              const nextMeta = { ...metaMap };
              for (const k of Object.keys(nextMeta)) {
                if (nextMeta[k]?.client === name) {
                  nextMeta[k] = { ...nextMeta[k], client: "Other" };
                }
              }
              setMetaMap(nextMeta);
              saveMetaMap(nextMeta);

              // reset filter if needed
              if (activeClient === name) setActiveClient("All");
            }}
          />
        ) : (
          <>
            <TopBar
              query={query}
              setQuery={setQuery}
              clients={clients}
              activeClient={activeClient}
              setActiveClient={setActiveClient}
            />
            <GalleryMasonry
              images={filtered}
              metaMap={metaMap}
              clients={clients}
              onCreateClient={(name) => {
                const next = Array.from(new Set([name, ...clients]));
                setClients(next);
                saveClients(next);
              }}
              onSaveToClient={(filename, client) => {
                const prev = metaMap[filename];
                const nextMeta = {
                  ...metaMap,
                  [filename]: {
                    title: prev?.title || filename,
                    client,
                    createdAt: prev?.createdAt || Date.now(),
                  },
                };
                setMetaMap(nextMeta);
                saveMetaMap(nextMeta);
              }}
            />
          </>
        )}
      </main>

      <CreatePinModal
        open={isCreateOpen}
        onClose={closeCreate}
        API={API}
        clients={clients}
        setClients={(next) => {
          setClients(next);
          saveClients(next);
        }}
        onPublished={(filename, meta) => {
          const next = { ...metaMap, [filename]: meta };
          setMetaMap(next);
          saveMetaMap(next);
        }}
        onRefresh={async () => {
          await refreshImages();
        }}
        toast={showToast}
        setActiveClient={setActiveClient}
      />
    </div>
  );
}
