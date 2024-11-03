"use client";

import { fetchWithSemaphore } from "@/lib/fetch";
import { ReviewProgress, ReviewProgressPatchPayload } from "@/lib/types";
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

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
  onClick,
}: {
  review: ReviewProgress;
  onClick?: () => void;
}) {
  const [clicked, setClicked] = useState(false);
  const [isReviewable, setIsReviewable] = useState(false);

  useEffect(() => {
    if (!review.next_reviewable_time) return;
    const timeUntilReview = review.next_reviewable_time! - Date.now();
    if (timeUntilReview <= 0) {
      setIsReviewable(true);
    } else {
      const timerId = setTimeout(() => {
        setIsReviewable(true);
      }, timeUntilReview);
      return () => clearTimeout(timerId);
    }
  }, [review.next_reviewable_time]);

  return (
    <Button
      className="ml-3 p-0"
      onClick={async () => {
        await updateWordReview(review);
        onClick && onClick();
        setClicked(true);
      }}
      disabled={clicked || !isReviewable}
    >
      <IoCheckmarkDoneOutline className="h-4 w-4" />
    </Button>
  );
}
