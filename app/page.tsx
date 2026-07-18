import {
  getDistricts,
  getUniversities,
  getLatestProperties,
  getPopularProperties,
  getAvailableNowProperties,
} from "@/lib/queries";
import HomeContent from "@/components/HomeContent";

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
    <HomeContent
      districts={districts}
      universities={universities}
      latest={latest}
      popular={popular}
      availableNow={availableNow}
    />
  );
}