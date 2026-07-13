"use client";

import { useRef, useState, useTransition } from "react";
import { awardLoyaltyPoints } from "@/lib/actions/loyalty";

export default function AdminLoyaltyForm() {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await awardLoyaltyPoints(formData);
      setMessage({ text: result.message, ok: result.success });
      if (result.success) formRef.current?.reset();
    });
  }

  return (
    <div>
      <form ref={formRef} action={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-ink-100 p-5">
        <div>
          <label className="text-xs font-semibold text-ink-700">เบอร์โทรลูกค้า</label>
          <input name="phone" type="tel" required placeholder="08XXXXXXXX" className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">ยอดค่าบริการ (บาท)</label>
          <input name="amount" type="number" required min="1" placeholder="เช่น 350" className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">หมายเหตุ</label>
          <input name="note" placeholder="เช่น ค่าเช่าเดือนกรกฎาคม" className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring" />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
        >
          {isPending ? "กำลังบันทึก…" : "บันทึกและเพิ่มแต้ม"}
        </button>
        {message && (
          <p className={message.ok ? "text-sm text-secondary-600" : "text-sm text-red-600"}>{message.text}</p>
        )}
      </form>
    </div>
  );
}
