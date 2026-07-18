"use client";

import ServiceProviderCard from "@/components/ServiceProviderCard";
import { getServiceCategoryLabels } from "@/lib/constants";
import type { ServiceCategory, District, ServiceProvider } from "@/types/database";
import { useLanguage, localizedName } from "@/lib/i18n/LanguageContext";

export default function ServicesContent({
  providers,
  districts,
  category,
  districtId,
}: {
  providers: ServiceProvider[];
  districts: District[];
  category?: ServiceCategory;
  districtId?: number;
}) {
  const { t, locale } = useLanguage();
  const serviceCategoryLabels = getServiceCategoryLabels(locale);

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">{t.listings.servicesTitle}</h1>
      <p className="mt-1 text-sm text-ink-500">{t.listings.servicesSubtitle}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href="/services"
          className={`rounded-full px-4 py-2 text-sm font-medium ${!category ? "bg-primary text-white" : "bg-ink-100 text-ink-700"}`}
        >
          {t.listings.allCategories}
        </a>
        {(Object.entries(serviceCategoryLabels) as [ServiceCategory, string][]).map(([key, label]) => (
          <a
            key={key}
            href={`/services?category=${key}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${category === key ? "bg-primary text-white" : "bg-ink-100 text-ink-700"}`}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={category ? `/services?category=${category}` : "/services"}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!districtId ? "border-primary text-primary" : "border-ink-300 text-ink-700"}`}
        >
          {t.listings.allDistricts}
        </a>
        {districts.map((d) => (
          <a
            key={d.id}
            href={`/services?${category ? `category=${category}&` : ""}district=${d.id}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${districtId === d.id ? "border-primary text-primary" : "border-ink-300 text-ink-700"}`}
          >
            {localizedName(locale, d.name_th, d.name_en)}
          </a>
        ))}
      </div>

      {providers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
          {t.listings.noServiceResults}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {providers.map((p, i) => (
            <ServiceProviderCard key={p.id} provider={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}