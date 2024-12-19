"use client";

import { ListGroup, ListGroupItem } from "flowbite-react";
import { ArticlesPagination } from "./pagination";
import { fetchWithSemaphore } from "@/lib/fetch";
import { DBTypes } from "@/lib/types";
import { useEffect, useState } from "react";

export const runtime = "edge";

export default function Articles({
  searchParams,
}: {
  searchParams?: { page?: number };
}) {
  const offset = ((searchParams?.page || 1) - 1) * 10;
  const [articles, setArticles] = useState<Array<DBTypes.ArticleMeta>>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  useEffect(() => {
    (async () => {
      const articlesResponse = await fetchWithSemaphore(
        `${process.env.CF_PAGES_URL || ""}/api/articles?limit=10&offset=${offset}`,);
      const articles: Array<DBTypes.ArticleMeta> = await articlesResponse.json();
      const articlesCount = parseInt(articlesResponse.headers.get('X-Total-Count') || "0");
      setArticles(articles);
      setArticlesCount(articlesCount);
    })();
  }, [offset]);
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
