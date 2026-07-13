"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/utils";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(translateAuthError(error.message));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="container-app flex min-h-[70vh] items-center justify-center py-12 text-center">
        <div>
          <h1 className="text-xl font-bold text-ink-900">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</h1>
          <p className="mt-2 text-sm text-ink-500">คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที</p>
          <button
            type="button"
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
          >
            ไปที่หน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 p-8 shadow-card">
        <h1 className="text-xl font-bold text-ink-900">ตั้งรหัสผ่านใหม่</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-ink-700">รหัสผ่านใหม่</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-700">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
          >
            {loading ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
