import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServiceProviderBySlug, getServiceProviderReviews, getMyReview, getMyProfile } from "@/lib/queries";
import { publicImageUrl, truncate } from "@/lib/utils";
import ServiceProviderDetailContent from "@/components/ServiceProviderDetailContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getServiceProviderBySlug(slug);
  if (!provider) return {};

  const category = provider.category?.name_en ?? "Service";
  const title = `${provider.business_name} — ${category} in Songkhla`;
  const description = truncate(
    provider.description?.trim() || `${category} serving ${provider.working_districts.length} district(s) in Songkhla Province.`,
    155
  );
  const firstImage = provider.images?.[0];
  const imageUrl = firstImage ? publicImageUrl("provider-images", firstImage.storage_path) : undefined;
  const canonicalPath = `/service/${provider.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 900, alt: provider.business_name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ServiceProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = await getServiceProviderBySlug(slug);
  if (!provider) notFound();

  const [reviews, myReview, profile] = await Promise.all([
    getServiceProviderReviews(provider.id),
    getMyReview({ serviceProviderId: provider.id }),
    getMyProfile(),
  ]);

  const images = provider.images ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.business_name,
    description: provider.description,
    image: images.map((img) => publicImageUrl("provider-images", img.storage_path)),
    telephone: provider.phone,
    areaServed: "Songkhla Province, Thailand",
    ...(provider.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: provider.rating_avg,
        reviewCount: provider.rating_count,
      },
    }),
  };

  return (
    <div className="container-app py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ServiceProviderDetailContent
        provider={provider}
        reviews={reviews}
        myReview={myReview}
        profileId={profile?.id ?? null}
        viewer={profile}
      />
    </div>
  );
}
