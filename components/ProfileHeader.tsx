"use client";

import type { Profile } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ProfileHeader({ profile }: { profile: Profile }) {
  const { t, locale } = useLanguage();
  const memberSince = new Date(profile.created_at).toLocaleDateString(locale === "th" ? "th-TH" : "en-US");

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">
        {t.profile.greeting} {profile.full_name}
      </h1>
      <p className="mt-1 text-sm text-ink-500">{t.profile.subtitle}</p>
      <p className="mt-1 text-xs text-ink-400">
        {t.profile.memberSince} {memberSince}
      </p>
    </div>
  );
}
