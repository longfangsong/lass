"use client";

import { ReviewProgress, ReviewProgressPatchPayload } from "@/lib/types";
import { Button } from "flowbite-react";
import { MdOutlineRestartAlt } from "react-icons/md";
import { patch } from "./patch";

function resetPayload(): ReviewProgressPatchPayload {
  return {
    review_count: 1,
    last_last_review_time: null,
    last_review_time: new Date().getTime(),
  };
}

export function ResetButton({
  review,
  onClick,
}: {
  review: ReviewProgress;
  onClick?: () => void;
}) {
  return (
    <Button
      color="warning"
      className="ml-3 p-0"
      onClick={async () => {
        await patch(review.id, resetPayload());
        onClick && onClick();
      }}
    >
      <MdOutlineRestartAlt className="h-4 w-4" />
    </Button>
  );
}
