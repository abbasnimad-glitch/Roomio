"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import type { ServiceCategoryRow } from "@/types/database";
import { createServiceCategory, updateServiceCategory, deleteServiceCategory, reorderServiceCategory } from "@/lib/actions/admin-categories";
import { SERVICE_ICON_OPTIONS, getServiceIcon } from "@/lib/service-icons";

export default function AdminCategoryManager({ categories }: { categories: ServiceCategoryRow[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">หมวดหมู่บริการ ({categories.length})</h2>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "ยกเลิก" : "เพิ่มหมวดหมู่"}
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4">
          <CategoryForm mode="create" onDone={() => setShowAddForm(false)} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {categories.map((c, i) => (
          <div key={c.id} className="rounded-2xl border border-ink-100 p-4">
            {editingId === c.id ? (
              <CategoryForm mode="edit" category={c} onDone={() => setEditingId(null)} />
            ) : (
              <CategoryRow
                category={c}
                isFirst={i === 0}
                isLast={i === categories.length - 1}
                onEdit={() => setEditingId(c.id)}
              />
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink-300 p-8 text-center text-sm text-ink-500">
            ยังไม่มีหมวดหมู่ กด &quot;เพิ่มหมวดหมู่&quot; เพื่อเริ่มต้น
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  isFirst,
  isLast,
  onEdit,
}: {
  category: ServiceCategoryRow;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const Icon = getServiceIcon(category.icon);

  function handleReorder(direction: "up" | "down") {
    startTransition(async () => {
      await reorderServiceCategory(category.id, direction);
    });
  }

  function handleDelete() {
    if (!confirm(`ลบหมวดหมู่ "${category.name_th}" ใช่หรือไม่?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteServiceCategory(category.id);
      if (!result.success) setError(result.message);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">{category.name_th}</p>
          <p className="text-xs text-ink-500">{category.name_en} · key: {category.key}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleReorder("up")}
          disabled={isFirst || isPending}
          className="rounded-full p-2 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
          aria-label="เลื่อนขึ้น"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleReorder("down")}
          disabled={isLast || isPending}
          className="rounded-full p-2 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
          aria-label="เลื่อนลง"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button type="button" onClick={onEdit} className="rounded-full p-2 text-ink-500 hover:bg-ink-100" aria-label="แก้ไข">
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-full p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
          aria-label="ลบ"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mt-2 w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

function CategoryForm({
  mode,
  category,
  onDone,
}: {
  mode: "create" | "edit";
  category?: ServiceCategoryRow;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createServiceCategory(formData) : await updateServiceCategory(category!.id, formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-ink-100/50 p-4">
      {mode === "create" && (
        <div>
          <label className="text-xs font-semibold text-ink-700">รหัสหมวดหมู่ (key ภาษาอังกฤษ ไม่มีเว้นวรรค)</label>
          <input
            name="key"
            required
            placeholder="เช่น mover"
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink-700">ชื่อภาษาไทย</label>
          <input
            name="name_th"
            required
            defaultValue={category?.name_th}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-700">ชื่อภาษาอังกฤษ</label>
          <input
            name="name_en"
            required
            defaultValue={category?.name_en}
            className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-700">ไอคอน</label>
        <select
          name="icon"
          defaultValue={category?.icon ?? "Wrench"}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        >
          {SERVICE_ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
        >
          {isPending ? "กำลังบันทึก…" : mode === "create" ? "เพิ่มหมวดหมู่" : "บันทึก"}
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100">
          ยกเลิก
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
