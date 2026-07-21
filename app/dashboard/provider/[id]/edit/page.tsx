import { notFound } from "next/navigation";
import { getDistricts, getProviderListingById, getMyProfile, getServiceCategories } from "@/lib/queries";
import { updateServiceProvider, deleteServiceProvider } from "@/lib/actions/provider";
import ServiceProviderForm from "@/components/ServiceProviderForm";
import PropertyImageManager from "@/components/PropertyImageManager";
import DeletePropertyButton from "@/components/DeletePropertyButton";

export const metadata = { title: "แก้ไขประกาศ — ผู้ให้บริการ" };

export default async function EditServiceProviderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const [profile, provider, districts, categories] = await Promise.all([
    getMyProfile(),
    getProviderListingById(id),
    getDistricts(),
    getServiceCategories(),
  ]);
  if (!provider) notFound();
  if (!profile || (provider.owner_id !== profile.id && profile.role !== "admin")) notFound();

  const boundUpdate = updateServiceProvider.bind(null, provider.id);

  return (
    <div className="container-app max-w-2xl py-8">
      {created === "true" && (
        <p className="mb-4 rounded-xl bg-secondary-50 px-4 py-3 text-sm font-medium text-secondary-600">
          เพิ่มประกาศเรียบร้อยแล้ว รอแอดมินตรวจสอบ — คุณสามารถเพิ่มรูปภาพและแก้ไขรายละเอียดเพิ่มเติมได้ที่นี่
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">แก้ไขประกาศ</h1>
          <p className="mt-1 text-sm text-ink-500">{provider.business_name}</p>
        </div>
        <DeletePropertyButton
          propertyId={provider.id}
          propertyName={provider.business_name}
          redirectTo="/dashboard/provider"
          onDelete={deleteServiceProvider}
          confirmLabel={`ลบประกาศ "${provider.business_name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`}
        />
      </div>
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink-900">รูปภาพ</h2>
        <div className="mt-2">
          <PropertyImageManager
            propertyId={provider.id}
            initialImages={provider.images ?? []}
            bucket="provider-images"
            table="service_provider_images"
            idColumn="service_provider_id"
          />
        </div>
      </section>
      <section className="mt-6">
        <ServiceProviderForm mode="edit" provider={provider} districts={districts} categories={categories} action={boundUpdate} />
      </section>
    </div>
  );
}
