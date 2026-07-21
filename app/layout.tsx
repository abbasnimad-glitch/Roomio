import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Roomio — Dormitories, Rental Houses & Local Services in Songkhla",
    template: "%s | Roomio",
  },
  description:
    "Find dormitories, rental houses, and trusted local service providers in Songkhla Province, Thailand — all in one place.",
  manifest: "/manifest.json",
  verification: {
    google: "spZDmdfMybKnqMW_Sq2wkTSW65qD1APzZ4UynmCJVCI",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "Roomio",
    url: "/",
    title: "Roomio — Find your place in Songkhla",
    description:
      "Search dormitories, rental houses, and trusted local service providers across Songkhla Province.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roomio — Find your place in Songkhla",
    description:
      "Search dormitories, rental houses, and trusted local service providers across Songkhla Province.",
  },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={poppins.variable}>
      <body className="min-h-screen bg-white font-sans text-ink-900 antialiased">
        <LanguageProvider>
          <Analytics />
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}