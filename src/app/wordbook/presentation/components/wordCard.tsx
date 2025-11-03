import ClickableBlurElement from "@/app/shared/presentation/components/clickableBlurElement";
import OptionalTooltip from "@/app/shared/presentation/components/optionalTooltip";
import { Button } from "@/app/shared/presentation/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/app/shared/presentation/components/ui/card";
import type { WordBookEntryWithDetails } from "@/types";
import { useEffect, useState } from "react";
import { review, ReviewStatus } from "../../domain/model";
import { repository } from "../../infrastructure/repository";

export default function WordCard({
  entry,
  onDone,
}: {
  entry: WordBookEntryWithDetails;
  onDone: () => void;
}) {
  const [thinkTimePassed, setThinkTimePassed] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const [waitForManualNext, setWaitForManualNext] = useState<boolean>(false);

  useEffect(() => {
    // Reset state for the new entry
    setThinkTimePassed(false);
    setRevealAll(false);
    setWaitForManualNext(false);

    if (entry.phonetic_url) {
      new Audio(entry.phonetic_url).play();
    } else if (entry.phonetic_voice) {
      const pronunciation_voice = new Uint8Array(entry.phonetic_voice);
      const blob = new Blob([pronunciation_voice], { type: "audio/mp3" });
      new Audio(window.URL.createObjectURL(blob)).play();
    }

    const timeout = setTimeout(() => setThinkTimePassed(true), 3000);
    // Cleanup function: clears the timeout if the component unmounts
    // or if 'entry' changes before the timeout fires.
    return () => clearTimeout(timeout);
  }, [entry]);

  const done = async (status: ReviewStatus) => {
    setRevealAll(true);
    const newEntry = review(entry, status);
    await repository.insert(newEntry);

    // For Unsure or Forgotten, don't auto-proceed - let user manually confirm
    if (status === ReviewStatus.Unsure || status === ReviewStatus.Forgotten) {
      setWaitForManualNext(true);
    } else {
      setTimeout(
        () => {
          setRevealAll(false);
          onDone();
        },
        entry.passive_review_count === 0 ? 0 : 2000,
      );
    }
  };

  const proceedToNext = () => {
    setRevealAll(false);
    setWaitForManualNext(false);
    onDone();
  };

  const tryThinkHarderTooltip = !thinkTimePassed ? (
    <>
      <p>Try to recall it!</p>
      <p>Do not give up so quickly!</p>
    </>
  ) : undefined;

  return (
    <Card className="max-w-172 mx-auto">
      <CardHeader>
        <CardTitle className="text-4xl text-center">{entry.lemma}</CardTitle>
        <CardContent>
          {entry.lexemes.map((lexeme) => (
            <div key={lexeme.id}>
              {entry.passive_review_count === 0 || revealAll ? (
                <div>{lexeme.definition}</div>
              ) : (
                <ClickableBlurElement
                  disabled={!thinkTimePassed}
                  tooltip={tryThinkHarderTooltip}
                >
                  {lexeme.definition}
                </ClickableBlurElement>
              )}
              <div className="grid grid-cols-2 gap-1">
                {entry.passive_review_count <= 3 || revealAll ? (
                  <p className="text-sm text-green-500">{lexeme.example}</p>
                ) : (
                  <ClickableBlurElement
                    className="text-sm text-green-500"
                    disabled={!thinkTimePassed}
                    tooltip={tryThinkHarderTooltip}
                  >
                    {lexeme.example}
                  </ClickableBlurElement>
                )}
                {entry.passive_review_count === 0 || revealAll ? (
                  <p className="text-sm text-blue-500">
                    {lexeme.example_meaning}
                  </p>
                ) : (
                  <ClickableBlurElement
                    className="text-sm text-blue-500"
                    disabled={!thinkTimePassed}
                    tooltip={tryThinkHarderTooltip}
                  >
                    {lexeme.example_meaning}
                  </ClickableBlurElement>
                )}
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="pt-8 flex w-full flex-wrap justify-around">
          {waitForManualNext ? (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={proceedToNext}
            >
              Nästa
            </Button>
          ) : (
            <>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={revealAll}
                onClick={() => done(ReviewStatus.StillRemember)}
              >
                Klar
              </Button>
              {entry.passive_review_count > 0 && (
                <>
                  <OptionalTooltip
                    tooltip={thinkTimePassed ? undefined : tryThinkHarderTooltip}
                  >
                    <div>
                      <Button
                        disabled={revealAll || !thinkTimePassed}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black"
                        onClick={() => done(ReviewStatus.Unsure)}
                      >
                        Kanske
                      </Button>
                    </div>
                  </OptionalTooltip>
                  <OptionalTooltip
                    tooltip={thinkTimePassed ? undefined : tryThinkHarderTooltip}
                  >
                    <div>
                      <Button
                        disabled={revealAll || !thinkTimePassed}
                        variant="destructive"
                        onClick={() => done(ReviewStatus.Forgotten)}
                      >
                        Nej
                      </Button>
                    </div>
                  </OptionalTooltip>
                </>
              )}
            </>
          )}
        </CardFooter>
      </CardHeader>
    </Card>
  );
}
