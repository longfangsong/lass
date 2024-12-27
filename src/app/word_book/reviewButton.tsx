"use client";

import { ClientSideReviewProgress } from "@/lib/types";
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import setLargeTimeout from "set-large-timeout";

async function updateWordReview(review: ClientSideReviewProgress) {
  const { localFirstDataSource } = await import("@/lib/frontend/datasource/localFirst");
  review.review_count += 1;
  review.last_last_review_time = review.last_review_time;
  review.last_review_time = new Date().getTime();
  console.log(review);
  await localFirstDataSource.updateReviewProgress(review);
}

export function ReviewButton({
  review,
  now,
  onClick,
}: {
  review: ClientSideReviewProgress;
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
