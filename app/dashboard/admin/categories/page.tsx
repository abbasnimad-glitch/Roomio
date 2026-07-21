import { getServiceCategories } from "@/lib/queries";
import AdminCategoryManager from "@/components/AdminCategoryManager";

export const metadata = { title: "จัดการหมวดหมู่บริการ — Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getServiceCategories();

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">จัดการหมวดหมู่บริการ</h1>
      <p className="mt-1 text-sm text-ink-500">
        เพิ่ม แก้ไข หรือลบหมวดหมู่บริการที่ผู้ให้บริการเลือกได้ตอนลงประกาศ
      </p>

      <div className="mt-6">
        <AdminCategoryManager categories={categories} />
      </div>
    </div>
  );
}
