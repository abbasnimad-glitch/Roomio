"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { publicImageUrl } from "@/lib/utils";
import type { ReviewImage } from "@/types/database";

export default function ReviewImageUpload({
  reviewId,
  initialImages,
}: {
  reviewId: string;
  initialImages: ReviewImage[];
}) {
  const [supabase] = useState(() => createClient());
  const [images, setImages] = useState<ReviewImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${reviewId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage.from("review-images").upload(path, file);
        if (uploadError) throw uploadError;

        const { data, error: insertError } = await supabase
          .from("review_images")
          .insert({ review_id: reviewId, storage_path: path, sort_order: images.length })
          .select()
          .single();
        if (insertError) throw insertError;

        setImages((prev) => [...prev, data as ReviewImage]);
      }
    } catch {
      setError("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(image: ReviewImage) {
    setError(null);
    setDeletingId(image.id);
    try {
      const { error: storageError } = await supabase.storage.from("review-images").remove([image.storage_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("review_images").delete().eq("id", image.id);
      if (dbError) throw dbError;

      setImages((prev) => prev.filter((i) => i.id !== image.id));
    } catch {
      setError("ลบรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.id} className="group relative h-16 w-16 overflow-hidden rounded-lg bg-ink-100">
            <Image src={publicImageUrl("review-images", img.storage_path)} alt="Review photo" fill sizes="64px" className="object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(img)}
              disabled={deletingId === img.id}
              aria-label="ลบรูปนี้"
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white disabled:opacity-60"
            >
              {deletingId === img.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-ink-300 text-ink-500 hover:bg-ink-100 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="text-[10px]">{uploading ? "..." : "เพิ่มรูป"}</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
