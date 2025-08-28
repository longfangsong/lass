import type { Article } from "@/types";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@app/shared/presentation/components/ui/pagination";
import { cn } from "@app/shared/presentation/lib/utils";
import { repository } from "../../infrastructure/repository";

const PAGE_SIZE = 10;

export function All() {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * PAGE_SIZE;
  const [articles, setArticles] = useState<Array<Article>>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  useEffect(() => {
    (async () => {
      const [count, thisPage] = await Promise.all([
        repository.count(),
        repository.mostRecent(PAGE_SIZE, offset),
      ]);
      setArticlesCount(count);
      setArticles(thisPage);
    })();
  }, [offset]);
  return (
    <>
      <div className="mb-2">
        {articles.map((article) => (
          <a
            className="block bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 border-solid
            first:rounded-t-lg last:rounded-b-lg border-b-1 last:border-b-0"
            key={article.id}
            href={`/article/${article.id}`}
          >
            {article.title}
          </a>
        ))}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={cn({
                "text-gray-300 hover:text-gray-300 dark:text-gray-600 dark:hover:text-gray-600 hover:bg-white dark:hover:bg-inherit cursor-not-allowed":
                  page === 1,
              })}
              href={page === 1 ? "#" : `/articles?page=${page - 1}`}
              size={undefined}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href={`/articles?page=1`} size={undefined}>
              1
            </PaginationLink>
          </PaginationItem>
          {Math.ceil(articlesCount / PAGE_SIZE) > 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationLink
              href={`/articles?page=${Math.ceil(articlesCount / PAGE_SIZE)}`}
              size={undefined}
            >
              {Math.ceil(articlesCount / PAGE_SIZE)}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className={cn({
                "text-gray-300 hover:text-gray-300 dark:text-gray-600 dark:hover:text-gray-600 hover:bg-white dark:hover:bg-inherit cursor-not-allowed":
                  page >= Math.ceil(articlesCount / PAGE_SIZE),
              })}
              href={
                page >= Math.ceil(articlesCount / PAGE_SIZE)
                  ? "#"
                  : `/articles?page=${page + 1}`
              }
              size={undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
