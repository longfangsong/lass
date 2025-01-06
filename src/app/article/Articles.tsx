import { ListGroup, ListGroupItem } from "flowbite-react";
import { fetchWithSemaphore } from "@/lib/fetch";
import { DBTypes } from "@/lib/types";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ArticlesPagination } from "./ArticlesPagination";

export default function Articles() {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * 10;
  const [articles, setArticles] = useState<Array<DBTypes.ArticleMeta>>([]);
  const [articlesCount, setArticlesCount] = useState(0);

  useEffect(() => {
    (async () => {
      const articlesResponse = await fetchWithSemaphore(
        `/api/articles?limit=10&offset=${offset}`,
      );
      const articles: Array<DBTypes.ArticleMeta> = await articlesResponse.json();
      const articlesCount = parseInt(
        articlesResponse.headers.get("X-Total-Count") || "0",
      );
      setArticles(articles);
      setArticlesCount(articlesCount);
    })();
  }, [offset]);

  return (
    <div className="flex flex-col justify-center">
      <ListGroup className="w-full">
        {articles.map((article) => (
          <ListGroupItem
            href={`/articles/${article.id}`}
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