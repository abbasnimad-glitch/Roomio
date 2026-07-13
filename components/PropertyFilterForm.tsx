import type { District, University, RoomType } from "@/types/database";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

export default function PropertyFilterForm({
  districts,
  universities,
  params,
}: {
  districts: District[];
  universities: University[];
  params: Record<string, string | undefined>;
}) {
  return (
    <form className="flex h-fit flex-col gap-4 rounded-2xl border border-ink-100 p-4">
      <div>
        <label className="text-xs font-semibold text-ink-700">Keyword</label>
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Property name"
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">District</label>
        <select name="district" defaultValue={params.district ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name_en}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">University</label>
        <select name="university" defaultValue={params.university ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">Any</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">Min ฿</label>
          <input name="min" defaultValue={params.min} type="number" className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">Max ฿</label>
          <input name="max" defaultValue={params.max} type="number" className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">Room type</label>
        <select name="room_type" defaultValue={params.room_type ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">Any</option>
          {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((r) => (
            <option key={r} value={r}>{ROOM_TYPE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">Gender policy</label>
        <select name="gender" defaultValue={params.gender ?? ""} className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring">
          <option value="">Any</option>
          <option value="male_only">Male only</option>
          <option value="female_only">Female only</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="available" value="true" defaultChecked={params.available === "true"} className="rounded" />
        Available now
      </label>
      <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 focus-ring">
        Apply filters
      </button>
    </form>
  );
}
