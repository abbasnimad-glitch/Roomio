import type { RoomType, ServiceCategory, AvailabilityStatus, GenderPolicy, PropertyType, ListingStatus, BoostPaymentStatus } from "@/types/database";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  dormitory: "Dormitory",
  rental_house: "Rental house",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export const LISTING_STATUS_COLORS: Record<ListingStatus, string> = {
  pending: "bg-accent-50 text-accent-600",
  approved: "bg-secondary-50 text-secondary-600",
  rejected: "bg-red-50 text-red-600",
  archived: "bg-ink-100 text-ink-500",
};

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

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  single: "Single room",
  shared: "Shared room",
  studio: "Studio",
  one_bedroom: "1 bedroom",
  two_bedroom: "2 bedroom",
  whole_house: "Whole house",
};

export const GENDER_POLICY_LABELS: Record<GenderPolicy, string> = {
  any: "Any gender",
  male_only: "Male only",
  female_only: "Female only",
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  almost_full: "Almost full",
  full: "Full",
};

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  available: "bg-secondary-50 text-secondary-600",
  almost_full: "bg-accent-50 text-accent-600",
  full: "bg-ink-100 text-ink-500",
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  electrician: "Electrician",
  aircon_repair: "Air conditioner repair",
  appliance_repair: "Appliance repair",
  plumber: "Plumber",
  general_technician: "General technician",
};

export const SERVICE_CATEGORY_ICONS: Record<ServiceCategory, string> = {
  electrician: "Zap",
  aircon_repair: "Wind",
  appliance_repair: "Wrench",
  plumber: "Droplets",
  general_technician: "Hammer",
};

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
