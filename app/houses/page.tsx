import { searchProperties, getDistricts, getUniversities } from "@/lib/queries";
import PropertyListingContent from "@/components/PropertyListingContent";
import SearchTracker from "@/components/SearchTracker";

export const metadata = {
  title: "Rental Houses in Songkhla",
  description: "Browse whole rental houses and family-sized homes for rent across Songkhla Province.",
  alternates: { canonical: "/houses" },
};

export default async function HousesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [{ properties, total }, districts, universities] = await Promise.all([
    searchProperties({
      propertyType: "rental_house",
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
      <SearchTracker category="houses" params={sp} resultsCount={total} />
      <PropertyListingContent
        kind="houses"
        properties={properties}
        total={total}
        districts={districts}
        universities={universities}
        params={sp}
      />
    </>
  );
}