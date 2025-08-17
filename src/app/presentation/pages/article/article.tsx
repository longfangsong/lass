import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import React from "react";
import WordDetail from "../../components/word/wordDetail";
import SaveToWordBookButton from "../../components/word/saveToWordBook";
import { Separator } from "../../components/ui/separator";
import { useAuth } from "../../hooks/useAuth";
import { LoaderCircle } from "lucide-react";
import type { Word } from "@/app/types";
import { repository as wordRepository } from "@/app/infrastructure/indexeddb/wordRepository";
import { useParams } from "react-router";
import { toWordsAndPunctuations } from "@/app/domain/functions";
import { Button } from "../../components/ui/button";
import type { Article, WordSearchResult } from "@/types";
import { repository } from "@/app/infrastructure/indexeddb/articleRepository";
import { cn } from "../../lib/utils";
import PlayButton from "../../components/playAudioButton";

export function WordPopoverContent({ spell }: { spell: string }) {
  const [words, setWords] = useState<Array<Word> | null>(null);
  useEffect(() => {
    (async () => {
      const queryResult = await wordRepository.getWordsByIndexSpell(spell);
      setWords(queryResult);
    })();
  }, [spell]);
  const { user } = useAuth();
  const searchWithAI = async () => {
    setWords(null);
    const response = await fetch(
      `/api/words?spell=${encodeURIComponent(spell)}&ai=true`,
    );
    if (!response.ok) {
      throw new Error("Search request failed");
    }
    const searchResults: Array<WordSearchResult> = await response.json();

    const result = await Promise.all(
      searchResults.map(async (it) => {
        const wordInfo = await fetch(`/api/words/${it.id}`);
        if (!wordInfo.ok) {
          throw new Error("Failed to fetch word details");
        }
        const word: Word = await wordInfo.json();
        await wordRepository.put(word);
        return word;
      }),
    );
    setWords(result);
  };
  if (words === null) {
    return (
      <div className="p-2 flex justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  } else if (words.length === 0) {
    return (
      <div className="p-2 flex justify-center">
        <Button onClick={searchWithAI} variant="outline" size="sm">
          Search with AI
        </Button>
      </div>
    );
  } else {
    return (
      <div className="max-h-72 max-w-96 overflow-scroll">
        {words?.map((word, index) => (
          <React.Fragment key={word.id}>
            <div
              className={cn(
                { "rounded-t-md": index === 0 },
                { "rounded-b-md": index === words.length - 1 },
                "hover:bg-sky-100 dark:hover:bg-slate-700 p-2",
              )}
            >
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
                        <PlayButton voice={word} />,
                      ]
                    : []
                }
              />
            </div>
            {index < words.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>
    );
  }
}

export function Word({ children }: { children: string }) {
  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer">{children}</PopoverTrigger>
      <PopoverContent className="p-0">
        <WordPopoverContent spell={children} />
      </PopoverContent>
    </Popover>
  );
}

function Sentence({ content }: { content: Array<string> }) {
  return (
    <div className="flex flex-wrap">
      {content.map((w, i) => {
        if (w === "." || w === "?" || w === "!" || w === '"') {
          return <span key={i}>{w}</span>;
        } else if (w === "," || w === "–" || w.match(/^\d/)) {
          return (
            <React.Fragment key={i}>
              <span>{w}</span>&nbsp;
            </React.Fragment>
          );
        } else if (
          content[i + 1] === "," ||
          content[i + 1] === "." ||
          content[i + 1] === "?" ||
          content[i + 1] === "!" ||
          content[i + 1] === '"'
        ) {
          return <Word key={i}>{w}</Word>;
        } else {
          return (
            <React.Fragment key={i}>
              <Word key={i}>{w}</Word>
              &nbsp;
            </React.Fragment>
          );
        }
      })}
    </div>
  );
}

export default function Article() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [sentences, setSentences] = useState<Array<Array<string>>>([]);

  useEffect(() => {
    (async () => {
      const article = await repository.get(id!);
      setArticle(article!);
      setSentences(toWordsAndPunctuations(article!.content || ""));
    })();
  }, [id]);

  if (!article) return null;

  return (
    <div className="p-1 text-wrap max-w-full">
      <h1 className="text-4xl font-extrabold dark:text-white">
        {article.title}
      </h1>
      <Button asChild>
        <a
          className="w-fit my-1"
          href={`https://sverigesradio.se${article.url}`}
        >
          On origin site
        </a>
      </Button>
      {/*<Player url={article.voice_url} />*/}
      {sentences.map((sentence, i) => (
        <Sentence key={i} content={sentence} />
      ))}
    </div>
  );
}
