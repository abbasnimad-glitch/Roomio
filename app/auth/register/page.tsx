"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/utils";

type SignupRole = "user" | "owner" | "service_provider";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

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
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
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

  async function handleOAuth(provider: "google" | "facebook") {
    if (!agreed) return;
    setOauthLoading(provider);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: role !== "user" ? { role } : undefined,
      },
    });
    if (error) {
      setError(translateAuthError(error.message));
      setOauthLoading(null);
    }
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

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-100" />
          <span className="text-xs text-ink-400">หรือ</span>
          <div className="h-px flex-1 bg-ink-100" />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null || !agreed}
            className="flex items-center justify-center gap-2 rounded-full border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-100 disabled:opacity-60 focus-ring"
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "กำลังเชื่อมต่อ…" : "สมัครสมาชิกด้วย Google"}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("facebook")}
            disabled={oauthLoading !== null || !agreed}
            className="flex items-center justify-center gap-2 rounded-full border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-100 disabled:opacity-60 focus-ring"
          >
            <FacebookIcon />
            {oauthLoading === "facebook" ? "กำลังเชื่อมต่อ…" : "สมัครสมาชิกด้วย Facebook"}
          </button>
        </div>
        {!agreed && (
          <p className="mt-2 text-center text-[11px] text-ink-400">กรุณาติ๊กยอมรับข้อตกลงก่อนสมัครด้วย Google/Facebook</p>
        )}

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
