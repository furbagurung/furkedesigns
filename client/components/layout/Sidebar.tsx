"use client";

import React from "react";
import {
  HomeIcon,
  CreateIcon,
  ClientsIcon,
  NotificationIcon,
  MessageIcon,
} from "@/components/ui/icons";

function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={`flex h-12 w-12 items-center justify-center rounded-xl transition cursor-pointer ${
          active
            ? "bg-neutral-900 text-white"
            : "text-neutral-700 hover:bg-neutral-100 hover:scale-105 active:scale-95"
        }`}
        aria-label={label}
        title={label}
      >
        {icon}
      </button>

      <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

export default function Sidebar({
  active,
  onHome,
  onCreate,
  onClients,
}: {
  active: "Home" | "Create" | "Clients" | "Notifications" | "Messages";
  onHome: () => void;
  onCreate: () => void;
  onClients: () => void;
}) {
  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-22 border-r border-neutral-200/40 bg-white">
      <div className="flex h-full flex-col items-center py-6">
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white text-sm font-bold">
          UDS
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem
            icon={<HomeIcon />}
            label="Home"
            active={active === "Home"}
            onClick={onHome}
          />

          <SidebarItem
            icon={<CreateIcon />}
            label="Create"
            active={active === "Create"}
            onClick={onCreate}
          />  

          {/* NEW: Clients (Boards-like) */}
          <SidebarItem
            icon={<ClientsIcon />}
            label="Clients"
            active={active === "Clients"}
            onClick={onClients}
          />

          <SidebarItem
            icon={<NotificationIcon />}
            label="Notifications"
            active={active === "Notifications"}
          />

          <SidebarItem
            icon={<MessageIcon />}
            label="Messages"
            active={active === "Messages"}
          />
        </nav>
      </div>
    </aside>
  );
}
