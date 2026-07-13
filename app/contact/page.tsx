import { Mail, Coffee } from "lucide-react";

export const metadata = {
  title: "ติดต่อเรา — Roomio",
  description: "ติดต่อทีมงาน Roomio สำหรับคำถาม ข้อเสนอแนะ หรือปัญหาการใช้งาน",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-app max-w-md py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <Mail className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">ติดต่อเรา</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        มีคำถาม ข้อเสนอแนะ หรือพบปัญหาระหว่างใช้งาน Roomio? ส่งอีเมลมาหาเราได้เลย เราจะพยายามตอบกลับโดยเร็วที่สุด
      </p>

      <a
        href="mailto:hello@roomio.app"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
      >
        <Mail className="h-4 w-4" /> hello@roomio.app
      </a>

      <div className="mt-8 rounded-2xl border border-ink-100 p-5 text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Coffee className="h-4 w-4 text-accent-600" /> อยากสนับสนุน Roomio?
        </p>
        <p className="mt-1 text-xs text-ink-500">
          ดูช่องทางสนับสนุนได้ที่หน้า{" "}
          <a href="/support" className="font-medium text-primary-600 hover:underline">
            สนับสนุน Roomio (ค่าน้ำชา)
          </a>
        </p>
      </div>
    </div>
  );
}
