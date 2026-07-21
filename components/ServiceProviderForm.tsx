"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceProvider, District, ServiceCategoryRow } from "@/types/database";
import type { ActionResult } from "@/lib/actions/provider";
import PropertyLocationPicker, { DEFAULT_LAT, DEFAULT_LNG } from "@/components/PropertyLocationPicker";
import { useLanguage, localizedName } from "@/lib/i18n/LanguageContext";

export default function ServiceProviderForm({
  mode,
  provider,
  districts,
  categories,
  action,
}: {
  mode: "create" | "edit";
  provider?: ServiceProvider;
  districts: District[];
  categories: ServiceCategoryRow[];
  action: (formData: FormData) => Promise<ActionResult & { providerId?: string }>;
}) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [coords, setCoords] = useState({
    lat: provider?.lat ?? DEFAULT_LAT,
    lng: provider?.lng ?? DEFAULT_LNG,
  });

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
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.businessNameLabel}</label>
          <input
            name="business_name"
            required
            defaultValue={provider?.business_name}
            placeholder={t.listingForm.businessNamePlaceholder}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.categoryLabel}</label>
          <select
            name="category_id"
            required
            defaultValue={provider?.category_id ?? categories[0]?.id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {localizedName(locale, c.name_th, c.name_en)}
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
          defaultValue={provider?.description}
          placeholder={t.listingForm.descriptionPlaceholderProvider}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.auth.phone}</label>
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
          <label className="text-xs font-semibold text-ink-700">{t.listingForm.lineIdOptionalLabel}</label>
          <input
            name="line_id"
            defaultValue={provider?.line_id ?? ""}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
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

      <div>
        <label className="text-xs font-semibold text-ink-700">{t.listingForm.districtsServedLabel}</label>
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
              {localizedName(locale, d.name_th, d.name_en)}
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
