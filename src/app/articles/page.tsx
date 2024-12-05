"use client";

import { ListGroup, ListGroupItem } from "flowbite-react";
import { ArticlesPagination } from "./pagination";
import { fetchWithSemaphore } from "@/lib/fetch";
import { DBTypes } from "@/lib/types";

export const runtime = "edge";

export default async function Articles({
  searchParams,
}: {
  searchParams?: { page?: number };
}) {
  const offset = ((searchParams?.page || 1) - 1) * 10;
  const articlesResponse = await fetchWithSemaphore(
    `${process.env.CF_PAGES_URL || ""}/api/articles?limit=10&offset=${offset}`,);
  const articles: Array<DBTypes.ArticleMeta> = await articlesResponse.json();
  const articlesCount = parseInt(articlesResponse.headers.get('X-Total-Count') || "0");
  return (
    <div className="flex flex-col justify-center">
      <ListGroup className="w-full">
        {articles.map((article) => (
          <ListGroupItem
            href={process.env.CF_PAGES_URL + `/articles/${article.id}`}
            key={article.id}
          >
            {article.title}
          </ListGroupItem>
        ))}
      </ListGroup>
      <ArticlesPagination count={articlesCount} />
    </div>
  );
}
