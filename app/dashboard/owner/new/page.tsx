import { getDistricts, getUniversities } from "@/lib/queries";
import { createProperty } from "@/lib/actions/owner";
import PropertyForm from "@/components/PropertyForm";

export const metadata = { title: "เพิ่มประกาศใหม่ — เจ้าของที่พัก" };

export default async function NewPropertyPage() {
  const [districts, universities] = await Promise.all([getDistricts(), getUniversities()]);

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-ink-900">เพิ่มประกาศใหม่</h1>
      <p className="mt-1 text-sm text-ink-500">
        กรอกรายละเอียดที่พัก ประกาศจะถูกส่งไปรออนุมัติจากแอดมินก่อนแสดงต่อสาธารณะ
      </p>

      <div className="mt-6">
        <PropertyForm mode="create" districts={districts} universities={universities} action={createProperty} />
      </div>
    </div>
  );
}
