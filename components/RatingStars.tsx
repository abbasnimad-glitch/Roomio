import { Star } from "lucide-react";

export default function RatingStars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-ink-700">
      <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {typeof count === "number" && <span className="text-ink-500">({count})</span>}
    </span>
  );
}
