"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/lib/actions/reviews";
import ReviewImageUpload from "@/components/ReviewImageUpload";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/database";

export default function ReviewForm({
  propertyId,
  serviceProviderId,
  revalidateTargetPath,
  existingReview,
}: {
  propertyId?: string;
  serviceProviderId?: string;
  revalidateTargetPath: string;
  existingReview: Review | null;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [reviewId, setReviewId] = useState<string | null>(existingReview?.id ?? null);
  const [images, setImages] = useState(existingReview?.images ?? []);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitReview(formData);
      setMessage({ text: result.message, ok: result.success });
      if (result.success && result.reviewId) setReviewId(result.reviewId);
    });
  }

  return (
    <div className="rounded-2xl border border-ink-100 p-5">
      <h3 className="text-sm font-semibold text-ink-900">{existingReview ? "แก้ไขรีวิวของคุณ" : "เขียนรีวิว"}</h3>

      <form action={handleSubmit} className="mt-3 flex flex-col gap-3">
        {propertyId && <input type="hidden" name="property_id" value={propertyId} />}
        {serviceProviderId && <input type="hidden" name="service_provider_id" value={serviceProviderId} />}
        <input type="hidden" name="revalidate_path" value={revalidateTargetPath} />
        <input type="hidden" name="rating" value={rating} />

        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              aria-label={`${star} ดาว`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition",
                  (hoverRating || rating) >= star ? "fill-accent-500 text-accent-500" : "text-ink-300"
                )}
              />
            </button>
          ))}
        </div>

        <textarea
          name="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="แบ่งปันประสบการณ์ของคุณ..."
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus-ring"
        />

        <button
          type="submit"
          disabled={isPending || rating === 0}
          className="self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
        >
          {isPending ? "กำลังบันทึก…" : existingReview ? "บันทึกการแก้ไข" : "ส่งรีวิว"}
        </button>

        {message && <p className={message.ok ? "text-sm text-secondary-600" : "text-sm text-red-600"}>{message.text}</p>}
      </form>

      {reviewId && (
        <div className="mt-4 border-t border-ink-100 pt-4">
          <p className="text-xs font-semibold text-ink-700">รูปภาพประกอบรีวิว</p>
          <div className="mt-2">
            <ReviewImageUpload reviewId={reviewId} initialImages={images} />
          </div>
        </div>
      )}
    </div>
  );
}
