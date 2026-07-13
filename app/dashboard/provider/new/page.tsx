import { getDistricts } from "@/lib/queries";
import { createServiceProvider } from "@/lib/actions/provider";
import ServiceProviderForm from "@/components/ServiceProviderForm";

export const metadata = { title: "เพิ่มประกาศใหม่ — ผู้ให้บริการ" };

export default async function NewServiceProviderPage() {
  const districts = await getDistricts();

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-ink-900">เพิ่มประกาศใหม่</h1>
      <p className="mt-1 text-sm text-ink-500">
        กรอกรายละเอียดบริการของคุณ ประกาศจะถูกส่งไปรออนุมัติจากแอดมินก่อนแสดงต่อสาธารณะ
      </p>

      <div className="mt-6">
        <ServiceProviderForm mode="create" districts={districts} action={createServiceProvider} />
      </div>
    </div>
  );
}
