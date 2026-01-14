"use client";

import { useRef } from "react";
import { SearchIcon } from "@/components/ui/icons";
import ClientChips from "@/components/layout/ClientChips";

export default function TopBar({
  query,
  setQuery,
  clients,
  activeClient,
  setActiveClient,
}: {
  query: string;
  setQuery: (v: string) => void;
  clients: string[];
  activeClient: string;
  setActiveClient: (v: string) => void;
}) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <div className="flex w-full items-center gap-2 rounded-full bg-neutral-100 px-4 py-3">
          <SearchIcon />
          <input
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <ClientChips
        clients={clients}
        activeClient={activeClient}
        setActiveClient={setActiveClient}
      />
    </div>
  );
}
