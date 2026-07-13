"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-center font-sans">
        <h1 className="text-xl font-bold text-ink-900">เกิดข้อผิดพลาดบางอย่าง</h1>
        <p className="text-sm text-ink-500">ทีมงานได้รับแจ้งปัญหานี้แล้ว กรุณาลองใหม่อีกครั้ง</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
        >
          ลองใหม่อีกครั้ง
        </button>
      </body>
    </html>
  );
}
