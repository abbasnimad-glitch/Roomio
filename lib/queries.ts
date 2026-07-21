import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Property, ServiceProvider, District, University, Profile, LoyaltyTransaction, ListingStatus, Review, Notification, MessageRow, SubscriptionPlan, Subscription, PremiumPurchase, Payment, BoostPayment, BoostPaymentStatus, AnalyticsEventType } from "@/types/database";

// Supabase's server-side auth.getUser() re-validates the session against the
// Auth server on every call (by design — safer than trusting the local
// cookie via getSession()), which means it's a real network round trip.
// Several query functions below need the current user, and a single page
// render commonly calls more than one of them (e.g. Header calls
// getMyProfile/getMyNotifications/getUnreadNotificationCount, and a page
// might call getMyProfile again) — each used to re-authenticate separately.
// Wrapping the lookup in React's cache() collapses all of that down to one
// actual request to Supabase per render.
const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export interface PropertySearchParams {
  q?: string;
  propertyType?: "dormitory" | "rental_house";
  districtId?: number;
  universityId?: number;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  genderPolicy?: string;
  availableNow?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  pageSize?: number;
}

const PROPERTY_SELECT = `
  *,
  district:districts(*),
  university:universities(*),
  images:property_images(*),
  owner:profiles!left(*)
`;

