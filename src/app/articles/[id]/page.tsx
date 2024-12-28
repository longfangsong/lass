import { getArticle, toWordsAndPunctuations } from "@/lib/backend/article";
import { Button } from "flowbite-react";
import Link from "next/link";
import React from "react";
import { Word } from "./word";
import { Player } from "./Player";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

async function Sentence({ content }: { content: Array<string> }) {
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

export default async function Article({
  params: { id },
}: {
  params: { id: string };
}) {
  const db = getRequestContext().env.DB;
  const article = (await getArticle(db, id))!;
  const sentences = toWordsAndPunctuations(article.content);

  return (
    <div className="p-1 text-wrap max-w-full">
      <h1 className="text-4xl font-extrabold dark:text-white">
        {article.title}
      </h1>
      <Button
        className="w-fit my-1"
        as={Link}
        href={`https://sverigesradio.se${article.url}`}
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
