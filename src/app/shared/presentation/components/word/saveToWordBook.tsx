import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@app/shared/presentation/lib/utils";
import { FilePlus2 } from "lucide-react";
import { repository } from "@/app/wordbook/infrastructure/repository";
import { createEntry } from "@/app/wordbook/application/createEntry";

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
        setDisabled(true);
        await createEntry(repository, word_id);
      }}
      disabled={disabled}
    >
      <FilePlus2 className="h-4 w-4" />
    </Button>
  );
}
