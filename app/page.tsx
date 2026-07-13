import { Building2, Home as HomeIcon, Wrench } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import PropertyCard from "@/components/PropertyCard";
import {
  getDistricts,
  getUniversities,
  getLatestProperties,
  getPopularProperties,
  getAvailableNowProperties,
} from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [districts, universities, latest, popular, availableNow] = await Promise.all([
    getDistricts(),
    getUniversities(),
    getLatestProperties(8),
    getPopularProperties(8),
    getAvailableNowProperties(8),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="container-app flex flex-col items-center gap-8 py-16 text-center sm:py-24">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Find your place in{" "}
            <span className="text-primary-600">Songkhla</span>
          </h1>
          <p className="max-w-xl text-base text-ink-500 sm:text-lg">
            Dormitories, rental houses, and trusted local service providers — all in one place.
          </p>
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
            title="Dormitories"
            description="Rooms near PSU, Hatyai University, and more."
            accent="primary"
          />
          <CategoryCard
            href="/houses"
            icon={HomeIcon}
            title="Rental Houses"
            description="Whole houses and family-sized rentals."
            accent="secondary"
          />
          <CategoryCard
            href="/services"
            icon={Wrench}
            title="Local Services"
            description="Electricians, plumbers, aircon repair, and more."
            accent="accent"
          />
        </div>
      </section>

      <ListingSection title="Latest listings" properties={latest} seeAllHref="/dorm?sort=newest" prioritizeImages />
      <ListingSection title="Popular listings" properties={popular} seeAllHref="/dorm?sort=popular" />
      <ListingSection
        title="Available now"
        properties={availableNow}
        seeAllHref="/dorm?available=true"
      />
    </div>
  );
}

function ListingSection({
  title,
  properties,
  seeAllHref,
  prioritizeImages = false,
}: {
  title: string;
  properties: Awaited<ReturnType<typeof getLatestProperties>>;
  seeAllHref: string;
  prioritizeImages?: boolean;
}) {
  if (properties.length === 0) return null;

  return (
    <section className="container-app py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <a href={seeAllHref} className="text-sm font-medium text-primary-600 hover:underline">
          See all
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
