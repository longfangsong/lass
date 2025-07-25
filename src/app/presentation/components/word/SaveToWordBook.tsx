import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { createWordbookEntry } from "@/app/application/usecase/wordbook/createWordbookEntry";
import { FilePlus2 } from "lucide-react";

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
      className={cn("p-0 cursor-pointer", className)}
      onClick={async () => {
        await createWordbookEntry(word_id);
        setClicked(true);
      }}
      disabled={clicked}
    >
      <FilePlus2 className="h-4 w-4" />
    </Button>
  );
}
