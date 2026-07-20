"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, Heart, MessageCircle, Coffee, Building2, Home as HomeIcon, Wrench, UserPlus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function MobileMenuButton({ hasProfile }: { hasProfile: boolean }) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll while the drawer is open, restore on close/unmount.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawer = (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-white p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-900">{locale === "th" ? "เมนู" : "Menu"}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-ink-700 hover:bg-ink-100 focus-ring"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          <Link
            href="/dorm"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <Building2 className="h-4 w-4" /> {t.nav.dormitories}
          </Link>
          <Link
            href="/houses"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <HomeIcon className="h-4 w-4" /> {t.nav.rentalHouses}
          </Link>
          <Link
            href="/services"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <Wrench className="h-4 w-4" /> {t.nav.localServices}
          </Link>

          <div className="my-2 h-px bg-ink-100" />

          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <Heart className="h-4 w-4" /> {t.nav.favorites}
          </Link>
          <Link
            href="/messages"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <MessageCircle className="h-4 w-4" /> {t.nav.messages}
          </Link>
          <Link
            href="/support"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <Coffee className="h-4 w-4" /> {locale === "th" ? "สนับสนุน Roomio" : "Support Roomio"}
          </Link>

          {!hasProfile && (
            <>
              <div className="my-2 h-px bg-ink-100" />
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
              >
                <UserPlus className="h-4 w-4" /> {t.nav.register}
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-full p-2 text-ink-700 hover:bg-ink-100 focus-ring md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
