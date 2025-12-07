import type { Lexeme, Word } from "@/types";
import React, { useCallback, useState } from "react";
import { Separator } from "@app/shared/presentation/components/ui/separator";
import { Badge } from "@app/shared/presentation/components/ui/badge";
import { cn } from "@app/shared/presentation/lib/utils";
import { Button } from "../../ui/button";
import { repository } from "@/app/dictionary/infrastructure/repository";
import { Spinner } from "../../ui/spinner";
import { KomparativSuperlativTable } from "./adj/KomparativSuperlativ";
import { PronCountTable } from "./adj/PronCountTable";
import { Table as SubstTable } from "./subst/table";
import { Table as VerbTable } from "./verb/table";
function lexemePriority(lexeme: Lexeme) {
  const priority = {
    "folkets-lexikon": 0,
    "lexin-swe": 1,
    gemini: 2,
  };
  return priority[lexeme.source as keyof typeof priority];
}

function SourceLabel({ source }: { source: string }) {
  const sourceColor = {
    "folkets-lexikon": "bg-green-500",
    "lexin-swe": "bg-blue-500",
    gemini: "bg-purple-500",
  };
  const sourceClassName =
    sourceColor[source as keyof typeof sourceColor] || "bg-violet-500";
  return <Badge className={cn(sourceClassName, "text-white")}>{source}</Badge>;
}

export default function WordDetail({
  word,
  buttons,
  className,
}: {
  word: Word | null;
  buttons?: Array<React.ReactNode>;
  className?: string;
}) {
  const [currentWord, setCurrentWord] = useState(word);
  const [getFromAIInProgress, setGetFromAIInProgress] = useState(false);

  const getMeaningWithAI = useCallback(async () => {
    try {
      if (currentWord) {
        const query = new URLSearchParams({
          word_id: currentWord.id,
          spell: currentWord.lemma,
        });
        const response = await fetch(
          `/api/lexemes?${query.toString()}`,
        );
        const data: Array<Lexeme> = await response.json();
        if (data) {
          await repository.bulkPutLexeme(data);
          setCurrentWord({
            ...currentWord,
            lexemes: [...currentWord.lexemes, ...data],
          });
        }
      }
    } catch (error) {
      console.error("Error fetching meaning from AI:", error);
    }
  }, [currentWord]);

  const handleButtonClick = async () => {
    setGetFromAIInProgress(true);
    await getMeaningWithAI();
  };

  return (
    <>
      <div
        className={cn(
          "space-y-3 text-gray-500 dark:text-white max-w-full overflow-scroll",
          className,
        )}
      >
        <div className="flex flex-row justify-between items-center">
          <p>[{currentWord?.phonetic}]</p>
          <div className="w-fit flex flex-row gap-1 p-1 pr-2">
            {buttons ? (
              buttons.map((component, index) => (
                <React.Fragment key={index}>{component}</React.Fragment>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>
        <p>{currentWord?.part_of_speech}</p>
        {currentWord?.part_of_speech === "subst." ? (
          <SubstTable word={currentWord} />
        ) : currentWord?.part_of_speech === "verb" ? (
          <VerbTable word={currentWord} />
        ) : currentWord?.part_of_speech === "adj." ? (
          <>
            <PronCountTable word={currentWord} />
            <KomparativSuperlativTable word={currentWord} />
          </>
        ) : currentWord?.part_of_speech === "pron." &&
          currentWord?.indexes.find((it) => it.form === "nform") !==
          undefined ? (
          <PronCountTable word={currentWord} />
        ) : (
          <></>
        )}
      </div>
      <Separator className="my-3 border" />
      {currentWord?.lexemes
        .toSorted(
          (a: Lexeme, b: Lexeme) => lexemePriority(a) - lexemePriority(b),
        )
        .map((lexeme, index) => (
          <React.Fragment key={lexeme.id}>
            <div className="flex flex-row justify-between items-start">
              <span className="text-gray-500 dark:text-white mr-4">
                {lexeme.definition}
              </span>
              <SourceLabel source={lexeme.source} />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-sm text-green-500">
                {lexeme.example || ""}
              </span>
              <span className="text-sm text-blue-500">
                {lexeme.example_meaning || ""}
              </span>
            </div>
            {index !== currentWord?.lexemes.length - 1 ? (
              <Separator className="m-1 border-t" />
            ) : (
              <></>
            )}
          </React.Fragment>
        ))}
      {currentWord &&
        (currentWord.lexemes.length === 0 ||
          currentWord.lexemes.every(
            (lexeme) => lexeme.source === "lexin-swe",
          )) && (
          <div className="flex justify-center">
            <Button
              className="mx-auto"
              onClick={handleButtonClick}
              variant="outline"
              size="sm"
              disabled={getFromAIInProgress}>
              {getFromAIInProgress ? <Spinner /> : "Get meaning with AI"}
            </Button>
          </div>
        )}
    </>
  );
}





