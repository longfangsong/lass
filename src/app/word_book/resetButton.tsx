import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";
import { ClientSideReviewProgress } from "@/lib/types";
import { Button } from "flowbite-react";
import { MdOutlineRestartAlt } from "react-icons/md";

export default function ResetButton({
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
        const now = new Date();
        await localFirstDataSource.updateReviewProgress({
          ...review,
          review_count: 1,
          last_last_review_time: null,
          last_review_time: now.getTime(),
          update_time: now.getTime(),
        });
        if (onClick) {
          onClick();
        }
      }}
    >
      <MdOutlineRestartAlt className="h-4 w-4" />
    </Button>
  );
}