export async function searchProperties(params: PropertySearchParams) {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase's overloaded .eq()/.gte()/.ilike() signatures don't fit a hand-written generic constraint; this codebase already casts at the Supabase boundary elsewhere (e.g. `as unknown as Property[]`).
  function applyFilters(q: any) {
    let query = q.eq("status", "approved");
    if (params.propertyType) query = query.eq("property_type", params.propertyType);
    if (params.districtId) query = query.eq("district_id", params.districtId);
    if (params.universityId) query = query.eq("nearby_university_id", params.universityId);
    if (params.minPrice != null) query = query.gte("price_monthly", params.minPrice);
    if (params.maxPrice != null) query = query.lte("price_monthly", params.maxPrice);
    if (params.roomType) query = query.eq("room_type", params.roomType);
    if (params.genderPolicy) query = query.eq("gender_policy", params.genderPolicy);
    if (params.availableNow) query = query.eq("availability", "available");
    if (params.q) query = query.ilike("name", `%${params.q}%`);
    return query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same reason as applyFilters above.
  function applySecondarySort(q: any) {
    const query = q.order("is_featured", { ascending: false });
    switch (params.sort) {
      case "price_asc":
        return query.order("price_monthly", { ascending: true });
      case "price_desc":
        return query.order("price_monthly", { ascending: false });
      case "popular":
        return query.order("view_count", { ascending: false });
      default:
        return query.order("created_at", { ascending: false });
    }
  }

  // Total across all matching properties — unchanged from before.
  const { count: total } = await applyFilters(
    supabase.from("properties").select("id", { count: "exact", head: true })
  );

  // How many of those are currently boosted (not expired) — they always
  // occupy the front of the result set, ahead of everything else. The
  // "normal" bucket size is just the complement (total - boostedTotal),
  // so it doesn't need its own count query.
  const { count: boostedCountResult } = await applyFilters(
    supabase.from("properties").select("id", { count: "exact", head: true })
  )
    .eq("is_boosted", true)
    .or(`boost_end_at.is.null,boost_end_at.gt.${nowIso}`);
  const boostedTotal = boostedCountResult ?? 0;

  async function fetchBoosted(rangeFrom: number, rangeTo: number): Promise<Property[]> {
    if (rangeTo < rangeFrom) return [];
    const query = applySecondarySort(
      applyFilters(supabase.from("properties").select(PROPERTY_SELECT))
        .eq("is_boosted", true)
        .or(`boost_end_at.is.null,boost_end_at.gt.${nowIso}`)
        .order("boost_end_at", { ascending: false, nullsFirst: true })
    );
    const { data, error } = await query.range(rangeFrom, rangeTo);
    if (error) throw error;
    return (data ?? []) as unknown as Property[];
  }

  async function fetchNormal(rangeFrom: number, rangeTo: number): Promise<Property[]> {
    if (rangeTo < rangeFrom) return [];
    // The logical complement of "boosted and not expired": not boosted at
    // all, or boosted with an end date that has already passed. A real
    // structural filter (not ID-exclusion) so pagination stays correct on
    // every page, not just the first one.
    const query = applySecondarySort(
      applyFilters(supabase.from("properties").select(PROPERTY_SELECT)).or(
        `is_boosted.eq.false,and(is_boosted.eq.true,boost_end_at.not.is.null,boost_end_at.lte.${nowIso})`
      )
    );
    const { data, error } = await query.range(rangeFrom, rangeTo);
    if (error) throw error;
    return (data ?? []) as unknown as Property[];
  }

  let properties: Property[];
  if (to < boostedTotal) {
    properties = await fetchBoosted(from, to);
  } else if (from >= boostedTotal) {
    properties = await fetchNormal(from - boostedTotal, to - boostedTotal);
  } else {
    const boostedPart = await fetchBoosted(from, boostedTotal - 1);
    const normalPart = await fetchNormal(0, to - boostedTotal);
    properties = [...boostedPart, ...normalPart];
  }

  return { properties, total: total ?? 0 };
}

export const getPropertyBySlug = cache(async (slug: string): Promise<Property | null> => {
  const decodedSlug = decodeURIComponent(slug);
  const supabase = await createClient();
  // No .eq("status", "approved") filter here — RLS on the properties table
  // already restricts visibility to approved rows for anonymous/other users,
  // while still letting the owner and admins see their own pending listing
  // through this same page (policy: status='approved' OR owner_id=auth.uid()
  // OR is_admin()). Filtering status here too would just re-block the owner
  // and admin from a page RLS already says they're allowed to see.
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .eq("slug", decodedSlug)
    .single();
  if (error) return null;

  supabase.rpc("increment_property_view", { property_slug: decodedSlug }).then(() => {});

  return data as unknown as Property;
});

// Boost priority helpers, shared by getLatestProperties / getPopularProperties
// / getAvailableNowProperties below. Supabase's query builder can only
// .order() by a real column, not a computed "is_boosted AND not expired"
// expression (there's no immutable generated-column trick for it either,
// since expiry depends on now()). So "boosted listings always first, but
// only while their boost hasn't expired" is done as two queries — the
// currently-active-boosted bucket, and everything else — merged in
// application code, rather than a single ORDER BY.
async function getBoostedProperties(
  limit: number,
  tertiarySortColumn: string,
  extraFilter?: readonly [string, string | number | boolean]
): Promise<Property[]> {
  if (limit <= 0) return [];
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .eq("status", "approved")
    .eq("is_boosted", true)
    // Expired boost is ignored: only rows with no end date, or an end date
    // still in the future, count as "currently boosted" here.
    .or(`boost_end_at.is.null,boost_end_at.gt.${nowIso}`);
  if (extraFilter) query = query.eq(extraFilter[0], extraFilter[1]);

  const { data } = await query
    .order("boost_end_at", { ascending: false, nullsFirst: true })
    .order(tertiarySortColumn, { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Property[];
}

async function getRestOfProperties(
  limit: number,
  excludeIds: string[],
  sortColumn: string,
  extraFilter?: readonly [string, string | number | boolean]
): Promise<Property[]> {
  if (limit <= 0) return [];
  const supabase = await createClient();

  let query = supabase.from("properties").select(PROPERTY_SELECT).eq("status", "approved");
  if (extraFilter) query = query.eq(extraFilter[0], extraFilter[1]);
  // Excludes the already-fetched active-boosted rows — everything else,
  // including any expired-boost listing, is sorted normally alongside it.
  if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);

  const { data } = await query.order(sortColumn, { ascending: false }).limit(limit);
  return (data ?? []) as unknown as Property[];
}

export async function getLatestProperties(limit = 8): Promise<Property[]> {
  const boosted = await getBoostedProperties(limit, "created_at");
  if (boosted.length >= limit) return boosted.slice(0, limit);
  const rest = await getRestOfProperties(limit - boosted.length, boosted.map((p) => p.id), "created_at");
  return [...boosted, ...rest].slice(0, limit);
}

export async function getPopularProperties(limit = 8): Promise<Property[]> {
  const boosted = await getBoostedProperties(limit, "view_count");
  if (boosted.length >= limit) return boosted.slice(0, limit);
  const rest = await getRestOfProperties(limit - boosted.length, boosted.map((p) => p.id), "view_count");
  return [...boosted, ...rest].slice(0, limit);
}

export async function getAvailableNowProperties(limit = 8): Promise<Property[]> {
  const availableFilter = ["availability", "available"] as const;
  const boosted = await getBoostedProperties(limit, "created_at", availableFilter);
  if (boosted.length >= limit) return boosted.slice(0, limit);
  const rest = await getRestOfProperties(limit - boosted.length, boosted.map((p) => p.id), "created_at", availableFilter);
  return [...boosted, ...rest].slice(0, limit);
}

export async function getServiceProviders(category?: string, districtId?: number) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same reason as searchProperties' applyFilters.
  function applyProviderFilters(q: any) {
    let query = q;
    if (category) query = query.eq("category", category);
    if (districtId) query = query.contains("working_districts", [districtId]);
    return query;
  }

  // Currently boosted (and not expired) providers always sort first — same
  // "boosted AND not expired" condition used on the homepage/searchProperties.
  const boostedQuery = applyProviderFilters(
    supabase
      .from("service_providers")
      .select("*, images:service_provider_images(*), owner:profiles!left(is_verified)")
      .eq("status", "approved")
      .eq("is_boosted", true)
      .or(`boost_end_at.is.null,boost_end_at.gt.${nowIso}`)
  )
    .order("boost_end_at", { ascending: false, nullsFirst: true })
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false });

  const { data: boostedData, error: boostedError } = await boostedQuery;
  if (boostedError) throw boostedError;
  const boosted = (boostedData ?? []) as unknown as ServiceProvider[];

  // Everything else, excluding an expired boost from any special treatment.
  let restQuery = applyProviderFilters(
    supabase
      .from("service_providers")
      .select("*, images:service_provider_images(*), owner:profiles!left(is_verified)")
      .eq("status", "approved")
  ).order("is_featured", { ascending: false }).order("rating_avg", { ascending: false });
  if (boosted.length > 0) {
    restQuery = restQuery.not("id", "in", `(${boosted.map((p) => p.id).join(",")})`);
  }

  const { data: restData, error: restError } = await restQuery;
  if (restError) throw restError;
  const rest = (restData ?? []) as unknown as ServiceProvider[];

  return [...boosted, ...rest];
}

