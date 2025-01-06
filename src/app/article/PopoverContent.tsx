import SaveToWordBookButton from "@/app/components/SaveToWordBook";
import WordDetail from "@/app/components/WordDetail";
import { Word } from "@/lib/types";
import { HR, Spinner } from "flowbite-react";
import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";

export function PopoverContent({ spell }: { spell: string }) {
  const [words, setWords] = useState<Array<Word> | null>(null);
  useEffect(() => {
    (async () => {
      const queryResult = await localFirstDataSource.getWordsByIndexSpell(spell);
      setWords(queryResult);
    })();
  }, [spell]);
  const { user } = useAuth();

  if (words === null) {
    return (
      <div className="p-2">
        <Spinner aria-label="Loading..." size="xl" />
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
                buttons={
                  user
                    ? [
                        <SaveToWordBookButton
                          key={`save-${word.id}`}
                          word_id={word.id}
                          className="ml-3"
                        />,
                      ]
                    : []
                }
              />
            </div>
            {index < words.length - 1 ? <HR className="m-0 border" /> : <></>}
          </React.Fragment>
        ))}
      </div>
    );
  }
} 