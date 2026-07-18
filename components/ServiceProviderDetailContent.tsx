"use client";

import Image from "next/image";
import { Phone, MessageCircle, Clock, MapPin } from "lucide-react";
import type { ServiceProvider, Review } from "@/types/database";
import { publicImageUrl, isCurrentlyFeatured, isCurrentlyBoosted } from "@/lib/utils";
import { getServiceCategoryLabels } from "@/lib/constants";
import RatingStars from "@/components/RatingStars";
import FavoriteButton from "@/components/FavoriteButton";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import TrackedLink from "@/components/TrackedLink";
import FeaturedBadge from "@/components/FeaturedBadge";
import BoostBadge from "@/components/BoostBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function ServiceProviderDetailContent({
  provider,
  reviews,
  myReview,
  profileId,
}: {
  provider: ServiceProvider;
  reviews: Review[];
  myReview: Review | null;
  profileId: string | null;
}) {
  const { t, locale } = useLanguage();
  const serviceCategoryLabels = getServiceCategoryLabels(locale);
  const images = provider.images ?? [];
  const districtsCount = provider.working_districts.length;

  const districtsLabel =
    locale === "th"
      ? `${t.service.servesPrefix} ${districtsCount} ${t.service.servesSuffix}`
      : `${t.service.servesPrefix} ${districtsCount} district${districtsCount === 1 ? "" : "s"} in Songkhla`;

  return (
    <>
      <div className="grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        {images.length > 0 ? (
          images.slice(0, 5).map((img, i) => (
            <div key={img.id} className={`relative aspect-square bg-ink-100 ${i === 0 ? "sm:col-span-2 sm:row-span-2 sm:aspect-auto" : ""}`}>
              <Image src={publicImageUrl("provider-images", img.storage_path)} alt={`${provider.business_name} photo ${i + 1}`} fill sizes="50vw" className="object-cover" priority={i === 0} />
            </div>
          ))
        ) : (
          <div className="col-span-4 flex aspect-video items-center justify-center bg-ink-100 text-ink-500">{t.service.noPhotos}</div>
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
                {provider.owner?.is_verified && <VerifiedBadge label={t.service.verifiedTechnician} />}
              </div>
              <p className="mt-1 text-sm font-medium text-primary-600">{serviceCategoryLabels[provider.category]}</p>
            </div>
            <FavoriteButton serviceProviderId={provider.id} />
          </div>

          <div className="mt-3">
            <RatingStars rating={provider.rating_avg} count={provider.rating_count} />
          </div>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-ink-900">{t.service.about}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{provider.description}</p>
          </section>

          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
              <Clock className="h-4 w-4" /> {t.service.businessHours}
            </h2>
            <ul className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100 text-sm">
              {DAY_KEYS.map((key) => {
                const hours = provider.business_hours?.[key];
                return (
                  <li key={key} className="flex justify-between px-4 py-2">
                    <span className="text-ink-700">{t.service.days[key]}</span>
                    <span className="text-ink-500">{hours ? `${hours.open} – ${hours.close}` : t.service.closed}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-ink-900">{t.service.reviews}</h2>
            <div className="mt-3">
              {profileId ? (
                <div className="mb-4">
                  <ReviewForm
                    serviceProviderId={provider.id}
                    revalidateTargetPath={`/service/${provider.slug}`}
                    existingReview={myReview}
                  />
                </div>
              ) : (
                <p className="mb-4 text-sm text-ink-500">
                  <a href="/auth/login" className="font-medium text-primary-600">{t.nav.login}</a> {t.service.loginToReviewSuffix}
                </p>
              )}
              <ReviewList reviews={reviews} currentUserId={profileId} revalidateTargetPath={`/service/${provider.slug}`} />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-ink-100 p-5 shadow-card lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <MapPin className="h-4 w-4" /> {districtsLabel}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {profileId && profileId !== provider.owner_id && (
              <TrackedLink
                eventName={ANALYTICS_EVENTS.CONTACT_TECHNICIAN}
                eventProps={{ provider_id: provider.id, method: "message" }}
                analyticsTargetType="service"
                analyticsTargetId={provider.id}
                href={`/messages/${provider.owner_id}?provider=${provider.id}`}
                className="flex items-center justify-center gap-2 rounded-full border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-ink-100 focus-ring"
              >
                <MessageCircle className="h-4 w-4" /> {t.service.messageProvider}
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
              <Phone className="h-4 w-4" /> {t.service.call} {provider.phone}
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
                <MessageCircle className="h-4 w-4" /> {t.service.chatOnLine}
              </TrackedLink>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