export const getServiceProviderBySlug = cache(async (slug: string): Promise<ServiceProvider | null> => {
  const decodedSlug = decodeURIComponent(slug);
  const supabase = await createClient();
  // Same reasoning as getPropertyBySlug — rely on RLS instead of an
  // app-level status filter, so the owner/admin can preview a pending
  // listing through this same public-facing page.
  const { data, error } = await supabase
    .from("service_providers")
    .select("*, images:service_provider_images(*), owner:profiles!left(is_verified)")
    .eq("slug", decodedSlug)
    .single();
  if (error) return null;
  return data as unknown as ServiceProvider;
});
export async function getMyFavorites() {
  const user = await getCurrentUser();
  if (!user) return { properties: [] as Property[], serviceProviders: [] as ServiceProvider[] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(`
      id,
      property:properties(${PROPERTY_SELECT}),
      service_provider:service_providers(*, images:service_provider_images(*), owner:profiles!left(is_verified))
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    property: Property | null;
    service_provider: ServiceProvider | null;
  }[];

  return {
    properties: rows.map((r) => r.property).filter((p): p is Property => p != null),
    serviceProviders: rows.map((r) => r.service_provider).filter((s): s is ServiceProvider => s != null),
  };
}

// ------------------------------------------------------------
// Owner dashboard
// ------------------------------------------------------------
export async function getOwnerProperties(): Promise<Property[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, district:districts(*), university:universities(*), images:property_images(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Property[];
}

export async function getOwnerPropertyById(id: string): Promise<Property | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, district:districts(*), university:universities(*), images:property_images(*)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as Property;
}

export async function getOwnerStats(properties?: Property[]) {
  const list = properties ?? (await getOwnerProperties());
  return {
    total: list.length,
    pending: list.filter((p) => p.status === "pending").length,
    approved: list.filter((p) => p.status === "approved").length,
    rejected: list.filter((p) => p.status === "rejected").length,
    totalViews: list.reduce((sum, p) => sum + (p.view_count ?? 0), 0),
  };
}

// ------------------------------------------------------------
// Service provider dashboard
// ------------------------------------------------------------
export async function getProviderListings(): Promise<ServiceProvider[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_providers")
    .select("*, images:service_provider_images(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ServiceProvider[];
}

export async function getProviderListingById(id: string): Promise<ServiceProvider | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_providers")
    .select("*, images:service_provider_images(*)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as ServiceProvider;
}

export async function getProviderStats(listings?: ServiceProvider[]) {
  const list = listings ?? (await getProviderListings());
  return {
    total: list.length,
    pending: list.filter((p) => p.status === "pending").length,
    approved: list.filter((p) => p.status === "approved").length,
    rejected: list.filter((p) => p.status === "rejected").length,
    totalReviews: list.reduce((sum, p) => sum + (p.rating_count ?? 0), 0),
    avgRating: list.length
      ? Number((list.reduce((sum, p) => sum + (p.rating_avg ?? 0), 0) / list.length).toFixed(2))
      : 0,
  };
}

// Districts/universities are public, rarely-changing reference tables (16 and
// 5 rows respectively, seeded once). A plain cookie-free client lets this be
// wrapped in unstable_cache and reused across requests/users instead of
// re-querying the DB on every dorm/houses/services/owner-form page load.
function createStaticDataClient() {
  return createSupabaseJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const getDistricts = unstable_cache(
  async (): Promise<District[]> => {
    const supabase = createStaticDataClient();
    const { data } = await supabase.from("districts").select("*").order("name_en");
    return data ?? [];
  },
  ["districts"],
  { revalidate: 3600 }
);

export const getUniversities = unstable_cache(
  async (): Promise<University[]> => {
    const supabase = createStaticDataClient();
    const { data } = await supabase.from("universities").select("*").order("name");
    return data ?? [];
  },
  ["universities-V2"],
  { revalidate: 3600 }
);

// ------------------------------------------------------------
// Loyalty / membership
// ------------------------------------------------------------
export async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data as Profile | null;
}

export async function getMyLoyaltyTransactions(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as LoyaltyTransaction[];
}

// Admin-only: look up any member by phone number, to award points after a completed job/booking.
export async function findProfileByPhone(phone: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("phone", phone).maybeSingle();
  return data as Profile | null;
}

// ------------------------------------------------------------
// Admin backend
// ------------------------------------------------------------
export async function getAdminStats() {
  const supabase = await createClient();
  const [
    { count: userCount },
    { count: propertyCount },
    { count: pendingPropertyCount },
    { count: providerCount },
    { count: pendingProviderCount },
    { count: suspendedUserCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("service_providers").select("*", { count: "exact", head: true }),
    supabase.from("service_providers").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_suspended", true),
  ]);

  return {
    userCount: userCount ?? 0,
    propertyCount: propertyCount ?? 0,
    pendingPropertyCount: pendingPropertyCount ?? 0,
    providerCount: providerCount ?? 0,
    pendingProviderCount: pendingProviderCount ?? 0,
    suspendedUserCount: suspendedUserCount ?? 0,
  };
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Profile[];
}

export async function getPendingProperties(): Promise<Property[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, district:districts(*), university:universities(*), images:property_images(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as Property[];
}

export async function getPendingServiceProviders(): Promise<ServiceProvider[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_providers")
    .select("*, images:service_provider_images(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as ServiceProvider[];
}

export async function getApprovedPropertiesForAdmin(): Promise<Property[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, district:districts(*), university:universities(*), images:property_images(*)")
    .eq("status", "approved")
    .order("is_boosted", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });
  return (data ?? []) as unknown as Property[];
}

export async function getApprovedServiceProvidersForAdmin(): Promise<ServiceProvider[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_providers")
    .select("*, images:service_provider_images(*)")
    .eq("status", "approved")
    .order("is_boosted", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("business_name", { ascending: true });
  return (data ?? []) as unknown as ServiceProvider[];
}

export async function getAdminReports() {
  const supabase = await createClient();

  const [{ data: properties }, { data: providers }, { data: profiles }] = await Promise.all([
    supabase.from("properties").select("status, property_type, district_id, view_count, name, district:districts(name_en)"),
    supabase.from("service_providers").select("status, category"),
    supabase.from("profiles").select("role"),
  ]);

  const countBy = <T extends string>(rows: { key: T }[]) => {
    const counts: Partial<Record<T, number>> = {};
    for (const row of rows) counts[row.key] = (counts[row.key] ?? 0) + 1;
    return counts;
  };

  const propertyRows = (properties ?? []) as unknown as {
    status: ListingStatus;
    property_type: Property["property_type"];
    district_id: number;
    view_count: number;
    name: string;
    district: { name_en: string } | null;
  }[];
  const providerRows = (providers ?? []) as unknown as { status: ListingStatus; category: string }[];
  const profileRows = (profiles ?? []) as unknown as { role: string }[];

  const topViewedProperties = [...propertyRows]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)
    .map((p) => ({ name: p.name, viewCount: p.view_count, district: p.district?.name_en ?? "—" }));

  const districtCounts = new Map<string, number>();
  for (const p of propertyRows) {
    const key = p.district?.name_en ?? "ไม่ระบุ";
    districtCounts.set(key, (districtCounts.get(key) ?? 0) + 1);
  }

  return {
    propertiesByStatus: countBy(propertyRows.map((p) => ({ key: p.status }))),
    propertiesByType: countBy(propertyRows.map((p) => ({ key: p.property_type }))),
    propertiesByDistrict: Array.from(districtCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([district, count]) => ({ district, count })),
    providersByStatus: countBy(providerRows.map((p) => ({ key: p.status }))),
    providersByCategory: countBy(providerRows.map((p) => ({ key: p.category }))),
    usersByRole: countBy(profileRows.map((p) => ({ key: p.role }))),
    topViewedProperties,
  };
}

// ------------------------------------------------------------
// Reviews
// ------------------------------------------------------------
const REVIEW_SELECT = `*, author:profiles!left(*), images:review_images(*)`;

export async function getPropertyReviews(propertyId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export async function getServiceProviderReviews(serviceProviderId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("service_provider_id", serviceProviderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export async function getMyReview(target: { propertyId?: string; serviceProviderId?: string }): Promise<Review | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  let query = supabase.from("reviews").select(REVIEW_SELECT).eq("author_id", user.id);
  query = target.propertyId ? query.eq("property_id", target.propertyId) : query.eq("service_provider_id", target.serviceProviderId!);

  const { data } = await query.maybeSingle();
  return (data as unknown as Review) ?? null;
}

// ------------------------------------------------------------
// Notifications
// ------------------------------------------------------------
export async function getMyNotifications(limit = 20): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  return count ?? 0;
}

// ------------------------------------------------------------
// Chat / messages
// ------------------------------------------------------------
export interface ConversationSummary {
  key: string;
  otherUser: Profile;
  propertyId: string | null;
  propertyName: string | null;
  propertySlug: string | null;
  serviceProviderId: string | null;
  serviceProviderName: string | null;
  serviceProviderSlug: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return data as Profile | null;
}

export async function getMyConversations(): Promise<ConversationSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      `*, sender:profiles!messages_sender_id_fkey(*), recipient:profiles!messages_recipient_id_fkey(*),
       property:properties(id, name, slug), service_provider:service_providers(id, business_name, slug)`
    )
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as (MessageRow & {
    sender: Profile;
    recipient: Profile;
    property: { id: string; name: string; slug: string } | null;
    service_provider: { id: string; business_name: string; slug: string } | null;
  })[];

  const threads = new Map<string, ConversationSummary>();

  for (const row of rows) {
    const otherUser = row.sender_id === user.id ? row.recipient : row.sender;
    const key = `${otherUser.id}:${row.property_id ?? ""}:${row.service_provider_id ?? ""}`;
    const isUnreadForMe = row.recipient_id === user.id && row.status === "unread";

    const existing = threads.get(key);
    if (!existing) {
      threads.set(key, {
        key,
        otherUser,
        propertyId: row.property_id,
        propertyName: row.property?.name ?? null,
        propertySlug: row.property?.slug ?? null,
        serviceProviderId: row.service_provider_id,
        serviceProviderName: row.service_provider?.business_name ?? null,
        serviceProviderSlug: row.service_provider?.slug ?? null,
        lastMessage: row.body,
        lastMessageAt: row.created_at,
        unreadCount: isUnreadForMe ? 1 : 0,
      });
    } else if (isUnreadForMe) {
      existing.unreadCount += 1;
    }
  }

  return Array.from(threads.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export async function getConversationMessages(
  otherUserId: string,
  target: { propertyId?: string; serviceProviderId?: string }
): Promise<MessageRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`);

  query = target.propertyId
    ? query.eq("property_id", target.propertyId)
    : target.serviceProviderId
      ? query.eq("service_provider_id", target.serviceProviderId)
      : query.is("property_id", null).is("service_provider_id", null);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

// ------------------------------------------------------------
// Sitemap (lean — slug + updated_at only, not the full listing payload)
// ------------------------------------------------------------
export async function getSitemapProperties(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("properties").select("slug, updated_at").eq("status", "approved");
  return data ?? [];
}

export async function getSitemapServiceProviders(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("service_providers").select("slug, updated_at").eq("status", "approved");
  return data ?? [];
}

// ------------------------------------------------------------
// Payment System (architecture only — read-only scaffolding; no gateway
// integration, checkout flow, or mutating actions yet)
// ------------------------------------------------------------
export async function getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true });
  return (data ?? []) as SubscriptionPlan[];
}

