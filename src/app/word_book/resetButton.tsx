"use client";

import { ClientSideReviewProgress } from "@/lib/types";
import { Button } from "flowbite-react";
import { MdOutlineRestartAlt } from "react-icons/md";

export function ResetButton({
  review,
  onClick,
}: {
  review: ClientSideReviewProgress;
  onClick?: () => void;
}) {
  return (
    <Button
      color="warning"
      className="p-0 mx-auto"
      onClick={async () => {
        const { localFirstDataSource } = await import(
          "@/lib/frontend/datasource/localFirst"
        );
        await localFirstDataSource.updateReviewProgress({
          ...review,
          review_count: 1,
          last_last_review_time: null,
          last_review_time: new Date().getTime(),
        });
        onClick && onClick();
      }}
    >
      <MdOutlineRestartAlt className="h-4 w-4" />
    </Button>
  );
}
