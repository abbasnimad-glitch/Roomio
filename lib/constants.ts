import type { RoomType, ServiceCategory, AvailabilityStatus, GenderPolicy, PropertyType, ListingStatus, BoostPaymentStatus } from "@/types/database";
import type { Locale } from "@/lib/i18n/translations";

// ------------------------------------------------------------
// Bilingual label maps. Each map holds both languages; the
// getXLabels(locale) helpers below pick the right one at render time.
// Keeping the original ALL-CAPS constant names as English-only fallbacks
// would invite someone to import the wrong one by habit, so those names
// now point at the locale-aware getters instead — see usage note below.
// ------------------------------------------------------------

const PROPERTY_TYPE_LABELS_TH: Record<PropertyType, string> = {
  dormitory: "หอพัก",
  rental_house: "บ้านเช่า",
};
const PROPERTY_TYPE_LABELS_EN: Record<PropertyType, string> = {
  dormitory: "Dormitory",
  rental_house: "Rental house",
};
export function getPropertyTypeLabels(locale: Locale): Record<PropertyType, string> {
  return locale === "th" ? PROPERTY_TYPE_LABELS_TH : PROPERTY_TYPE_LABELS_EN;
}

const LISTING_STATUS_LABELS_TH: Record<ListingStatus, string> = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ถูกปฏิเสธ",
  archived: "เก็บถาวร",
};
const LISTING_STATUS_LABELS_EN: Record<ListingStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};
export function getListingStatusLabels(locale: Locale): Record<ListingStatus, string> {
  return locale === "th" ? LISTING_STATUS_LABELS_TH : LISTING_STATUS_LABELS_EN;
}

export const LISTING_STATUS_COLORS: Record<ListingStatus, string> = {
  pending: "bg-accent-50 text-accent-600",
  approved: "bg-secondary-50 text-secondary-600",
  rejected: "bg-red-50 text-red-600",
  archived: "bg-ink-100 text-ink-500",
};

// Already Thai-only in the original file, kept as-is (not locale-switched
// yet — boost payments UI hasn't been localized in this pass).
export const BOOST_PAYMENT_STATUS_LABELS: Record<BoostPaymentStatus, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  failed: "ล้มเหลว",
};

export const BOOST_PAYMENT_STATUS_COLORS: Record<BoostPaymentStatus, string> = {
  pending: "bg-accent-50 text-accent-600",
  paid: "bg-secondary-50 text-secondary-600",
  failed: "bg-red-50 text-red-600",
};

const ROOM_TYPE_LABELS_TH: Record<RoomType, string> = {
  single: "ห้องเดี่ยว",
  shared: "ห้องรวม",
  studio: "สตูดิโอ",
  one_bedroom: "1 ห้องนอน",
  two_bedroom: "2 ห้องนอน",
  whole_house: "บ้านทั้งหลัง",
};
const ROOM_TYPE_LABELS_EN: Record<RoomType, string> = {
  single: "Single room",
  shared: "Shared room",
  studio: "Studio",
  one_bedroom: "1 bedroom",
  two_bedroom: "2 bedroom",
  whole_house: "Whole house",
};
export function getRoomTypeLabels(locale: Locale): Record<RoomType, string> {
  return locale === "th" ? ROOM_TYPE_LABELS_TH : ROOM_TYPE_LABELS_EN;
}

const GENDER_POLICY_LABELS_TH: Record<GenderPolicy, string> = {
  any: "ไม่จำกัดเพศ",
  male_only: "ชายเท่านั้น",
  female_only: "หญิงเท่านั้น",
};
const GENDER_POLICY_LABELS_EN: Record<GenderPolicy, string> = {
  any: "Any gender",
  male_only: "Male only",
  female_only: "Female only",
};
export function getGenderPolicyLabels(locale: Locale): Record<GenderPolicy, string> {
  return locale === "th" ? GENDER_POLICY_LABELS_TH : GENDER_POLICY_LABELS_EN;
}