export async function getMySubscription(): Promise<Subscription | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as unknown as Subscription | null;
}

export async function getMyPremiumPurchases(): Promise<PremiumPurchase[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("premium_purchases")
    .select("*, property:properties(name, slug), service_provider:service_providers(business_name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as PremiumPurchase[];
}

export async function getMyPayments(): Promise<Payment[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Payment[];
}

// ------------------------------------------------------------
// Boost Payment System
// ------------------------------------------------------------
export async function getBoostPaymentById(paymentId: string): Promise<BoostPayment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boost_payments")
    .select("*, property:properties(id, name, slug, price_monthly)")
    .eq("id", paymentId)
    .maybeSingle();
  return (data as unknown as BoostPayment) ?? null;
}

export async function getBoostPaymentsForAdmin(status?: BoostPaymentStatus): Promise<BoostPayment[]> {
  const supabase = await createClient();
  let query = supabase
    .from("boost_payments")
    .select("*, property:properties(id, name, slug, price_monthly)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []) as unknown as BoostPayment[];
}

// ------------------------------------------------------------
// Analytics & Conversion Tracking
// ------------------------------------------------------------
export interface PropertyStats {
  views: number;
  contacts: number;
  phoneClicks: number;
  lineClicks: number;
  totalClicks: number;
}

export async function getPropertyStats(propertyId: string): Promise<PropertyStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_property_event_counts", { target_property_id: propertyId });

  const rows = (data ?? []) as { event_type: AnalyticsEventType; event_count: number }[];
  const count = (type: AnalyticsEventType) => rows.find((r) => r.event_type === type)?.event_count ?? 0;

  const phoneClicks = count("click_phone");
  const lineClicks = count("click_line");
  const contacts = count("click_contact") + phoneClicks + lineClicks;
  const totalClicks = contacts + count("boost_click");

  return { views: count("view"), contacts, phoneClicks, lineClicks, totalClicks };
}

export async function getAdminAnalyticsSummary(): Promise<{ eventsToday: number; totalPayments: number }> {
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [{ count: eventsToday }, { count: totalPayments }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase.from("boost_payments").select("*", { count: "exact", head: true }).eq("status", "paid"),
  ]);

  return { eventsToday: eventsToday ?? 0, totalPayments: totalPayments ?? 0 };
}