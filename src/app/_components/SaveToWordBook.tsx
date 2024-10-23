"use client";

import { fetchWithSemaphore } from "@/lib/fetch";
import { ReviewProgress, ReviewProgressPatchPayload, Word } from "@/lib/types";
import { Button } from "flowbite-react";
import { useState } from "react";
import { RiStickyNoteAddLine } from "react-icons/ri";

export function SaveToWordBookButton({ word_id }: { word_id: string }) {
  const [clicked, setClicked] = useState(false);
  return (
    <Button
      className="ml-3 p-0"
      onClick={() => {
        (async () => {
          await createOrUpdateWordReview(word_id);
          setClicked(true);
        })();
      }}
      disabled={clicked}
    >
      <RiStickyNoteAddLine className="h-4 w-4" />
    </Button>
  );
}

async function createOrUpdateWordReview(word_id: string) {
  const response = await fetchWithSemaphore(`/api/review_progresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      word_id: word_id,
    }),
  });
  if (response.status === 409) {
    const existingReviewProgress: ReviewProgress = await response.json();
    updateWordReview(existingReviewProgress);
  }
}

async function updateWordReview(progress: ReviewProgress) {
  const payload: ReviewProgressPatchPayload = {
    query_count: progress.query_count + 1,
  };
  await fetch(`/api/review_progresses/${progress.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
