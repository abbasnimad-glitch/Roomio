"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Locale, type TranslationKeys } from "./translations";

const STORAGE_KEY = "roomio_locale";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "th" || stored === "en") {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // Avoid a flash of the wrong language: render nothing extra until we've
  // read the stored preference once on mount. Children still render (SSR
  // content is fine), we just don't want the language to visibly flip.
  const value: LanguageContextValue = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return (
    <LanguageContext.Provider value={value}>
      <div suppressHydrationWarning>{mounted ? children : children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

// Picks the display name for a database record that carries a Thai name
// (nameTh) and an English/fallback name (nameEn), based on the current
// locale. nameTh may be null for records that haven't been translated yet
// (e.g. a university row added before the name_th column was backfilled) —
// in that case we fall back to nameEn regardless of locale, so the UI never
// shows a blank label.
export function localizedName(locale: Locale, nameTh: string | null | undefined, nameEn: string): string {
  if (locale === "th" && nameTh) return nameTh;
  return nameEn;
}