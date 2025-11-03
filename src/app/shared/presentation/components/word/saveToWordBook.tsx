import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@app/shared/presentation/lib/utils";
import { FilePlus2 } from "lucide-react";
import { repository } from "@/app/wordbook/infrastructure/repository";
import { createEntry } from "@/app/wordbook/application/createEntry";
import { Spinner } from "../ui/spinner";

enum State { Active, Disabled, Loading };

export default function SaveToWordBookButton({
  word_id,
  className,
}: {
  className?: string;
  word_id: string;
}) {
  const [state, setState] = useState(State.Loading);
  useEffect(() => {
    (async () => {
      const existing = await repository.getByWordId(word_id);
      if (existing) {
        setState(State.Disabled);
      } else {
        setState(State.Active);
      }
    })();
  }, [word_id]);
  return (
    <Button
      aria-label="Save to word book"
      className={cn("p-0 cursor-pointer", className)}
      onClick={() => {
        setState(State.Loading);
        createEntry(repository, word_id)
          .then(() => {
            setState(State.Disabled);
          })
          .catch(() => {
            setState(State.Active);
          });
      }}
      disabled={state !== State.Active}
    >
      {state === State.Loading ? <Spinner className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
    </Button>
  );
}
