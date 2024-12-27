"use client";

import { SaveToWordBookButton } from "@/app/_components/SaveToWordBook";
import { WordDetail } from "@/app/_components/WordDetail";
import { Word } from "@/lib/types";
import { HR, Spinner } from "flowbite-react";
import React from "react";
import { useEffect, useState } from "react";

export function PopoverContent({ spell }: { spell: string }) {
  const [words, setWords] = useState<Array<Word> | null>(null);
  useEffect(() => {
    (async () => {
      const { localFirstDataSource } = await import(
        "@/lib/frontend/datasource/localFirst"
      );
      const queryResult = await localFirstDataSource.getWordsByIndexSpell(spell);
      setWords(queryResult);
    })();
  }, [spell]);
  if (words === null) {
    return (
      <div className="p-2">
        <Spinner aria-label="Spinner button example" size="xl" />
      </div>
    );
  } else {
    return (
      <div className="max-h-72 max-w-96 overflow-scroll">
        {words?.map((word, index) => (
          <React.Fragment key={word.id}>
            <div className="hover:bg-sky-100 dark:hover:bg-slate-700 p-2">
              <h2 className="text-xl font-semibold">{word.lemma}</h2>
              <WordDetail
                className="max-w-96 overflow-scroll"
                word={word}
                buttons={[
                  <SaveToWordBookButton word_id={word.id} className="ml-3" />,
                ]}
              />
            </div>
            {index < words.length - 1 ? <HR className="m-0 border" /> : <></>}
          </React.Fragment>
        ))}
      </div>
    );
  }
}
