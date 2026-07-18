"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Property, District, University, RoomType, GenderPolicy, PropertyType } from "@/types/database";
import { ROOM_TYPE_LABELS, GENDER_POLICY_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { ActionResult } from "@/lib/actions/owner";
import PropertyLocationPicker, { DEFAULT_LAT, DEFAULT_LNG } from "@/components/PropertyLocationPicker";

const AMENITIES: { key: keyof Property; label: string }[] = [
  { key: "has_air_conditioner", label: "Air conditioner" },
  { key: "has_furniture", label: "Furniture" },
  { key: "has_parking", label: "Parking" },
  { key: "has_wifi", label: "Wifi" },
  { key: "has_security", label: "Security" },
  { key: "has_laundry", label: "Laundry" },
];

export default function PropertyForm({
  mode,
  property,
  districts,
  universities,
  action,
}: {
  mode: "create" | "edit";
  property?: Property;
  districts: District[];
  universities: University[];
  action: (formData: FormData) => Promise<ActionResult & { propertyId?: string; propertySlug?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [coords, setCoords] = useState({
    lat: property?.lat ?? DEFAULT_LAT,
    lng: property?.lng ?? DEFAULT_LNG,
  });

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await action(formData);
      setMessage({ text: result.message, ok: result.success });
      if (result.success && mode === "create" && result.propertyId) {
        if (result.propertySlug) {
          try {
            const publicUrl = `${window.location.origin}/property/${result.propertySlug}`;
            await navigator.clipboard.writeText(publicUrl);
          } catch {
            // Clipboard access can fail (permissions, non-HTTPS) — not fatal, still proceed.
          }
        }
        router.push(`/dashboard/owner/${result.propertyId}/edit?created=true`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-ink-100 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">Property name</label>
          <input
            name="name"
            required
            defaultValue={property?.name}
            placeholder="e.g. Sunshine Dormitory"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Property type</label>
          <select
            name="property_type"
            defaultValue={property?.property_type ?? "dormitory"}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
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
          defaultValue={property?.description}
          placeholder="Describe the place, house rules, nearby landmarks..."
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">District</label>
          <select
            name="district_id"
            required
            defaultValue={property?.district_id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            <option value="" disabled>
              Select a district
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name_en}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Nearby university (optional)</label>
          <select
            name="nearby_university_id"
            defaultValue={property?.nearby_university_id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            <option value="">None</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">Address</label>
        <input
          name="address"
          required
          defaultValue={property?.address}
          placeholder="Street, sub-district, district"
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">ตำแหน่งที่ตั้งบนแผนที่</label>
        <div className="mt-1">
          <PropertyLocationPicker
            lat={coords.lat}
            lng={coords.lng}
            onChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </div>
        <input type="hidden" name="lat" value={coords.lat} />
        <input type="hidden" name="lng" value={coords.lng} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-ink-700">Price / month (฿)</label>
          <input
            name="price_monthly"
            type="number"
            min="0"
            required
            defaultValue={property?.price_monthly}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Deposit (฿)</label>
          <input
            name="deposit"
            type="number"
            min="0"
            defaultValue={property?.deposit ?? 0}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Room size (m²)</label>
          <input
            name="room_size_sqm"
            type="number"
            min="0"
            step="any"
            defaultValue={property?.room_size_sqm ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">Room type</label>
          <select
            name="room_type"
            defaultValue={property?.room_type ?? "single"}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((r) => (
              <option key={r} value={r}>
                {ROOM_TYPE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Gender policy</label>
          <select
            name="gender_policy"
            defaultValue={property?.gender_policy ?? "any"}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {(Object.keys(GENDER_POLICY_LABELS) as GenderPolicy[]).map((g) => (
              <option key={g} value={g}>
                {GENDER_POLICY_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">Facilities</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name={a.key}
                value="true"
                defaultChecked={property ? Boolean(property[a.key]) : false}
                className="rounded"
              />
              {a.label}
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