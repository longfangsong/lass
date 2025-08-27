import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@app/presentation/lib/utils";
import { FilePlus2 } from "lucide-react";
import { createEntry } from "@/app/application/service/wordbook/createEntry";
import { repository } from "@/app/infrastructure/indexeddb/wordbookEntryRepository";

export default function SaveToWordBookButton({
  word_id,
  className,
}: {
  className?: string;
  word_id: string;
}) {
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    (async () => {
      const existing = await repository.getByWordId(word_id);
      if (existing) {
        setDisabled(true);
      }
    })();
  }, [word_id]);
  return (
    <Button
      aria-label="Save to word book"
      className={cn("p-0 cursor-pointer", className)}
      onClick={async () => {
        await createEntry(repository, word_id);
        setDisabled(true);
      }}
      disabled={disabled}
    >
      <FilePlus2 className="h-4 w-4" />
    </Button>
  );
}
