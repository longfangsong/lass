import type { Lexeme, Word } from "@/types";
import React, { useCallback, useState } from "react";
import { Separator } from "@app/shared/presentation/components/ui/separator";
import { Badge } from "@app/shared/presentation/components/ui/badge";
import { cn } from "@app/shared/presentation/lib/utils";
import { Button } from "../ui/button";
import { repository } from "@/app/dictionary/infrastructure/repository";
import { Spinner } from "../ui/spinner";

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
          <>
            {currentWord?.indexes
              .find((it) => it.form === "best.f.sing.")
              ?.spell.endsWith("t") ? (
              <p>
                &quot;{currentWord.lemma}&quot; är ett{" "}
                <b className="text-red-500">ett</b>-ord
              </p>
            ) : currentWord?.indexes
              .find((it) => it.form === "best.f.sing.")
              ?.spell.endsWith("n") ? (
              <p>
                &quot;{currentWord?.lemma}&quot; är ett{" "}
                <b className="text-green-500">en</b>-ord
              </p>
            ) : (
              <></>
            )}
            {substantiveTable(currentWord)}
          </>
        ) : currentWord?.part_of_speech === "verb" ? (
          verbTable(currentWord)
        ) : currentWord?.part_of_speech === "adj." ? (
          <>
            {adjectivePronCountTable(currentWord)}
            {adjectiveKomparativSuperlativTable(currentWord)}
          </>
        ) : currentWord?.part_of_speech === "pron." &&
          currentWord?.indexes.find((it) => it.form === "nform") !==
          undefined ? (
          adjectivePronCountTable(currentWord)
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

function substantiveTable(word: Word) {
  const relevantForms = ["best.f.sing.", "obest.f.sing."];
  const anyRelevantForms = relevantForms.some((form) =>
    word?.indexes.find((it) => it.form === form),
  );
  if (!anyRelevantForms) {
    return <></>;
  }
  return (
    <div className="max-w-full overflow-scroll">
      <table className="py-1 px-2 border border-sky-500">
        <thead>
          <tr>
            <th />
            <th className="py-1 px-2 border border-sky-500">Obestämd</th>
            <th className="py-1 px-2 border border-sky-500">Bestämd</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 px-2 border border-sky-500">Singular</td>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "obest.f.sing.")?.spell}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "best.f.sing.")?.spell}
            </td>
          </tr>
          <tr>
            <td className="py-1 px-2 border border-sky-500">Plural</td>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "obest.f.pl.")?.spell}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "best.f.pl.")?.spell}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function verbTable(word: Word) {
  const imperativ = word?.indexes.find((it) => it.form === "imperativ")?.spell;
  const infinitiv = word?.indexes.find((it) => it.form === "infinitiv")?.spell;
  const supinum = word?.indexes.find((it) => it.form === "supinum")?.spell;
  const imperfekt = word?.indexes.find((it) => it.form === "imperfekt")?.spell;
  const perf_part = word?.indexes.find((it) => it.form === "perf.part.")?.spell;
  const presens = word?.indexes.find((it) => it.form === "presens")?.spell;
  const anyRelevantForms = [
    imperativ,
    infinitiv,
    supinum,
    imperfekt,
    perf_part,
    presens,
  ].some((it) => it);
  if (!anyRelevantForms) {
    return <></>;
  }
  return (
    <div className="max-w-full overflow-scroll">
      <table className="py-1 px-2 border border-sky-500 max-w-72 overflow-scroll">
        <thead>
          <tr>
            <th className="py-1 px-2 border border-sky-500">Imperativ</th>
            <th className="py-1 px-2 border border-sky-500">Infinitiv</th>
            <th className="py-1 px-2 border border-sky-500">Supinum</th>
            <th className="py-1 px-2 border border-sky-500">Imperfekt</th>
            <th className="py-1 px-2 border border-sky-500">
              Perfekt particip
            </th>
            <th className="py-1 px-2 border border-sky-500">Presens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 px-2 border border-sky-500">
              {imperativ ? <>{imperativ}!</> : <></>}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {infinitiv ? (
                <>
                  <span className="text-xs">att </span>
                  {infinitiv}
                </>
              ) : (
                <></>
              )}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {supinum ? (
                <>
                  <span className="text-xs">har </span>
                  {supinum}
                </>
              ) : (
                <></>
              )}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {imperfekt ? imperfekt : ""}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {perf_part ? (
                <>
                  <span className="text-xs">är </span>
                  {perf_part}
                </>
              ) : (
                <></>
              )}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {presens ? presens : ""}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function adjectivePronCountTable(word: Word) {
  const relevantForms = ["nform", "tform", "aform"];
  const anyRelevantForms = relevantForms.some((form) =>
    word?.indexes.find((it) => it.form === form),
  );
  if (!anyRelevantForms) {
    return <></>;
  }
  return (
    <div className="max-w-full overflow-scroll">
      <table className="py-1 px-2 border border-sky-500 max-w-72 overflow-scroll">
        <thead>
          <tr>
            <th className="py-1 px-2 border border-sky-500">n-form</th>
            <th className="py-1 px-2 border border-sky-500">t-form</th>
            <th className="py-1 px-2 border border-sky-500">a-form</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "nform")?.spell}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "tform")?.spell}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "aform")?.spell}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function adjectiveKomparativSuperlativTable(word: Word) {
  const relevantForms = ["komparativ", "superlativ", "superlativ_b"];
  const anyRelevantForms = relevantForms.some((form) =>
    word?.indexes.find((it) => it.form === form),
  );
  if (!anyRelevantForms) {
    return <></>;
  }
  return (
    <div className="max-w-full overflow-scroll">
      <table className="py-1 px-2 border border-sky-500 max-w-72 overflow-scroll">
        <thead>
          <tr>
            <th className="py-1 px-2 border border-sky-500">komparativ</th>
            <th className="py-1 px-2 border border-sky-500">Obestämd superlativ</th>
            <th className="py-1 px-2 border border-sky-500">Bestämd superlativ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 px-2 border border-sky-500">
              {word?.indexes.find((it) => it.form === "komparativ")?.spell}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              <span className="text-xs">är</span>&nbsp;{word?.indexes.find((it) => it.form === "superlativ")?.spell}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              <span className="text-xs">den/det/de</span>&nbsp;{word?.indexes.find((it) => it.form === "superlativ_b")?.spell}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
