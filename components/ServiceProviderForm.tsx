"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceProvider, District, ServiceCategoryRow } from "@/types/database";
import type { ActionResult } from "@/lib/actions/provider";
import PropertyLocationPicker, { DEFAULT_LAT, DEFAULT_LNG } from "@/components/PropertyLocationPicker";
import { useLanguage, localizedName } from "@/lib/i18n/LanguageContext";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DAY_LABELS_TH: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "วันจันทร์",
  tue: "วันอังคาร",
  wed: "วันพุธ",
  thu: "วันพฤหัสบดี",
  fri: "วันศุกร์",
  sat: "วันเสาร์",
  sun: "วันอาทิตย์",
};

const DAY_LABELS_EN: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

type DayHours = { open: string; close: string } | null;

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

  const [businessHours, setBusinessHours] = useState<Record<string, DayHours>>(() => {
    const initial: Record<string, DayHours> = {};
    for (const key of DAY_KEYS) {
      initial[key] = provider?.business_hours?.[key] ?? null;
    }
    return initial;
  });

  function toggleDay(key: string, isOpen: boolean) {
    setBusinessHours((prev) => ({
      ...prev,
      [key]: isOpen ? { open: prev[key]?.open ?? "09:00", close: prev[key]?.close ?? "18:00" } : null,
    }));
  }

  function updateDayTime(key: string, field: "open" | "close", value: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [key]: prev[key] ? { ...prev[key]!, [field]: value } : { open: "09:00", close: "18:00", [field]: value },
    }));
  }

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

      <div>
        <label className="text-xs font-semibold text-ink-700">
          {locale === "th" ? "เวลาทำการ" : "Business hours"}
        </label>
        <div className="mt-2 flex flex-col divide-y divide-ink-100 rounded-xl border border-ink-100">
          {DAY_KEYS.map((key) => {
            const hours = businessHours[key];
            const isOpen = hours !== null;
            const label = locale === "th" ? DAY_LABELS_TH[key] : DAY_LABELS_EN[key];
            return (
              <div key={key} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <label className="flex w-32 items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => toggleDay(key, e.target.checked)}
                    className="rounded"
                  />
                  {label}
                </label>
                {isOpen ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={hours!.open}
                      onChange={(e) => updateDayTime(key, "open", e.target.value)}
                      className="rounded-lg border border-ink-300 px-2 py-1 text-sm focus-ring"
                    />
                    <span className="text-ink-400">–</span>
                    <input
                      type="time"
                      value={hours!.close}
                      onChange={(e) => updateDayTime(key, "close", e.target.value)}
                      className="rounded-lg border border-ink-300 px-2 py-1 text-sm focus-ring"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-ink-400">{locale === "th" ? "ปิด" : "Closed"}</span>
                )}
              </div>
            );
          })}
        </div>
        <input type="hidden" name="business_hours" value={JSON.stringify(businessHours)} />
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
