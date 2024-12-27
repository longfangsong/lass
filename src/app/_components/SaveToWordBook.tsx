"use client";

import { fetchWithSemaphore } from "@/lib/fetch";
import { ReviewProgress, ReviewProgressPatchPayload, Word } from "@/lib/types";
import { Button } from "flowbite-react";
import { useState } from "react";
import { RiStickyNoteAddLine } from "react-icons/ri";

export function SaveToWordBookButton({
  word_id,
  className,
}: {
  className?: string;
  word_id: string;
}) {
  const [clicked, setClicked] = useState(false);
  return (
    <Button
      className={"p-0 " + className ? className : ""}
      onClick={() => {
        (async () => {
          const { localFirstDataSource } = await import(
            "@/lib/frontend/datasource/localFirst"
          );
          await localFirstDataSource.createOrUpdateWordReview(word_id);
          setClicked(true);
        })();
      }}
      disabled={clicked}
    >
      <RiStickyNoteAddLine className="h-4 w-4" />
    </Button>
  );
}

