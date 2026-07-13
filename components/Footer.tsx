import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-100 bg-ink-100/40">
      <div className="container-app grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-base font-semibold">Roomio</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-500">
            Helping people find dormitories, rental houses, and trusted local service providers
            across Songkhla Province.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li><Link href="/dorm" className="hover:text-ink-900">Dormitories</Link></li>
            <li><Link href="/houses" className="hover:text-ink-900">Rental houses</Link></li>
            <li><Link href="/services" className="hover:text-ink-900">Local services</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">For owners</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li><Link href="/dashboard/owner" className="hover:text-ink-900">List your property</Link></li>
            <li><Link href="/auth/register?role=service_provider" className="hover:text-ink-900">Become a service provider</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li><Link href="/about" className="hover:text-ink-900">About Roomio</Link></li>
            <li><Link href="/contact" className="hover:text-ink-900">Contact</Link></li>
            <li><Link href="/support" className="hover:text-ink-900">สนับสนุน Roomio (ค่าน้ำชา) ☕</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 py-6 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Roomio. Made for Songkhla Province.
      </div>
    </footer>
  );
}
