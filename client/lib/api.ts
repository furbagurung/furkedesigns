import type { Img } from "@/app/page";

export async function fetchImages(API: string): Promise<Img[]> {
  const res = await fetch(`${API}/api/images`, { cache: "no-store" });
  const data = await res.json();
  return data.images ?? [];
}
