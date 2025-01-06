import { fetchWithSemaphore } from "@/lib/fetch";
import {
  ClientSideReviewProgress,
  ReviewProgressPatchPayload,
} from "@/lib/types";
import { Button } from "flowbite-react";

function donePayload(): ReviewProgressPatchPayload {
  return {
    review_count: 6,
    last_review_time: new Date().getTime(),
  };
}

async function patch(id: string, payload: ReviewProgressPatchPayload) {
  fetchWithSemaphore(`/api/review_progresses/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export default function DoneButton({
  review,
  onClick,
}: {
  review: ClientSideReviewProgress;
  onClick?: () => void;
}) {
  return (
    <Button
      color="success"
      className="p-0 mx-auto"
      onClick={async () => {
        await patch(review.id, donePayload());
        onClick && onClick();
      }}
    >
      Done
    </Button>
  );
}
