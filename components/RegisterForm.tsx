"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/utils";

type SignupRole = "user" | "owner" | "service_provider";

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as SignupRole) ?? "user";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignupRole>(
    ["user", "owner", "service_provider"].includes(initialRole) ? initialRole : "user"
  );
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role },
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    });
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
          <h1 className="text-xl font-bold text-ink-900">ตรวจสอบอีเมลของคุณ</h1>
          <p className="mt-2 text-sm text-ink-500">เราส่งลิงก์ยืนยันตัวตนไปที่ {email} แล้ว</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 p-8 shadow-card">
        <h1 className="text-xl font-bold text-ink-900">สมัครสมาชิก Roomio</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-ink-700">สมัครในฐานะ</label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: "user", label: "ผู้ใช้ทั่วไป" },
                  { key: "owner", label: "เจ้าของที่พัก" },
                  { key: "service_provider", label: "ผู้ให้บริการ" },
                ] as { key: SignupRole; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRole(opt.key)}
                  className={`rounded-full border px-2 py-1.5 text-xs font-medium transition ${
                    role === opt.key
                      ? "border-primary bg-primary-50 text-primary-600"
                      : "border-ink-300 text-ink-700 hover:bg-ink-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-700">ชื่อ-นามสกุล</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-700">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              required
              placeholder="08XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
            />
          </div>
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
          <div>
            <label className="text-xs font-semibold text-ink-700">รหัสผ่าน</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
            />
            <p className="mt-1 text-[11px] text-ink-400">อย่างน้อย 8 ตัวอักษร</p>
          </div>

          <label className="flex items-start gap-2 text-xs text-ink-600">
            <input
              type="checkbox"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span>
              ฉันได้อ่านและยอมรับ{" "}
              <Link href="/terms" target="_blank" className="font-medium text-primary-600 underline">
                ข้อตกลงการใช้งาน
              </Link>{" "}
              และ{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-primary-600 underline">
                นโยบายความเป็นส่วนตัว
              </Link>{" "}
              ของ Roomio
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !agreed}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
          >
            {loading ? "กำลังสร้างบัญชี…" : "สมัครสมาชิก"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          มีบัญชีอยู่แล้ว? <Link href="/auth/login" className="font-medium text-primary-600">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
