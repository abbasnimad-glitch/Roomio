"use client";

import { Building2, Home as HomeIcon, Wrench } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import PropertyCard from "@/components/PropertyCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Property, District, University } from "@/types/database";

export default function HomeContent({
  districts,
  universities,
  latest,
  popular,
  availableNow,
}: {
  districts: District[];
  universities: University[];
  latest: Property[];
  popular: Property[];
  availableNow: Property[];
}) {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="container-app flex flex-col items-center gap-8 py-16 text-center sm:py-24">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            {t.home.heroTitle}{" "}
            <span className="text-primary-600">{t.home.heroTitleHighlight}</span>
          </h1>
          <p className="max-w-xl text-base text-ink-500 sm:text-lg">{t.home.heroSubtitle}</p>
          <div className="w-full max-w-3xl">
            <SearchBar districts={districts} universities={universities} />
          </div>
        </div>
      </section>

      {/* Category buttons */}
      <section className="container-app -mt-6 py-8 sm:-mt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <CategoryCard
            href="/dorm"
            icon={Building2}
            title={t.home.categoryDormTitle}
            description={t.home.categoryDormDesc}
            accent="primary"
          />
          <CategoryCard
            href="/houses"
            icon={HomeIcon}
            title={t.home.categoryHouseTitle}
            description={t.home.categoryHouseDesc}
            accent="secondary"
          />
          <CategoryCard
            href="/services"
            icon={Wrench}
            title={t.home.categoryServiceTitle}
            description={t.home.categoryServiceDesc}
            accent="accent"
          />
        </div>
      </section>

      <ListingSection
        title={t.home.latestListings}
        seeAllLabel={t.home.seeAll}
        properties={latest}
        seeAllHref="/dorm?sort=newest"
        prioritizeImages
      />
      <ListingSection
        title={t.home.popularListings}
        seeAllLabel={t.home.seeAll}
        properties={popular}
        seeAllHref="/dorm?sort=popular"
      />
      <ListingSection
        title={t.home.availableNow}
        seeAllLabel={t.home.seeAll}
        properties={availableNow}
        seeAllHref="/dorm?available=true"
      />
    </div>
  );
}

function ListingSection({
  title,
  seeAllLabel,
  properties,
  seeAllHref,
  prioritizeImages = false,
}: {
  title: string;
  seeAllLabel: string;
  properties: Property[];
  seeAllHref: string;
  prioritizeImages?: boolean;
}) {
  if (properties.length === 0) return null;

  return (
    <section className="container-app py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <a href={seeAllHref} className="text-sm font-medium text-primary-600 hover:underline">
          {seeAllLabel}
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {properties.map((p, i) => (
          <PropertyCard key={p.id} property={p} priority={prioritizeImages && i < 4} />
        ))}
      </div>
    </section>
  );
}