"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";
import { publicImageUrl, cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface GalleryImage {
  id: string;
  storage_path: string;
}

export default function PropertyGallery({
  images,
  bucket,
  title,
}: {
  images: GalleryImage[];
  bucket: string;
  title: string;
}) {
  const { t } = useLanguage();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
        {t.gallery.noPhotos}
      </div>
    );
  }

  const visible = images.slice(0, 5);
  const remaining = images.length - visible.length;

  return (
    <>
      <div className={cn("grid gap-2 overflow-hidden rounded-2xl", images.length > 1 && "sm:grid-cols-4 sm:grid-rows-2")}>
        {visible.map((img, i) => (
          <div
            key={img.id}
            className={cn(
              "relative aspect-video cursor-pointer bg-ink-100",
              images.length > 1 && i === 0 && "sm:col-span-2 sm:row-span-2 sm:aspect-auto"
            )}
            onClick={() => setLightboxIndex(i)}
          >
            <Image
              src={publicImageUrl(bucket, img.storage_path)}
              alt={`${title} photo ${i + 1}`}
              fill
              sizes="50vw"
              className="object-cover"
              priority={i === 0}
            />
            {i === visible.length - 1 && remaining > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(i);
                }}
                className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 text-sm font-semibold text-white transition hover:bg-black/60"
              >
                <Grid3x3 className="h-4 w-4" />
                {t.gallery.viewAllPhotos} (+{remaining})
              </button>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          bucket={bucket}
          title={title}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  bucket,
  title,
  startIndex,
  onClose,
}: {
  images: GalleryImage[];
  bucket: string;
  title: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setIndex((i) => (i + 1) % images.length);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-white">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-white hover:bg-white/10 focus-ring"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1">
        <Image
          src={publicImageUrl(bucket, images[index].storage_path)}
          alt={`${title} photo ${index + 1}`}
          fill
          sizes="100vw"
          className="object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus-ring"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus-ring"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2",
                i === index ? "border-white" : "border-transparent opacity-60"
              )}
            >
              <Image src={publicImageUrl(bucket, img.storage_path)} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
