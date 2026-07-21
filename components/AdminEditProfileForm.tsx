"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/types/database";
import { adminUpdateProfile } from "@/lib/actions/admin-profile";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminEditProfileForm({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await adminUpdateProfile(profile.id, formData);
      setMessage({ text: result.message, ok: result.success });
    });
  }

  return (
    <div className="rounded-2xl border border-accent-200 bg-accent-50/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">โหมดแอดมิน — แก้ไขข้อมูลผู้ใช้</p>
      <form action={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.profile.displayNameLabel}</label>
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
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.profile.lineId}</label>
          <input
            name="line_id"
            defaultValue={profile.line_id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.profile.facebookUrl}</label>
          <input
            name="facebook_url"
            type="url"
            defaultValue={profile.facebook_url ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.profile.instagramUrl}</label>
          <input
            name="instagram_url"
            type="url"
            defaultValue={profile.instagram_url ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-60 focus-ring"
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
