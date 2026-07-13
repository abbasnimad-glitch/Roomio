import { Award } from "lucide-react";
import { LOYALTY_TIERS, tierForPoints, nextTierForPoints } from "@/lib/constants";
import type { LoyaltyTransaction } from "@/types/database";
import { cn } from "@/lib/utils";

const TIER_STYLES: Record<string, { badge: string; ring: string }> = {
  bronze: { badge: "bg-amber-600 text-white", ring: "from-amber-50" },
  silver: { badge: "bg-slate-500 text-white", ring: "from-slate-50" },
  gold: { badge: "bg-yellow-500 text-white", ring: "from-yellow-50" },
};

export default function MembershipCard({
  points,
  transactions,
}: {
  points: number;
  transactions: LoyaltyTransaction[];
}) {
  const tier = tierForPoints(points);
  const next = nextTierForPoints(points);
  const style = TIER_STYLES[tier.key];

  return (
    <div className={cn("rounded-2xl border border-ink-100 bg-gradient-to-br to-white p-5 shadow-card", style.ring)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-ink-900">สมาชิก Roomio</h2>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", style.badge)}>ระดับ{tier.label}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/70 p-3 text-center">
          <p className="text-2xl font-bold text-primary-600">{points}</p>
          <p className="text-xs text-ink-500">แต้มสะสม</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3 text-center">
          <p className="text-2xl font-bold text-primary-600">{tier.discountPercent}%</p>
          <p className="text-xs text-ink-500">ส่วนลดปัจจุบัน</p>
        </div>
      </div>

      {next ? (
        <p className="mt-3 text-center text-xs text-ink-500">
          อีก <span className="font-semibold text-ink-700">{next.remaining}</span> แต้ม จะเลื่อนเป็นระดับ{next.tier.label}
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-ink-500">คุณอยู่ในระดับสูงสุดแล้ว 🎉</p>
      )}

      <div className="mt-4 flex gap-1.5">
        {LOYALTY_TIERS.map((t) => (
          <div
            key={t.key}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              points >= t.min ? TIER_STYLES[t.key].badge.split(" ")[0] : "bg-ink-100"
            )}
          />
        ))}
      </div>

      {transactions.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-ink-700">ประวัติล่าสุด</p>
          <ul className="mt-2 space-y-1.5">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-xs">
                <span className="text-ink-500">{new Date(t.created_at).toLocaleDateString("th-TH")}</span>
                <span className="text-ink-700">{t.note}</span>
                <span className="font-semibold text-secondary-600">
                  {t.points > 0 ? "+" : ""}
                  {t.points} แต้ม
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
