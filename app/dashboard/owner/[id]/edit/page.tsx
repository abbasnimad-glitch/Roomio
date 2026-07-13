import { notFound } from "next/navigation";
import { getDistricts, getUniversities, getOwnerPropertyById, getMyProfile } from "@/lib/queries";
import { updateProperty } from "@/lib/actions/owner";
import PropertyForm from "@/components/PropertyForm";
import PropertyImageManager from "@/components/PropertyImageManager";
import DeletePropertyButton from "@/components/DeletePropertyButton";

export const metadata = { title: "แก้ไขประกาศ — เจ้าของที่พัก" };

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const [profile, property, districts, universities] = await Promise.all([
    getMyProfile(),
    getOwnerPropertyById(id),
    getDistricts(),
    getUniversities(),
  ]);

  if (!property) notFound();
  if (!profile || (property.owner_id !== profile.id && profile.role !== "admin")) notFound();

  const boundUpdate = updateProperty.bind(null, property.id);

  return (
    <div className="container-app max-w-2xl py-8">
      {created === "true" && (
        <p className="mb-4 rounded-xl bg-secondary-50 px-4 py-3 text-sm font-medium text-secondary-600">
          เพิ่มประกาศเรียบร้อยแล้ว รอแอดมินตรวจสอบ — คุณสามารถเพิ่มรูปภาพและแก้ไขรายละเอียดเพิ่มเติมได้ที่นี่
          <br />
          ลิงก์ถูกคัดลอกแล้ว แชร์ลง Facebook ได้เลย
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">แก้ไขประกาศ</h1>
          <p className="mt-1 text-sm text-ink-500">{property.name}</p>
        </div>
        <DeletePropertyButton propertyId={property.id} propertyName={property.name} redirectTo="/dashboard/owner" />
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink-900">รูปภาพ</h2>
        <div className="mt-2">
          <PropertyImageManager propertyId={property.id} initialImages={property.images ?? []} />
        </div>
      </section>

      <section className="mt-6">
        <PropertyForm
          mode="edit"
          property={property}
          districts={districts}
          universities={universities}
          action={boundUpdate}
        />
      </section>
    </div>
  );
}
