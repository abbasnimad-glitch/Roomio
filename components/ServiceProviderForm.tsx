"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceProvider, District, ServiceCategory } from "@/types/database";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import type { ActionResult } from "@/lib/actions/provider";

export default function ServiceProviderForm({
  mode,
  provider,
  districts,
  action,
}: {
  mode: "create" | "edit";
  provider?: ServiceProvider;
  districts: District[];
  action: (formData: FormData) => Promise<ActionResult & { providerId?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await action(formData);
      setMessage({ text: result.message, ok: result.success });
      if (result.success && mode === "create" && result.providerId) {
        router.push(`/dashboard/provider/${result.providerId}/edit?created=true`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-ink-100 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">Business name</label>
          <input
            name="business_name"
            required
            defaultValue={provider?.business_name}
            placeholder="e.g. Somchai Electrical Repair"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Category</label>
          <select
            name="category"
            defaultValue={provider?.category ?? "electrician"}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {(Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[]).map((c) => (
              <option key={c} value={c}>
                {SERVICE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={provider?.description}
          placeholder="Describe your services, experience, specialties..."
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">Phone</label>
          <input
            name="phone"
            type="tel"
            required
            defaultValue={provider?.phone}
            placeholder="08XXXXXXXX"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">LINE ID (optional)</label>
          <input
            name="line_id"
            defaultValue={provider?.line_id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">Latitude (optional)</label>
          <input
            name="lat"
            type="number"
            step="any"
            defaultValue={provider?.lat ?? ""}
            placeholder="7.0086"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Longitude (optional)</label>
          <input
            name="lng"
            type="number"
            step="any"
            defaultValue={provider?.lng ?? ""}
            placeholder="100.4977"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">Districts served</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {districts.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="working_districts"
                value={d.id}
                defaultChecked={provider?.working_districts?.includes(d.id) ?? false}
                className="rounded"
              />
              {d.name_en}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
      >
        {isPending ? "กำลังบันทึก…" : mode === "create" ? "สร้างประกาศ" : "บันทึกการแก้ไข"}
      </button>

      {message && <p className={message.ok ? "text-sm text-secondary-600" : "text-sm text-red-600"}>{message.text}</p>}
    </form>
  );
}
