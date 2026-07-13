import { redirect } from "next/navigation";
import { getMyProfile, getMyFavorites } from "@/lib/queries";
import PropertyCard from "@/components/PropertyCard";
import ServiceProviderCard from "@/components/ServiceProviderCard";
import FavoritesRealtimeSync from "@/components/FavoritesRealtimeSync";

export const metadata = { title: "My Favorites" };

export default async function FavoritesPage() {
  const [profile, { properties, serviceProviders }] = await Promise.all([getMyProfile(), getMyFavorites()]);
  if (!profile) redirect("/auth/login?redirectTo=/favorites");

  const isEmpty = properties.length === 0 && serviceProviders.length === 0;

  return (
    <div className="container-app py-8">
      <FavoritesRealtimeSync userId={profile.id} />
      <h1 className="text-2xl font-bold text-ink-900">My Favorites</h1>
      <p className="mt-1 text-sm text-ink-500">Properties and service providers you ve saved.</p>

      {isEmpty ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
          Nothing saved yet. Tap the heart icon on any listing to save it here.
        </div>
      ) : (
        <>
          {properties.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-ink-900">Properties</h2>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </section>
          )}

          {serviceProviders.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-ink-900">Service Providers</h2>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {serviceProviders.map((sp) => (
                  <ServiceProviderCard key={sp.id} provider={sp} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