const AVAILABILITY_LABELS_TH: Record<AvailabilityStatus, string> = {
  available: "ว่าง",
  almost_full: "เหลือน้อย",
  full: "เต็ม",
};
const AVAILABILITY_LABELS_EN: Record<AvailabilityStatus, string> = {
  available: "Available",
  almost_full: "Almost full",
  full: "Full",
};
export function getAvailabilityLabels(locale: Locale): Record<AvailabilityStatus, string> {
  return locale === "th" ? AVAILABILITY_LABELS_TH : AVAILABILITY_LABELS_EN;
}

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  available: "bg-secondary-50 text-secondary-600",
  almost_full: "bg-accent-50 text-accent-600",
  full: "bg-ink-100 text-ink-500",
};

const SERVICE_CATEGORY_LABELS_TH: Record<ServiceCategory, string> = {
  electrician: "ช่างไฟฟ้า",
  aircon_repair: "ซ่อมแอร์",
  appliance_repair: "ซ่อมเครื่องใช้ไฟฟ้า",
  plumber: "ช่างประปา",
  general_technician: "ช่างทั่วไป",
};
const SERVICE_CATEGORY_LABELS_EN: Record<ServiceCategory, string> = {
  electrician: "Electrician",
  aircon_repair: "Air conditioner repair",
  appliance_repair: "Appliance repair",
  plumber: "Plumber",
  general_technician: "General technician",
};
export function getServiceCategoryLabels(locale: Locale): Record<ServiceCategory, string> {
  return locale === "th" ? SERVICE_CATEGORY_LABELS_TH : SERVICE_CATEGORY_LABELS_EN;
}

export const SERVICE_CATEGORY_ICONS: Record<ServiceCategory, string> = {
  electrician: "Zap",
  aircon_repair: "Wind",
  appliance_repair: "Wrench",
  plumber: "Droplets",
  general_technician: "Hammer",
};

// ------------------------------------------------------------
// Backward-compatible English-only exports.
// Several existing components (mostly ones not yet localized, e.g. admin
// dashboards) still import these directly instead of calling the getX
// functions above. Keeping them means those files keep compiling and
// showing English labels until they're localized in a future pass —
// switching them to Thai here would be a silent behavior change for
// screens nobody has looked at yet.
// ------------------------------------------------------------
export const PROPERTY_TYPE_LABELS = PROPERTY_TYPE_LABELS_EN;
export const LISTING_STATUS_LABELS = LISTING_STATUS_LABELS_EN;
export const ROOM_TYPE_LABELS = ROOM_TYPE_LABELS_EN;
export const GENDER_POLICY_LABELS = GENDER_POLICY_LABELS_EN;
export const AVAILABILITY_LABELS = AVAILABILITY_LABELS_EN;
export const SERVICE_CATEGORY_LABELS = SERVICE_CATEGORY_LABELS_EN;

// ------------------------------------------------------------
// Loyalty / membership tiers
// ------------------------------------------------------------
export interface LoyaltyTier {
  key: "bronze" | "silver" | "gold";
  label: string;
  min: number;
  discountPercent: number;
  colorClass: string; // tailwind text/bg color stem, e.g. "amber"
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { key: "bronze", label: "ทองแดง", min: 0, discountPercent: 0, colorClass: "amber" },
  { key: "silver", label: "เงิน", min: 300, discountPercent: 5, colorClass: "slate" },
  { key: "gold", label: "ทอง", min: 800, discountPercent: 10, colorClass: "yellow" },
];

export function tierForPoints(points: number): LoyaltyTier {
  let current = LOYALTY_TIERS[0];
  for (const tier of LOYALTY_TIERS) {
    if (points >= tier.min) current = tier;
  }
  return current;
}

export function nextTierForPoints(points: number): { tier: LoyaltyTier; remaining: number } | null {
  const idx = LOYALTY_TIERS.findIndex((t) => t.key === tierForPoints(points).key);
  if (idx === LOYALTY_TIERS.length - 1) return null;
  const next = LOYALTY_TIERS[idx + 1];
  return { tier: next, remaining: next.min - points };
}

// Boost Plan — the only plan for now: 7 days of boosted placement for a flat price.
export const BOOST_PLAN = {
  days: 7,
  priceTHB: 100,
} as const;
// Manual contact channel for Boost/Premium payments while the in-app
// payment UI (Stripe/PromptPay QR) is disabled — real payment requests
// now happen entirely off this deployment via Messenger, with the admin
// manually activating the boost through BoostControl after confirming.
// Update this one constant if the Facebook Page changes.
export const BOOST_CONTACT_LINK = "https://m.me/61591871262085";