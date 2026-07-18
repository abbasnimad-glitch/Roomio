"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/types/database";
import { updateMyProfile } from "@/lib/actions/profile";
import AvatarUploader from "@/components/AvatarUploader";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateMyProfile(formData);
      setMessage({ text: result.message, ok: result.success });
    });
  }

  return (
    <div className="rounded-2xl border border-ink-100 p-5">
      <h2 className="text-sm font-semibold text-ink-900">{t.profile.editTitle}</h2>

      <div className="mt-4">
        <AvatarUploader userId={profile.id} initialAvatarUrl={profile.avatar_url} />
      </div>

      <form action={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.auth.fullName}</label>
          <input
            name="full_name"
            required
            defaultValue={profile.full_name}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-700">{t.auth.phone}</label>
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            placeholder="08XXXXXXXX"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-700">{t.profile.lineId}</label>
          <input
            name="line_id"
            defaultValue={profile.line_id ?? ""}
            placeholder={t.profile.lineIdPlaceholder}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-700">{t.profile.facebookUrl}</label>
          <input
            name="facebook_url"
            type="url"
            defaultValue={profile.facebook_url ?? ""}
            placeholder="https://facebook.com/yourpage"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-700">{t.profile.instagramUrl}</label>
          <input
            name="instagram_url"
            type="url"
            defaultValue={profile.instagram_url ?? ""}
            placeholder="https://instagram.com/yourprofile"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
        >
          {isPending ? t.common.loading : t.common.save}
        </button>

        {message && (
          <p className={message.ok ? "text-sm text-secondary-600" : "text-sm text-red-600"}>{message.text}</p>
        )}
      </form>
    </div>
  );
}
