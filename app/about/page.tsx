import { Building2, Home as HomeIcon, Wrench } from "lucide-react";

export const metadata = {
  title: "เกี่ยวกับ Roomio",
  description: "Roomio รวบรวมหอพัก บ้านเช่า และผู้ให้บริการในท้องถิ่นที่น่าเชื่อถือทั่วจังหวัดสงขลาไว้ในที่เดียว",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-app max-w-2xl py-12">
      <h1 className="text-2xl font-bold text-ink-900">เกี่ยวกับ Roomio</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-700">
        Roomio คือแพลตฟอร์มที่รวบรวมหอพัก บ้านเช่า และผู้ให้บริการในท้องถิ่นที่น่าเชื่อถือทั่วจังหวัดสงขลาไว้ในที่เดียว
        ตั้งใจสร้างขึ้นเพื่อให้นักศึกษาและคนทำงานหาที่พักที่ใช่ได้ง่ายขึ้น พร้อมทั้งช่วยให้เจ้าของที่พักและผู้ให้บริการในพื้นที่
        เข้าถึงลูกค้าได้สะดวกยิ่งขึ้น
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 p-4">
          <Building2 className="h-5 w-5 text-primary-600" />
          <p className="mt-2 text-sm font-semibold text-ink-900">หอพัก</p>
          <p className="mt-1 text-xs text-ink-500">ห้องพักใกล้มหาวิทยาลัยทั่วสงขลา</p>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <HomeIcon className="h-5 w-5 text-secondary-600" />
          <p className="mt-2 text-sm font-semibold text-ink-900">บ้านเช่า</p>
          <p className="mt-1 text-xs text-ink-500">บ้านทั้งหลังสำหรับครอบครัวหรือกลุ่มเพื่อน</p>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <Wrench className="h-5 w-5 text-accent-600" />
          <p className="mt-2 text-sm font-semibold text-ink-900">บริการท้องถิ่น</p>
          <p className="mt-1 text-xs text-ink-500">ช่างไฟ ช่างแอร์ ช่างประปา และอื่นๆ</p>
        </div>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-ink-700">
        Roomio พัฒนาและดูแลโดยทีมงานอิสระขนาดเล็ก หากมีข้อเสนอแนะหรือพบปัญหาระหว่างใช้งาน
        สามารถติดต่อเราได้ที่หน้า <a href="/contact" className="font-medium text-primary-600 hover:underline">ติดต่อเรา</a>
      </p>
    </div>
  );
}
