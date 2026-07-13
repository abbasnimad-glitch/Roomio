import { getServiceProviders, getDistricts } from "@/lib/queries";
import ServiceProviderCard from "@/components/ServiceProviderCard";
import SearchTracker from "@/components/SearchTracker";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import type { ServiceCategory } from "@/types/database";

export const metadata = {
  title: "Local Services in Songkhla",
  description: "Find trusted electricians, plumbers, aircon repair technicians, and other local service providers in Songkhla Province.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const category = sp.category as ServiceCategory | undefined;
  const districtId = sp.district ? Number(sp.district) : undefined;

  const [providers, districts] = await Promise.all([
    getServiceProviders(category, districtId),
    getDistricts(),
  ]);

  return (
    <div className="container-app py-8">
      <SearchTracker
        category="services"
        params={{ category: sp.category, district: sp.district }}
        resultsCount={providers.length}
      />
      <h1 className="text-2xl font-bold text-ink-900">Local Services in Songkhla</h1>
      <p className="mt-1 text-sm text-ink-500">Trusted electricians, plumbers, and technicians near you.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href="/services"
          className={`rounded-full px-4 py-2 text-sm font-medium ${!category ? "bg-primary text-white" : "bg-ink-100 text-ink-700"}`}
        >
          All
        </a>
        {(Object.entries(SERVICE_CATEGORY_LABELS) as [ServiceCategory, string][]).map(([key, label]) => (
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
          All districts
        </a>
        {districts.map((d) => (
          <a
            key={d.id}
            href={`/services?${category ? `category=${category}&` : ""}district=${d.id}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${districtId === d.id ? "border-primary text-primary" : "border-ink-300 text-ink-700"}`}
          >
            {d.name_en}
          </a>
        ))}
      </div>

      {providers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
          No service providers match yet. Try a different category or district.
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
