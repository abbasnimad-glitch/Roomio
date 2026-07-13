import Image from "next/image";
import { Coffee, Heart } from "lucide-react";

export const metadata = {
  title: "สนับสนุน Roomio — ค่าน้ำชา",
  alternates: { canonical: "/support" },
};

const SUGGESTED_AMOUNTS = [20, 50, 100];

export default function SupportPage() {
  return (
    <div className="container-app max-w-md py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
        <Coffee className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">สนับสนุน Roomio</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        หากแพลตฟอร์มนี้มีประโยชน์กับคุณ สามารถร่วมสนับสนุน &ldquo;ค่าน้ำชา&rdquo; ให้ผู้พัฒนาได้ตามกำลังศรัทธา
        ทุกกำลังใจช่วยให้เราพัฒนา Roomio ต่อไปได้ครับ
      </p>

      <div className="mx-auto mt-6 max-w-[260px] overflow-hidden rounded-2xl border border-ink-100 shadow-card">
        <Image
          src="/images/promptpay-qr.jpg"
          alt="PromptPay QR code สำหรับสนับสนุน Roomio"
          width={500}
          height={780}
          className="w-full"
        />
      </div>

      <p className="mt-3 text-sm font-semibold text-ink-900">สแกนจ่ายผ่าน PromptPay</p>
      <p className="text-xs text-ink-500">บัญชี: Bnmshop</p>

      <div className="mt-5 flex justify-center gap-2">
        {SUGGESTED_AMOUNTS.map((amount) => (
          <span key={amount} className="rounded-full border border-primary-100 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-600">
            {amount} บาท
          </span>
        ))}
      </div>

      <p className="mt-6 flex items-center justify-center gap-1 text-xs text-ink-400">
        <Heart className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
        ขอบคุณที่เป็นส่วนหนึ่งของ Roomio
      </p>
      <p className="mt-4 text-xs text-ink-400">
        * จำนวนเงินด้านบนเป็นเพียงคำแนะนำ สแกนแล้วกรอกจำนวนที่ต้องการในแอปธนาคารได้เลย
      </p>
    </div>
  );
}
