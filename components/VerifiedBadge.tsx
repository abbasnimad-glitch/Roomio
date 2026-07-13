import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifiedBadge({ label = "Verified", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-1 text-[11px] font-semibold text-secondary-600",
        className
      )}
    >
      <BadgeCheck className="h-3 w-3" /> {label}
    </span>
  );
}
