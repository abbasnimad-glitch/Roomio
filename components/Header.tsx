import Link from "next/link";
import { Heart, MessageCircle, User, Coffee } from "lucide-react";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import { getMyProfile, getMyNotifications, getUnreadNotificationCount } from "@/lib/queries";

export default async function Header() {
  const profile = await getMyProfile();
  const [notifications, unreadCount] = profile
    ? await Promise.all([getMyNotifications(), getUnreadNotificationCount()])
    : [[], 0];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 focus-ring rounded-lg">
          <Logo />
          <span className="text-lg font-semibold tracking-tight text-ink-900">Roomio</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/dorm" className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 focus-ring">
            Dormitories
          </Link>
          <Link href="/houses" className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 focus-ring">
            Rental Houses
          </Link>
          <Link href="/services" className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 focus-ring">
            Local Services
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/support"
            className="hidden rounded-full p-2 text-ink-700 hover:bg-ink-100 focus-ring sm:inline-flex"
            aria-label="สนับสนุน Roomio"
            title="สนับสนุน Roomio (ค่าน้ำชา)"
          >
            <Coffee className="h-5 w-5" />
          </Link>
          <Link
            href="/favorites"
            className="hidden rounded-full p-2 text-ink-700 hover:bg-ink-100 focus-ring sm:inline-flex"
            aria-label="Favorites"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/messages"
            className="hidden rounded-full p-2 text-ink-700 hover:bg-ink-100 focus-ring sm:inline-flex"
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          {profile && (
            <NotificationBell userId={profile.id} initialNotifications={notifications} initialUnreadCount={unreadCount} />
          )}
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100 focus-ring"
            >
              <User className="h-4 w-4" />
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
