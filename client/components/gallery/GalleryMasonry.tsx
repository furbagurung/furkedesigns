"use client";

import Masonry from "react-masonry-css";
import type { Img, PinMetaMap } from "@/app/page";
import PinCard from "@/components/gallery/PinCard";

export default function GalleryMasonry({
  images,
  metaMap,
  clients,
  onCreateClient,
  onSaveToClient,
}: {
  images: Img[];
  metaMap: PinMetaMap;
  clients: string[];
  onCreateClient: (name: string) => void;
  onSaveToClient: (filename: string, client: string) => void;
}) {
  const breakpointCols = {
    default: 10,
    1920: 9,
    1600: 8,
    1400: 7,
    1200: 6,
    1024: 5,
    768: 4,
    640: 3,
    480: 2,
    0: 1,
  };

  return (
    <section className="px-2 py-4">
      <Masonry
        breakpointCols={breakpointCols}
        className="-ml-2 flex w-auto"
        columnClassName="pl-2"
      >
        {images.map((img) => (
          <PinCard
            key={img.filename}
            img={img}
            meta={metaMap[img.filename]}
            clients={clients}
            onCreateClient={onCreateClient}
            onSaveToClient={onSaveToClient}
          />
        ))}
      </Masonry>
    </section>
  );
}
