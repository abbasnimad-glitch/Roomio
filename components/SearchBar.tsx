"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import type { District, University } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SearchBar({
  districts,
  universities,
}: {
  districts: District[];
  universities: University[];
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [universityId, setUniversityId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (districtId) params.set("district", districtId);
    if (universityId) params.set("university", universityId);
    router.push(`/dorm?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded-2xl bg-white p-3 shadow-lift sm:flex-row sm:items-center sm:rounded-full sm:p-2"
    >
      <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-2">
        <Search className="h-5 w-5 shrink-0 text-ink-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="text"
          placeholder={t.search.placeholder}
          className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      <div className="h-px w-full bg-ink-100 sm:h-8 sm:w-px" />

      <select
        value={districtId}
        onChange={(e) => setDistrictId(e.target.value)}
        className="rounded-full bg-transparent px-3 py-2 text-sm text-ink-700 focus-ring"
      >
        <option value="">{t.search.allDistricts}</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>{d.name_en}</option>
        ))}
      </select>

      <div className="h-px w-full bg-ink-100 sm:h-8 sm:w-px" />

      <select
        value={universityId}
        onChange={(e) => setUniversityId(e.target.value)}
        className="rounded-full bg-transparent px-3 py-2 text-sm text-ink-700 focus-ring"
      >
        <option value="">{t.search.anyUniversity}</option>
        {universities.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      <button
        type="submit"
        className="w-full shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 focus-ring sm:w-auto"
      >
        {t.search.search}
      </button>
    </form>
  );
}