import { searchProperties, getDistricts, getUniversities } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilterForm from "@/components/PropertyFilterForm";
import SearchTracker from "@/components/SearchTracker";

export const metadata = {
  title: "Dormitories in Songkhla",
  description: "Browse dormitories and student rooms near PSU, Hatyai University, and other campuses across Songkhla Province.",
  alternates: { canonical: "/dorm" },
};

export default async function DormPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [{ properties, total }, districts, universities] = await Promise.all([
    searchProperties({
      propertyType: "dormitory",
      q: sp.q,
      districtId: sp.district ? Number(sp.district) : undefined,
      universityId: sp.university ? Number(sp.university) : undefined,
      minPrice: sp.min ? Number(sp.min) : undefined,
      maxPrice: sp.max ? Number(sp.max) : undefined,
      roomType: sp.room_type,
      genderPolicy: sp.gender,
      availableNow: sp.available === "true",
      sort: (sp.sort as "newest" | "price_asc" | "price_desc" | "popular") ?? "newest",
    }),
    getDistricts(),
    getUniversities(),
  ]);

  return (
    <div className="container-app py-8">
      <SearchTracker category="dorm" params={sp} resultsCount={total} />
      <h1 className="text-2xl font-bold text-ink-900">Dormitories in Songkhla</h1>
      <p className="mt-1 text-sm text-ink-500">{total} listing{total === 1 ? "" : "s"} found</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <PropertyFilterForm districts={districts} universities={universities} params={sp} />

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
            No dormitories match your filters yet. Try widening your search.
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
