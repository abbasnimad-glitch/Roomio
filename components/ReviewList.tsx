"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { deleteReview } from "@/lib/actions/reviews";
import { publicImageUrl } from "@/lib/utils";
import RatingStars from "@/components/RatingStars";
import type { Review } from "@/types/database";

export default function ReviewList({
  reviews,
  currentUserId,
  revalidateTargetPath,
}: {
  reviews: Review[];
  currentUserId: string | null;
  revalidateTargetPath: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(reviewId: string) {
    if (!window.confirm("ลบรีวิวนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const result = await deleteReview(reviewId, revalidateTargetPath);
      if (result.success) router.refresh();
      else alert(result.message);
    });
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
        ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสิ!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-ink-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">{r.author?.full_name ?? "ผู้ใช้"}</p>
              <div className="mt-1 flex items-center gap-2">
                <RatingStars rating={r.rating} />
                <span className="text-xs text-ink-400">{new Date(r.created_at).toLocaleDateString("th-TH")}</span>
              </div>
            </div>
            {currentUserId === r.author_id && (
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                disabled={isPending}
                aria-label="ลบรีวิวนี้"
                className="rounded-full p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{r.comment}</p>}

          {r.images && r.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.images.map((img) => (
                <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg bg-ink-100">
                  <Image src={publicImageUrl("review-images", img.storage_path)} alt="Review photo" fill sizes="64px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
