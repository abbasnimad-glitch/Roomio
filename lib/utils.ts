import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBaht(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function publicImageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

// Great-circle distance between two lat/lng points, in kilometers.
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Supabase Auth returns technical, English-only error messages. This maps the
// common ones to friendly Thai text; anything unrecognized falls back to a
// generic message instead of leaking raw provider text to the user.
const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  "Invalid login credentials": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "User already registered": "อีเมลนี้มีผู้ใช้งานแล้ว กรุณาเข้าสู่ระบบแทน",
  "Email not confirmed": "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ",
  "Email rate limit exceeded": "มีการร้องขอมากเกินไป กรุณาลองใหม่อีกครั้งภายหลัง",
  "New password should be different from the old password.": "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
  "Password should be at least 6 characters.": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
  "Unable to validate email address: invalid format": "รูปแบบอีเมลไม่ถูกต้อง",
  "For security purposes, you can only request this after some time.": "เพื่อความปลอดภัย กรุณารอสักครู่ก่อนลองใหม่อีกครั้ง",
  "Auth session missing!": "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
};

export function translateAuthError(message: string): string {
  return AUTH_ERROR_TRANSLATIONS[message] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

// Trims text to a max length for meta descriptions, preserving whole words where possible.
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

// A listing counts as "currently featured" only while is_featured is true
// AND it hasn't passed its expiry (or has no expiry set at all).
export function isCurrentlyFeatured(isFeatured: boolean, featuredUntil: string | null): boolean {
  if (!isFeatured) return false;
  if (!featuredUntil) return true;
  return new Date(featuredUntil).getTime() > Date.now();
}

// A listing counts as "currently boosted" only while is_boosted is true AND
// now() falls within [boostStartAt, boostEndAt] (either bound may be
// null/open-ended).
export function isCurrentlyBoosted(isBoosted: boolean, boostStartAt: string | null, boostEndAt: string | null): boolean {
  if (!isBoosted) return false;
  const now = Date.now();
  if (boostStartAt && new Date(boostStartAt).getTime() > now) return false;
  if (boostEndAt && new Date(boostEndAt).getTime() <= now) return false;
  return true;
}
