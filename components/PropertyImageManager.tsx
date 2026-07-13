"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { publicImageUrl, cn } from "@/lib/utils";

// Structurally compatible with PropertyImage / ReviewImage / service-provider
// image rows — each has these three fields plus a table-specific FK column
// that this component never needs to read directly.
export interface ManagedImage {
  id: string;
  storage_path: string;
  sort_order: number;
}

export default function PropertyImageManager({
  propertyId,
  initialImages,
  bucket = "property-images",
  table = "property_images",
  idColumn = "property_id",
}: {
  propertyId: string;
  initialImages: ManagedImage[];
  /** Storage bucket to upload/replace/delete files in. Defaults to the original property-images bucket. */
  bucket?: string;
  /** DB table holding the image rows. Defaults to the original property_images table. */
  table?: string;
  /** Foreign-key column on that table pointing back to the parent record. Defaults to property_id. */
  idColumn?: string;
}) {
  const [supabase] = useState(() => createClient());
  const [images, setImages] = useState<ManagedImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [imageVersions, setImageVersions] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<ManagedImage | null>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
        if (uploadError) throw uploadError;

        const { data, error: insertError } = await supabase
          .from(table)
          .insert({ [idColumn]: propertyId, storage_path: path, sort_order: images.length })
          .select()
          .single();
        if (insertError) throw insertError;

        setImages((prev) => [...prev, data as ManagedImage]);
      }
    } catch {
      setError("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(image: ManagedImage) {
    setError(null);
    setDeletingId(image.id);
    try {
      const { error: storageError } = await supabase.storage.from(bucket).remove([image.storage_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from(table).delete().eq("id", image.id);
      if (dbError) throw dbError;

      setImages((prev) => prev.filter((i) => i.id !== image.id));
    } catch {
      setError("ลบรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeletingId(null);
    }
  }

  function triggerReplace(image: ManagedImage) {
    replaceTargetRef.current = image;
    replaceInputRef.current?.click();
  }

  async function handleReplaceFileSelected(file: File | null) {
    const target = replaceTargetRef.current;
    if (!file || !target) return;
    if (!file.type.startsWith("image/")) return;

    setError(null);
    setReplacingId(target.id);
    try {
      // Same storage_path, upsert:true — overwrites the file in place so the DB
      // row (and its sort_order) never changes, only the image content does.
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(target.storage_path, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Bust the cached public URL so the new image shows immediately.
      setImageVersions((prev) => ({ ...prev, [target.id]: (prev[target.id] ?? 0) + 1 }));
    } catch {
      setError("แทนที่รูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setReplacingId(null);
      replaceTargetRef.current = null;
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "grid grid-cols-3 gap-3 rounded-xl p-2 transition sm:grid-cols-4",
          isDragging && "bg-primary-50 ring-2 ring-primary-600"
        )}
      >
        {images.map((img) => {
          const version = imageVersions[img.id] ?? 0;
          const src = `${publicImageUrl(bucket, img.storage_path)}${version ? `?v=${version}` : ""}`;
          return (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100">
              <Image src={src} alt="Property photo" fill sizes="200px" className="object-cover" />

              {(deletingId === img.id || replacingId === img.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}

              <div className="absolute right-1.5 top-1.5 flex gap-1">
                <button
                  type="button"
                  onClick={() => triggerReplace(img)}
                  disabled={deletingId === img.id || replacingId === img.id}
                  aria-label="แทนที่รูปนี้"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-card hover:bg-white disabled:opacity-60"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  disabled={deletingId === img.id || replacingId === img.id}
                  aria-label="ลบรูปนี้"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-card hover:bg-white disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-ink-500 hover:bg-ink-100 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-xs">{uploading ? "กำลังอัปโหลด…" : "เพิ่มรูป"}</span>
        </button>
      </div>

      <p className="mt-2 text-xs text-ink-400">ลากรูปมาวางที่นี่ได้ หรือกด &ldquo;เพิ่มรูป&rdquo; เพื่อเลือกไฟล์ (เลือกได้หลายรูปพร้อมกัน)</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleReplaceFileSelected(e.target.files?.[0] ?? null)}
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
