import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone, MessageCircle, Facebook, Wind, Sofa, ParkingCircle, Wifi, Shield, WashingMachine } from "lucide-react";
import { getPropertyBySlug, getPropertyReviews, getMyReview, getMyProfile } from "@/lib/queries";
import { formatBaht, publicImageUrl, cn, truncate, isCurrentlyFeatured, isCurrentlyBoosted } from "@/lib/utils";
import { ROOM_TYPE_LABELS, GENDER_POLICY_LABELS, AVAILABILITY_LABELS, AVAILABILITY_COLORS } from "@/lib/constants";
import FavoriteButton from "@/components/FavoriteButton";
import PropertyGallery from "@/components/PropertyGallery";
import PropertyMap from "@/components/PropertyMapLazy";
import ShareButton from "@/components/ShareButton";
import RatingStars from "@/components/RatingStars";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import PropertyViewTracker from "@/components/PropertyViewTracker";
import TrackedLink from "@/components/TrackedLink";
import FeaturedBadge from "@/components/FeaturedBadge";
import BoostBadge from "@/components/BoostBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};

  const districtName = property.district?.name_en ?? "Songkhla";
  const title = `หอพัก ${property.name} หาดใหญ่ | ราคา ${formatBaht(property.price_monthly)} | Roomio`;
  const description = truncate(
    property.description?.trim() ||
      `${ROOM_TYPE_LABELS[property.room_type]} in ${districtName}, ${formatBaht(property.price_monthly)}/month. ${AVAILABILITY_LABELS[property.availability]}.`,
    155
  );
  const firstImage = property.images?.[0];
  const imageUrl = firstImage ? publicImageUrl("property-images", firstImage.storage_path) : undefined;
  const canonicalPath = `/property/${property.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 900, alt: property.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const [reviews, myReview, profile] = await Promise.all([
    getPropertyReviews(property.id),
    getMyReview({ propertyId: property.id }),
    getMyProfile(),
  ]);

  const facilities = [
    { active: property.has_air_conditioner, icon: Wind, label: "Air conditioner" },
    { active: property.has_furniture, icon: Sofa, label: "Furniture" },
    { active: property.has_parking, icon: ParkingCircle, label: "Parking" },
    { active: property.has_wifi, icon: Wifi, label: "Wifi" },
    { active: property.has_security, icon: Shield, label: "Security" },
    { active: property.has_laundry, icon: WashingMachine, label: "Laundry" },
  ].filter((f) => f.active);

  const images = property.images ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.name,
    description: property.description,
    image: images.map((img) => publicImageUrl("property-images", img.storage_path)),
    offers: {
      "@type": "Offer",
      price: property.price_monthly,
      priceCurrency: "THB",
      availability:
        property.availability === "full" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `/property/${property.slug}`,
    },
    ...(property.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: property.rating_avg,
        reviewCount: property.rating_count,
      },
    }),
  };

  return (
    <div className="container-app py-8">
      <PropertyViewTracker
        propertyId={property.id}
        propertyName={property.name}
        price={property.price_monthly}
        district={property.district?.name_en}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <PropertyGallery images={images} bucket="property-images" title={property.name} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ink-900">{property.name}</h1>
                {isCurrentlyBoosted(property.is_boosted, property.boost_start_at, property.boost_end_at) && <BoostBadge />}
                {isCurrentlyFeatured(property.is_featured, property.featured_until) && <FeaturedBadge />}
                {property.is_verified && <VerifiedBadge label="Verified Property" />}
                {property.owner?.is_verified && <VerifiedBadge label="Verified Owner" />}
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {property.address}, {property.district?.name_en}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton propertyId={property.id} />
              <ShareButton title={property.name} refId={property.owner?.id} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold", AVAILABILITY_COLORS[property.availability])}>
              {AVAILABILITY_LABELS[property.availability]}
            </span>
            {property.rating_count > 0 && <RatingStars rating={property.rating_avg} count={property.rating_count} />}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-ink-100 p-4 sm:grid-cols-4">
            <Stat label="Room type" value={ROOM_TYPE_LABELS[property.room_type]} />
            <Stat label="Gender policy" value={GENDER_POLICY_LABELS[property.gender_policy]} />
            <Stat label="Room size" value={property.room_size_sqm ? `${property.room_size_sqm} m²` : "—"} />
            <Stat label="Deposit" value={formatBaht(property.deposit)} />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink-900">About this place</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{property.description}</p>
          </section>

          {facilities.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-ink-900">Facilities</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {facilities.map((f) => (
                  <div key={f.label} className="flex items-center gap-2 rounded-xl bg-ink-100/60 px-3 py-2 text-sm text-ink-700">
                    <f.icon className="h-4 w-4 text-primary-600" />
                    {f.label}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink-900">Location</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-ink-100">
              <PropertyMap lat={property.lat} lng={property.lng} label={property.name} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
              Reviews
              {property.rating_count > 0 && <RatingStars rating={property.rating_avg} count={property.rating_count} />}
            </h2>
            <div className="mt-3">
              {profile ? (
                <div className="mb-4">
                  <ReviewForm
                    propertyId={property.id}
                    revalidateTargetPath={`/property/${property.slug}`}
                    existingReview={myReview}
                  />
                </div>
              ) : (
                <p className="mb-4 text-sm text-ink-500">
                  <a href="/auth/login" className="font-medium text-primary-600">เข้าสู่ระบบ</a> เพื่อเขียนรีวิว
                </p>
              )}
              <ReviewList reviews={reviews} currentUserId={profile?.id ?? null} revalidateTargetPath={`/property/${property.slug}`} />
            </div>
          </section>
        </div>

        {/* Sticky contact card */}
        <aside className="h-fit rounded-2xl border border-ink-100 p-5 shadow-card lg:sticky lg:top-24">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary-600">{formatBaht(property.price_monthly)}</span>
            <span className="text-sm text-ink-500">/ month</span>
          </div>
          <p className="mt-1 text-xs text-ink-500">Deposit {formatBaht(property.deposit)}</p>

          <div className="mt-5 flex flex-col gap-2">
            {profile && property.owner && profile.id !== property.owner.id && (
              <TrackedLink
                eventName={ANALYTICS_EVENTS.CONTACT_OWNER}
                eventProps={{ property_id: property.id, method: "message" }}
                analyticsTargetType="property"
                analyticsTargetId={property.id}
                href={`/messages/${property.owner.id}?property=${property.id}`}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
              >
                <MessageCircle className="h-4 w-4" /> Message owner
              </TrackedLink>
            )}
            {property.owner?.phone && (
              <TrackedLink
                eventName={ANALYTICS_EVENTS.CONTACT_OWNER}
                eventProps={{ property_id: property.id, method: "call" }}
                analyticsTargetType="property"
                analyticsTargetId={property.id}
                href={`tel:${property.owner.phone}`}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
              >
                <Phone className="h-4 w-4" /> Call {property.owner.phone}
              </TrackedLink>
            )}
            {property.owner?.line_id && (
              <TrackedLink
                eventName={ANALYTICS_EVENTS.CONTACT_OWNER}
                eventProps={{ property_id: property.id, method: "line" }}
                analyticsTargetType="property"
                analyticsTargetId={property.id}
                href={`https://line.me/ti/p/~${property.owner.line_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:bg-secondary-600 focus-ring"
              >
                <MessageCircle className="h-4 w-4" /> Chat on LINE
              </TrackedLink>
            )}
            {property.owner?.facebook_url && (
              <TrackedLink
                eventName={ANALYTICS_EVENTS.CONTACT_OWNER}
                eventProps={{ property_id: property.id, method: "facebook" }}
                analyticsTargetType="property"
                analyticsTargetId={property.id}
                href={property.owner.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-ink-100 focus-ring"
              >
                <Facebook className="h-4 w-4" /> Message on Facebook
              </TrackedLink>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}
