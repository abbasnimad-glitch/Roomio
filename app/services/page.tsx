import { getServiceProviders, getDistricts } from "@/lib/queries";
import SearchTracker from "@/components/SearchTracker";
import ServicesContent from "@/components/ServicesContent";
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
    <>
      <SearchTracker
        category="services"
        params={{ category: sp.category, district: sp.district }}
        resultsCount={providers.length}
      />
      <ServicesContent providers={providers} districts={districts} category={category} districtId={districtId} />
    </>
  );
}