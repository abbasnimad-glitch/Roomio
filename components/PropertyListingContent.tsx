"use client";

import PropertyCard from "@/components/PropertyCard";
import PropertyFilterForm from "@/components/PropertyFilterForm";
import type { District, University, Property } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PropertyListingContent({
  kind,
  properties,
  total,
  districts,
  universities,
  params,
}: {
  kind: "dorm" | "houses";
  properties: Property[];
  total: number;
  districts: District[];
  universities: University[];
  params: Record<string, string | undefined>;
}) {
  const { t } = useLanguage();

  const title = kind === "dorm" ? t.listings.dormTitle : t.listings.housesTitle;
  const noResultsText = kind === "dorm" ? t.listings.noDormResults : t.listings.noHouseResults;

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      <p className="mt-1 text-sm text-ink-500">
        {total} {t.listings.listingFound}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <PropertyFilterForm districts={districts} universities={universities} params={params} />

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
            {noResultsText}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}