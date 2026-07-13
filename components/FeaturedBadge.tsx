import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-600",
        className
      )}
    >
      <Star className="h-3 w-3 fill-accent-500 text-accent-500" /> Featured
    </span>
  );
}
