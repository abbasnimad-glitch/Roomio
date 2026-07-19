"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { publicImageUrl } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function UserMenu({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const dashboardHref =
    profile.role === "admin" ? "/dashboard/admin" : profile.role === "owner" ? "/dashboard/owner" : profile.role === "service_provider" ? "/dashboard/provider" : null;

  const avatarSrc = profile.avatar_url ? publicImageUrl("avatars", profile.avatar_url) : null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-ink-300 px-2 py-1.5 text-sm font-medium text-ink-900 hover:bg-ink-100 focus-ring sm:px-3"
      >
        {avatarSrc ? (
          <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-ink-100">
            <Image src={avatarSrc} alt="" fill sizes="24px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600">
            {profile.full_name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate sm:inline">{profile.full_name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-ink-100 bg-white py-1 shadow-lift"
        >
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-100"
          >
            <UserIcon className="h-4 w-4" /> {t.nav.profile}
          </Link>
          {dashboardHref && (
            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-100"
            >
              <LayoutDashboard className="h-4 w-4" /> {t.nav.dashboard}
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-ink-100"
          >
            <LogOut className="h-4 w-4" /> {t.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}
