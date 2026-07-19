"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Property, District, University, RoomType, GenderPolicy, PropertyType } from "@/types/database";
import { getRoomTypeLabels, getGenderPolicyLabels, getPropertyTypeLabels } from "@/lib/constants";
import type { ActionResult } from "@/lib/actions/owner";
import PropertyLocationPicker, { DEFAULT_LAT, DEFAULT_LNG } from "@/components/PropertyLocationPicker";
import { useLanguage, localizedName } from "@/lib/i18n/LanguageContext";

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
  const { t, locale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [coords, setCoords] = useState({
    lat: property?.lat ?? DEFAULT_LAT,
    lng: property?.lng ?? DEFAULT_LNG,
  });

  const roomTypeLabels = getRoomTypeLabels(locale);
  const genderPolicyLabels = getGenderPolicyLabels(locale);
  const propertyTypeLabels = getPropertyTypeLabels(locale);

  const AMENITIES: { key: keyof Property; label: string }[] = [
    { key: "has_air_conditioner", label: t.listingForm.amenityAirCon },
    { key: "has_furniture", label: t.listingForm.amenityFurniture },
    { key: "has_parking", label: t.listingForm.amenityParking },
    { key: "has_wifi", label: t.listingForm.amenityWifi },
    { key: "has_security", label: t.listingForm.amenitySecurity },
    { key: "has_laundry", label: t.listingForm.amenityLaundry },
  ];

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
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.propertyNameLabel}</label>
          <input
            name="name"
            required
            defaultValue={property?.name}
            placeholder={t.listingForm.propertyNamePlaceholder}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.propertyTypeLabel}</label>
          <select
            name="property_type"
            defaultValue={property?.property_type ?? "dormitory"}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {(Object.keys(propertyTypeLabels) as PropertyType[]).map((pt) => (
              <option key={pt} value={pt}>
                {propertyTypeLabels[pt]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">{t.listingForm.descriptionLabel}</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={property?.description}
          placeholder={t.listingForm.descriptionPlaceholderProperty}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.search.district}</label>
          <select
            name="district_id"
            required
            defaultValue={property?.district_id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            <option value="" disabled>
              {t.listingForm.selectDistrictPlaceholder}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {localizedName(locale, d.name_th, d.name_en)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.nearbyUniversityLabel}</label>
          <select
            name="nearby_university_id"
            defaultValue={property?.nearby_university_id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            <option value="">{t.listingForm.noneOption}</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {localizedName(locale, u.name_th, u.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">{t.listingForm.addressLabel}</label>
        <input
          name="address"
          required
          defaultValue={property?.address}
          placeholder={t.listingForm.addressPlaceholder}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">{t.listingForm.locationOnMapLabel}</label>
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
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.priceMonthlyLabel}</label>
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
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.depositLabel}</label>
          <input
            name="deposit"
            type="number"
            min="0"
            defaultValue={property?.deposit ?? 0}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.roomSizeLabel}</label>
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
          <label className="text-xs font-semibold text-ink-700">{t.search.roomType}</label>
          <select
            name="room_type"
            defaultValue={property?.room_type ?? "single"}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {(Object.keys(roomTypeLabels) as RoomType[]).map((r) => (
              <option key={r} value={r}>
                {roomTypeLabels[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.search.genderPolicy}</label>
          <select
            name="gender_policy"
            defaultValue={property?.gender_policy ?? "any"}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {(Object.keys(genderPolicyLabels) as GenderPolicy[]).map((g) => (
              <option key={g} value={g}>
                {genderPolicyLabels[g]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-700">{t.listingForm.facilitiesLabel}</label>
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
        {isPending ? t.listingForm.saving : mode === "create" ? t.listingForm.createListing : t.listingForm.saveChanges}
      </button>

      {message && <p className={message.ok ? "text-sm text-secondary-600" : "text-sm text-red-600"}>{message.text}</p>}
    </form>
  );
}
