import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";
import { Button } from "flowbite-react";
import { useState } from "react";
import { RiStickyNoteAddLine } from "react-icons/ri";

export default function SaveToWordBookButton({
  word_id,
  className,
}: {
  className?: string;
  word_id: string;
}) {
  const [clicked, setClicked] = useState(false);
  return (
    <Button
      aria-label="Save to word book"
      className={"p-0 " + className ? className : ""}
      onClick={() => {
        (async () => {
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

