"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HeaderNav({ hasProfile }: { hasProfile: boolean }) {
  const { t, locale, setLocale } = useLanguage();

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        <Link href="/dorm" className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 focus-ring">
          {t.nav.dormitories}
        </Link>
        <Link href="/houses" className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 focus-ring">
          {t.nav.rentalHouses}
        </Link>
        <Link href="/services" className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 focus-ring">
          {t.nav.localServices}
        </Link>
      </nav>

      <button
        type="button"
        onClick={() => setLocale(locale === "th" ? "en" : "th")}
        className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100 focus-ring"
        aria-label="Switch language"
      >
        {locale === "th" ? "EN" : "ไทย"}
      </button>

      {!hasProfile && (
        <Link
          href="/auth/login"
          className="flex items-center gap-2 rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100 focus-ring"
        >
          <User className="h-4 w-4" />
          {t.nav.login}
        </Link>
      )}
    </>
  );
}