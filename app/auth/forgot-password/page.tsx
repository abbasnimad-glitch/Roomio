"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setLoading(false);
    if (error) {
      setError(translateAuthError(error.message));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="container-app flex min-h-[70vh] items-center justify-center py-12 text-center">
        <div>
          <h1 className="text-xl font-bold text-ink-900">ตรวจสอบอีเมลของคุณ</h1>
          <p className="mt-2 text-sm text-ink-500">
            หากมีบัญชีที่ใช้อีเมล {email} เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 p-8 shadow-card">
        <h1 className="text-xl font-bold text-ink-900">ลืมรหัสผ่าน</h1>
        <p className="mt-1 text-sm text-ink-500">กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-ink-700">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
          >
            {loading ? "กำลังส่ง…" : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          <Link href="/auth/login" className="font-medium text-primary-600">กลับไปเข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
