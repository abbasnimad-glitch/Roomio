"use client";

import { useState } from "react";
import { Facebook } from "lucide-react";

export default function ShareButton({ title, refId }: { title: string; refId?: string }) {
  const [copied, setCopied] = useState(false);

  function getShareUrl() {
    const url = new URL(window.location.href);
    if (refId) url.searchParams.set("ref", refId);
    return url.toString();
  }

  async function shareToFacebook() {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can fail (permissions, non-HTTPS) — not fatal, the share dialog still opens.
    }
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500"
    );
  }

  return (
    <button
      type="button"
      onClick={shareToFacebook}
      aria-label={`Share ${title} to Facebook`}
      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-card transition hover:scale-105 focus-ring"
    >
      <Facebook className="h-4 w-4" />
      {copied ? "คัดลอกลิงก์แล้ว!" : "Share to Facebook"}
    </button>
  );
}
