import type { PinMetaMap } from "@/app/page";

export const META_KEY = "pin_meta_v1";
export const CLIENTS_KEY = "pin_clients_v1";

export const DEFAULT_CLIENTS = [
  "Rally Gully",
  "United Digital Service",
  "Decor Sign",
  "Pioneer Fil-Med",
  "SB Group",
  "SMJ Impex",
  "Vamika Homz",
  "Other",
];

export function loadMeta(): PinMetaMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "{}") as PinMetaMap;
  } catch {
    return {};
  }
}

export function saveMetaMap(map: PinMetaMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(META_KEY, JSON.stringify(map));
}

export function loadClients(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

export function saveClients(list: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
}
