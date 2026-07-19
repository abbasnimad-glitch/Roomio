"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { publicImageUrl } from "@/lib/utils";
import { updateMyAvatar } from "@/lib/actions/profile";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AvatarUploader({
  userId,
  initialAvatarUrl,
}: {
  userId: string;
  initialAvatarUrl: string | null;
}) {
  const { t } = useLanguage();
  const [supabase] = useState(() => createClient());
  const [avatarPath, setAvatarPath] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setError(null);
    setUploading(true);
    try {
      // A unique filename per upload (instead of overwriting a fixed path)
      // means the public URL genuinely changes every time, so browsers and
      // any CDN in front of Supabase Storage always fetch the new image
      // instead of serving a stale cached copy at an unchanged URL.
      const ext = file.name.split(".").pop() ?? "jpg";
      const newPath = `${userId}/${crypto.randomUUID()}.${ext}`;
      const previousPath = avatarPath;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(newPath, file);
      if (uploadError) throw uploadError;

      const result = await updateMyAvatar(newPath);
      if (!result.success) throw new Error(result.message);

      setAvatarPath(newPath);

      // Best-effort cleanup of the old file — if it fails (e.g. it never
      // existed, or a race with another upload), the profile still points
      // at the new image, so this is safe to ignore.
      if (previousPath) {
        supabase.storage.from("avatars").remove([previousPath]).catch(() => {});
      }
    } catch {
      setError(t.profile.avatarUploadError);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const src = avatarPath ? publicImageUrl("avatars", avatarPath) : null;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-ink-100">
          {src ? (
            <Image src={src} alt="Avatar" fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-400">
              <UserIcon className="h-8 w-8" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-ink-100 disabled:opacity-60 focus-ring"
        >
          <Camera className="h-3.5 w-3.5" />
          {uploading ? t.common.loading : t.profile.changePhoto}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
