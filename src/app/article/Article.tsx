import { toWordsAndPunctuations } from "@/lib/backend/article";
import { Button } from "flowbite-react";
import { Link, useParams } from "react-router";
import React, { useEffect, useState } from "react";
import { DBTypes } from "@/lib/types";
import { Popover } from "flowbite-react";
import { Player } from "./Player";
import { PopoverContent } from "./PopoverContent";

export function Word({ children }: { children: string }) {
  return (
    <Popover content={<PopoverContent spell={children} />} trigger="click">
      <a
        href="#"
        className="hover:bg-sky-300 dark:hover:bg-sky-700 cursor-pointer"
      >
        {children}
      </a>
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
  const [article, setArticle] = useState<DBTypes.Article | null>(null);
  const [sentences, setSentences] = useState<Array<Array<string>>>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/articles/${id}`);
      const article: DBTypes.Article = await response.json();
      setArticle(article);
      setSentences(toWordsAndPunctuations(article.content));
    })();
  }, [id]);

  if (!article) return null;

  return (
    <div className="p-1 text-wrap max-w-full">
      <h1 className="text-4xl font-extrabold dark:text-white">
        {article.title}
      </h1>
      <Button
        className="w-fit my-1"
        as={Link}
        to={`https://sverigesradio.se${article.url}`}
      >
        On origin site
      </Button>
      <Player url={article.voice_url} />
      {sentences.map((sentence, i) => (
        <Sentence key={i} content={sentence} />
      ))}
    </div>
  );
} 