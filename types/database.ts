export type UserRole = "guest" | "user" | "owner" | "service_provider" | "admin";
export type PropertyType = "dormitory" | "rental_house";
export type RoomType =
  | "single"
  | "shared"
  | "studio"
  | "one_bedroom"
  | "two_bedroom"
  | "whole_house";
export type GenderPolicy = "any" | "male_only" | "female_only";
export type AvailabilityStatus = "available" | "almost_full" | "full";
export type ListingStatus = "pending" | "approved" | "rejected" | "archived";
export type ServiceCategory =
  | "electrician"
  | "aircon_repair"
  | "appliance_repair"
  | "plumber"
  | "general_technician";
export type MessageStatus = "unread" | "read";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type PremiumPurchaseType = "featured" | "boost";
export type PremiumPurchaseStatus = "pending" | "active" | "expired" | "canceled";
export type BoostPaymentStatus = "pending" | "paid" | "failed";
export type AnalyticsEventType = "view" | "click_contact" | "click_phone" | "click_line" | "boost_click" | "payment_success";
export type AnalyticsTargetType = "property" | "service";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  avatar_url: string | null;
  role: UserRole;
  loyalty_points: number;
  is_suspended: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points: number;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface District {
  id: number;
  name_th: string;
  name_en: string;
}

export interface University {
  id: number;
  name: string;
  name_th: string | null;
  district_id: number | null;
  lat: number | null;
  lng: number | null;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  storage_path: string;
  sort_order: number;
}

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  property_type: PropertyType;
  description: string;
  district_id: number;
  nearby_university_id: number | null;
  address: string;
  lat: number;
  lng: number;
  price_monthly: number;
  deposit: number;
  room_size_sqm: number | null;
  room_type: RoomType;
  gender_policy: GenderPolicy;
  has_air_conditioner: boolean;
  has_furniture: boolean;
  has_parking: boolean;
  has_wifi: boolean;
  has_security: boolean;
  has_laundry: boolean;
  availability: AvailabilityStatus;
  status: ListingStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
  rating_avg: number;
  rating_count: number;
  is_featured: boolean;
  featured_until: string | null;
  is_boosted: boolean;
  boost_start_at: string | null;
  boost_end_at: string | null;
  is_verified: boolean;
  // joined
  district?: District;
  university?: University | null;
  images?: PropertyImage[];
  owner?: Profile;
}

export interface ServiceProvider {
  id: string;
  owner_id: string;
  business_name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  phone: string;
  line_id: string | null;
  working_districts: number[];
  business_hours: Record<string, { open: string; close: string } | null>;
  lat: number | null;
  lng: number | null;
  rating_avg: number;
  rating_count: number;
  status: ListingStatus;
  is_available: boolean;
  is_featured: boolean;
  featured_until: string | null;
  is_boosted: boolean;
  boost_start_at: string | null;
  boost_end_at: string | null;
  created_at: string;
  updated_at: string;
  images?: { id: string; storage_path: string; sort_order: number }[];
  owner?: { is_verified: boolean };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string | null;
  service_provider_id: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id: string | null;
  service_provider_id: string | null;
  body: string;
  status: MessageStatus;
  created_at: string;
}

export interface ReviewImage {
  id: string;
  review_id: string;
  storage_path: string;
  sort_order: number;
}

export interface Review {
  id: string;
  author_id: string;
  property_id: string | null;
  service_provider_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  author?: Profile;
  images?: ReviewImage[];
}

// ------------------------------------------------------------
// Payment System (architecture only — no gateway integrated yet)
// ------------------------------------------------------------
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  features: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  // joined
  plan?: SubscriptionPlan;
}

export interface PremiumPurchase {
  id: string;
  user_id: string;
  property_id: string | null;
  service_provider_id: string | null;
  purchase_type: PremiumPurchaseType;
  status: PremiumPurchaseStatus;
  starts_at: string | null;
  ends_at: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
  // joined
  property?: Property;
  service_provider?: ServiceProvider;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  provider: string | null;
  provider_reference: string | null;
  subscription_id: string | null;
  premium_purchase_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  // joined
  subscription?: Subscription;
  premium_purchase?: PremiumPurchase;
}

export interface BoostPayment {
  id: string;
  user_id: string;
  property_id: string;
  amount: number;
  status: BoostPaymentStatus;
  payment_method: string | null;
  stripe_session_id: string | null;
  approved_by: string | null;
  activated_at: string | null;
  created_at: string;
  paid_at: string | null;
  // joined
  property?: Property;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: AnalyticsEventType;
  target_type: AnalyticsTargetType;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
