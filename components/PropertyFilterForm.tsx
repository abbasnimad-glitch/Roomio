"use client";

import type { District, University, RoomType } from "@/types/database";
import { ROOM_TYPE_LABELS } from "@/lib/constants";
import { useLanguage, localizedName } from "@/lib/i18n/LanguageContext";

export default function PropertyFilterForm({
  districts,
  universities,
  params,
}: {
  districts: District[];
  universities: University[];
  params: Record<string, string | undefined>;
}) {
  const { t, locale } = useLanguage();

  return (
    <form className="flex h-fit flex-col gap-4 rounded-2xl border border-ink-100 p-4">
      <div>
        <label className="text-xs font-semibold text-ink-700">{t.search.keyword}</label>
        <input
          name="q"
          defaultValue={params.q}
          placeholder={t.search.propertyNamePlaceholder}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">{t.search.district}</label>
        <select name="district" defaultValue={params.district ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">{t.search.allDistricts}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{localizedName(locale, d.name_th, d.name_en)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">{t.search.university}</label>
        <select name="university" defaultValue={params.university ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">{t.search.any}</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{localizedName(locale, u.name_th, u.name)}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.search.minPrice}</label>
          <input name="min" defaultValue={params.min} type="number" className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">{t.search.maxPrice}</label>
          <input name="max" defaultValue={params.max} type="number" className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">{t.search.roomType}</label>
        <select name="room_type" defaultValue={params.room_type ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">{t.search.any}</option>
          {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((r) => (
            <option key={r} value={r}>{ROOM_TYPE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">{t.search.genderPolicy}</label>
        <select name="gender" defaultValue={params.gender ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">{t.search.any}</option>
          <option value="male_only">{t.search.maleOnly}</option>
          <option value="female_only">{t.search.femaleOnly}</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="available" value="true" defaultChecked={params.available === "true"} className="rounded" />
        {t.search.availableNow}
      </label>
      <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 focus-ring">
        {t.search.applyFilters}
      </button>
    </form>
  );
}