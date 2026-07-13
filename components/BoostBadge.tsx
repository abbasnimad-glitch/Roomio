import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BoostBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-600",
        className
      )}
    >
      <Zap className="h-3 w-3 fill-primary-600 text-primary-600" /> Boosted
    </span>
  );
}
