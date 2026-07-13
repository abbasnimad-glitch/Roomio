"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/lib/actions/admin";
import type { UserRole } from "@/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  guest: "ผู้เยี่ยมชม",
  user: "ผู้ใช้ทั่วไป",
  owner: "เจ้าของที่พัก",
  service_provider: "ผู้ให้บริการ",
  admin: "แอดมิน",
};

export default function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(newRole: UserRole) {
    setRole(newRole);
    startTransition(async () => {
      const result = await setUserRole(userId, newRole);
      setMessage(result.success ? "บันทึกแล้ว" : result.message);
      if (!result.success) setRole(currentRole);
      setTimeout(() => setMessage(null), 2500);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="rounded-lg border border-ink-300 px-2 py-1.5 text-xs focus-ring disabled:opacity-60"
      >
        {(Object.keys(ROLE_LABELS) as UserRole[])
          .filter((r) => r !== "guest")
          .map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
      </select>
      {message && <span className="text-[11px] text-ink-400">{message}</span>}
    </div>
  );
}
