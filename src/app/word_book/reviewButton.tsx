"use client";

import { fetchWithSemaphore } from "@/lib/fetch";
import { ReviewProgress, ReviewProgressPatchPayload } from "@/lib/types";
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import setLargeTimeout from "set-large-timeout";

async function updateWordReview(review: ReviewProgress) {
  const payload: ReviewProgressPatchPayload = {
    review_count: review.review_count + 1,
    last_review_time: new Date().getTime(),
  };
  fetchWithSemaphore(`/api/review_progresses/${review.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
export function ReviewButton({
  review,
  now,
  onClick,
}: {
  review: ReviewProgress;
  now: Date;
  onClick?: () => void;
}) {
  const [isReviewable, setIsReviewable] = useState(false);

  useEffect(() => {
    if (review.next_reviewable_time === null) {
      setIsReviewable(false);
      return;
    }
    const timeUntilReview = review.next_reviewable_time! - now.getTime();
    if (timeUntilReview <= 0) {
      setIsReviewable(true);
    } else {
      setIsReviewable(false);
      const timerId = setLargeTimeout(() => {
        setIsReviewable(true);
      }, timeUntilReview);
      return () => clearTimeout(timerId);
    }
  }, [review, now]);

  return (
    <Button
      className="p-0 mx-auto"
      onClick={async () => {
        await updateWordReview(review);
        onClick && onClick();
      }}
      disabled={!isReviewable}
    >
      <IoCheckmarkDoneOutline className="h-4 w-4" />
    </Button>
  );
}
