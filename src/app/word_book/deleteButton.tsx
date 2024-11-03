"use client";

import { fetchWithSemaphore } from "@/lib/fetch";
import { ReviewProgress } from "@/lib/types";
import { Button } from "flowbite-react";
import { MdDeleteForever } from "react-icons/md";

async function deleteWordReview(review: ReviewProgress) {
  fetchWithSemaphore(`/api/review_progresses/${review.id}`, {
    method: "DELETE",
  });
}

export function DeleteButton({
  review,
  onClick,
}: {
  review: ReviewProgress;
  onClick?: () => void;
}) {
  return (
    <Button
      color="failure"
      className="ml-3 p-0"
      onClick={async () => {
        await deleteWordReview(review);
        onClick && onClick();
      }}
    >
      <MdDeleteForever className="h-4 w-4" />
    </Button>
  );
}
