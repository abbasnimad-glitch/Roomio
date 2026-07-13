import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Phone, MessageCircle, Clock, MapPin } from "lucide-react";
import { getServiceProviderBySlug, getServiceProviderReviews, getMyReview, getMyProfile } from "@/lib/queries";
import { publicImageUrl, truncate, isCurrentlyFeatured, isCurrentlyBoosted } from "@/lib/utils";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import RatingStars from "@/components/RatingStars";
import FavoriteButton from "@/components/FavoriteButton";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import TrackedLink from "@/components/TrackedLink";
import FeaturedBadge from "@/components/FeaturedBadge";
import BoostBadge from "@/components/BoostBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

const DAY_LABELS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getServiceProviderBySlug(slug);
  if (!provider) return {};

  const category = SERVICE_CATEGORY_LABELS[provider.category];
  const title = `${provider.business_name} — ${category} in Songkhla`;
  const description = truncate(
    provider.description?.trim() || `${category} serving ${provider.working_districts.length} district(s) in Songkhla Province.`,
    155
  );
  const firstImage = provider.images?.[0];
  const imageUrl = firstImage ? publicImageUrl("provider-images", firstImage.storage_path) : undefined;
  const canonicalPath = `/service/${provider.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 900, alt: provider.business_name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ServiceProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = await getServiceProviderBySlug(slug);
  if (!provider) notFound();

  const [reviews, myReview, profile] = await Promise.all([
    getServiceProviderReviews(provider.id),
    getMyReview({ serviceProviderId: provider.id }),
    getMyProfile(),
  ]);

  const images = provider.images ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.business_name,
    description: provider.description,
    image: images.map((img) => publicImageUrl("provider-images", img.storage_path)),
    telephone: provider.phone,
    areaServed: "Songkhla Province, Thailand",
    ...(provider.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: provider.rating_avg,
        reviewCount: provider.rating_count,
      },
    }),
  };

  return (
    <div className="container-app py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        {images.length > 0 ? (
          images.slice(0, 5).map((img, i) => (
            <div key={img.id} className={`relative aspect-square bg-ink-100 ${i === 0 ? "sm:col-span-2 sm:row-span-2 sm:aspect-auto" : ""}`}>
              <Image src={publicImageUrl("provider-images", img.storage_path)} alt={`${provider.business_name} photo ${i + 1}`} fill sizes="50vw" className="object-cover" priority={i === 0} />
            </div>
          ))
        ) : (
          <div className="col-span-4 flex aspect-video items-center justify-center bg-ink-100 text-ink-500">No photos uploaded yet</div>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ink-900">{provider.business_name}</h1>
                {isCurrentlyBoosted(provider.is_boosted, provider.boost_start_at, provider.boost_end_at) && <BoostBadge />}
                {isCurrentlyFeatured(provider.is_featured, provider.featured_until) && <FeaturedBadge />}
                {provider.owner?.is_verified && <VerifiedBadge label="Verified Technician" />}
              </div>
              <p className="mt-1 text-sm font-medium text-primary-600">{SERVICE_CATEGORY_LABELS[provider.category]}</p>
            </div>
            <FavoriteButton serviceProviderId={provider.id} />
          </div>

          <div className="mt-3">
            <RatingStars rating={provider.rating_avg} count={provider.rating_count} />
          </div>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-ink-900">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{provider.description}</p>
          </section>

          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
              <Clock className="h-4 w-4" /> Business hours
            </h2>
            <ul className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100 text-sm">
              {Object.entries(DAY_LABELS).map(([key, label]) => {
                const hours = provider.business_hours?.[key];
                return (
                  <li key={key} className="flex justify-between px-4 py-2">
                    <span className="text-ink-700">{label}</span>
                    <span className="text-ink-500">{hours ? `${hours.open} – ${hours.close}` : "Closed"}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-ink-900">Reviews</h2>
            <div className="mt-3">
              {profile ? (
                <div className="mb-4">
                  <ReviewForm
                    serviceProviderId={provider.id}
                    revalidateTargetPath={`/service/${provider.slug}`}
                    existingReview={myReview}
                  />
                </div>
              ) : (
                <p className="mb-4 text-sm text-ink-500">
                  <a href="/auth/login" className="font-medium text-primary-600">เข้าสู่ระบบ</a> เพื่อเขียนรีวิว
                </p>
              )}
              <ReviewList reviews={reviews} currentUserId={profile?.id ?? null} revalidateTargetPath={`/service/${provider.slug}`} />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-ink-100 p-5 shadow-card lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <MapPin className="h-4 w-4" /> Serves {provider.working_districts.length} district{provider.working_districts.length === 1 ? "" : "s"} in Songkhla
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {profile && profile.id !== provider.owner_id && (
              <TrackedLink
                eventName={ANALYTICS_EVENTS.CONTACT_TECHNICIAN}
                eventProps={{ provider_id: provider.id, method: "message" }}
                analyticsTargetType="service"
                analyticsTargetId={provider.id}
                href={`/messages/${provider.owner_id}?provider=${provider.id}`}
                className="flex items-center justify-center gap-2 rounded-full border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-ink-100 focus-ring"
              >
                <MessageCircle className="h-4 w-4" /> Message provider
              </TrackedLink>
            )}
            <TrackedLink
              eventName={ANALYTICS_EVENTS.CONTACT_TECHNICIAN}
              eventProps={{ provider_id: provider.id, method: "call" }}
                analyticsTargetType="service"
                analyticsTargetId={provider.id}
              href={`tel:${provider.phone}`}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
            >
              <Phone className="h-4 w-4" /> Call {provider.phone}
            </TrackedLink>
            {provider.line_id && (
              <TrackedLink
                eventName={ANALYTICS_EVENTS.CONTACT_TECHNICIAN}
                eventProps={{ provider_id: provider.id, method: "line" }}
                analyticsTargetType="service"
                analyticsTargetId={provider.id}
                href={`https://line.me/ti/p/~${provider.line_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:bg-secondary-600 focus-ring"
              >
                <MessageCircle className="h-4 w-4" /> Chat on LINE
              </TrackedLink>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
