import { getServiceProviders, getDistricts, getServiceCategories } from "@/lib/queries";
import SearchTracker from "@/components/SearchTracker";
import ServicesContent from "@/components/ServicesContent";

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
  const categoryId = sp.category ? Number(sp.category) : undefined;
  const districtId = sp.district ? Number(sp.district) : undefined;

  const [providers, districts, categories] = await Promise.all([
    getServiceProviders(categoryId, districtId),
    getDistricts(),
    getServiceCategories(),
  ]);

  return (
    <>
      <SearchTracker
        category="services"
        params={{ category: sp.category, district: sp.district }}
        resultsCount={providers.length}
      />
      <ServicesContent
        providers={providers}
        districts={districts}
        categories={categories}
        categoryId={categoryId}
        districtId={districtId}
      />
    </>
  );
}
