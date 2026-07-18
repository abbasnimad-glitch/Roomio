import { searchProperties, getDistricts, getUniversities } from "@/lib/queries";
import PropertyListingContent from "@/components/PropertyListingContent";
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
    <>
      <SearchTracker category="dorm" params={sp} resultsCount={total} />
      <PropertyListingContent
        kind="dorm"
        properties={properties}
        total={total}
        districts={districts}
        universities={universities}
        params={sp}
      />
    </>
  );
}