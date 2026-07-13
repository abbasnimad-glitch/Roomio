import AdminLoyaltyForm from "@/components/AdminLoyaltyForm";

export const metadata = { title: "จัดการแต้มสมาชิก — Admin" };

export default function AdminLoyaltyPage() {
  return (
    <div className="container-app max-w-lg py-10">
      <h1 className="text-2xl font-bold text-ink-900">เพิ่มแต้มให้สมาชิก</h1>
      <p className="mt-1 text-sm text-ink-500">
        กรอกเบอร์โทรของลูกค้าและยอดค่าบริการหลังทำงานเสร็จ ระบบจะคำนวณแต้มให้อัตโนมัติ (1 บาท = 1 แต้ม)
      </p>

      <AdminLoyaltyForm />

      <p className="mt-4 text-xs text-ink-400">
        หน้านี้เข้าถึงได้เฉพาะบัญชีที่มี role เป็น admin เท่านั้น (บังคับทั้งที่ middleware และ RLS policy บนตาราง
        loyalty_transactions)
      </p>
    </div>
  );
}
