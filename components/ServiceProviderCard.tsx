"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import type { ServiceProvider } from "@/types/database";
import { publicImageUrl, isCurrentlyFeatured, isCurrentlyBoosted } from "@/lib/utils";
import RatingStars from "@/components/RatingStars";
import FavoriteButton from "@/components/FavoriteButton";
import FeaturedBadge from "@/components/FeaturedBadge";
import BoostBadge from "@/components/BoostBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useLanguage, localizedName } from "@/lib/i18n/LanguageContext";

export default function ServiceProviderCard({ provider, priority = false }: { provider: ServiceProvider; priority?: boolean }) {
  const { t, locale } = useLanguage();
  const cover = provider.images?.[0];
  const imageUrl = cover ? publicImageUrl("provider-images", cover.storage_path) : null;
  const districtsCount = provider.working_districts.length;

  const districtsLabel =
    locale === "th"
      ? `${t.service.servesPrefix} ${districtsCount} ${t.service.servesSuffix}`
      : `${t.service.servesPrefix} ${districtsCount} district${districtsCount === 1 ? "" : "s"} in Songkhla`;

  const categoryLabel = provider.category ? localizedName(locale, provider.category.name_th, provider.category.name_en) : "";

  return (
    <Link
      href={`/service/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift focus-ring"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={provider.business_name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-500">No photo yet</div>
        )}
        {categoryLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
            {categoryLabel}
          </span>
        )}
        <div className="absolute right-3 top-3">
          <FavoriteButton serviceProviderId={provider.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-ink-900">{provider.business_name}</h3>
          {isCurrentlyBoosted(provider.is_boosted, provider.boost_start_at, provider.boost_end_at) ? (
            <BoostBadge />
          ) : isCurrentlyFeatured(provider.is_featured, provider.featured_until) ? (
            <FeaturedBadge />
          ) : (
            provider.owner?.is_verified && <VerifiedBadge label={t.service.verifiedTechnician} />
          )}
        </div>
        <p className="flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3.5 w-3.5" />
          {districtsLabel}
        </p>
        <div className="mt-1">
          <RatingStars rating={provider.rating_avg} count={provider.rating_count} />
        </div>
      </div>
    </Link>
  );
}
