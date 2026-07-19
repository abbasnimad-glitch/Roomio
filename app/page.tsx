import { getDistricts, getUniversities } from "@/lib/queries";
import HomeContent from "@/components/HomeContent";

export const revalidate = 60;

export default async function HomePage() {
  const [districts, universities] = await Promise.all([getDistricts(), getUniversities()]);

  return <HomeContent districts={districts} universities={universities} />;
}
