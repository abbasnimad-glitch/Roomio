import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Property } from "@/types/database";
import { formatBaht, publicImageUrl, cn, isCurrentlyFeatured, isCurrentlyBoosted } from "@/lib/utils";
import { ROOM_TYPE_LABELS, AVAILABILITY_LABELS, AVAILABILITY_COLORS } from "@/lib/constants";
import FavoriteButton from "@/components/FavoriteButton";
import RatingStars from "@/components/RatingStars";
import FeaturedBadge from "@/components/FeaturedBadge";
import BoostBadge from "@/components/BoostBadge";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function PropertyCard({ property, priority = false }: { property: Property; priority?: boolean }) {
  const cover = property.images?.[0];
  const imageUrl = cover
    ? publicImageUrl("property-images", cover.storage_path)
    : null;

  return (
    <Link
      href={`/property/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift focus-ring"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={property.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-500">
            No photo yet
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold",
            AVAILABILITY_COLORS[property.availability]
          )}
        >
          {AVAILABILITY_LABELS[property.availability]}
        </span>
        <div className="absolute right-3 top-3">
          <FavoriteButton propertyId={property.id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-ink-900">{property.name}</h3>
          {isCurrentlyBoosted(property.is_boosted, property.boost_start_at, property.boost_end_at) ? (
            <BoostBadge />
          ) : isCurrentlyFeatured(property.is_featured, property.featured_until) ? (
            <FeaturedBadge />
          ) : (
            property.is_verified && <VerifiedBadge label="Verified Property" />
          )}
        </div>
        <p className="flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3.5 w-3.5" />
          {property.district?.name_en ?? "Songkhla"}
        </p>
        <p className="text-xs text-ink-500">{ROOM_TYPE_LABELS[property.room_type]}</p>
        {property.rating_count > 0 && (
          <div className="mt-0.5">
            <RatingStars rating={property.rating_avg} count={property.rating_count} />
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary-600">{formatBaht(property.price_monthly)}</span>
          <span className="text-xs text-ink-500">/ month</span>
        </div>
      </div>
    </Link>
  );
}