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
          
          {/* Calculate total pages, minimum 1 to show current page */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(articlesCount / PAGE_SIZE));
            
            // Always show page 1 if not current page and there are multiple pages
            if (page > 1 && totalPages > 1) {
              return (
                <PaginationItem>
                  <PaginationLink href={`/articles?page=1`} size={undefined}>
                    1
                  </PaginationLink>
                </PaginationItem>
              );
            }
            
            return null;
          })()}
          
          {/* Show ellipsis if current page is far from page 1 */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(articlesCount / PAGE_SIZE));
            if (page > 3 && totalPages > 3) {
              return (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })()}
          
          {/* Show current page - 1 if it exists and isn't page 1 */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(articlesCount / PAGE_SIZE));
            if (page > 2 && totalPages > 1) {
              return (
                <PaginationItem>
                  <PaginationLink href={`/articles?page=${page - 1}`} size={undefined}>
                    {page - 1}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            return null;
          })()}
          
          {/* Always show current page and mark it as active */}
          <PaginationItem>
            <PaginationLink 
              href={`/articles?page=${page}`} 
              size={undefined}
              isActive={true}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
          
          {/* Show current page + 1 if it exists and isn't the last page */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(articlesCount / PAGE_SIZE));
            if (page < totalPages - 1 && totalPages > 1) {
              return (
                <PaginationItem>
                  <PaginationLink href={`/articles?page=${page + 1}`} size={undefined}>
                    {page + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            return null;
          })()}
          
          {/* Show ellipsis if current page is far from last page */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(articlesCount / PAGE_SIZE));
            if (page < totalPages - 2 && totalPages > 3) {
              return (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })()}
          
          {/* Always show last page if not current page and there are multiple pages */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(articlesCount / PAGE_SIZE));
            if (page < totalPages && totalPages > 1) {
              return (
                <PaginationItem>
                  <PaginationLink
                    href={`/articles?page=${totalPages}`}
                    size={undefined}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            return null;
          })()}
          
          <PaginationItem>
            <PaginationNext
              className={cn({
                "text-gray-300 hover:text-gray-300 dark:text-gray-600 dark:hover:text-gray-600 hover:bg-white dark:hover:bg-inherit cursor-not-allowed":
                  page >= Math.ceil(articlesCount / PAGE_SIZE) || articlesCount === 0,
              })}
              href={
                page >= Math.ceil(articlesCount / PAGE_SIZE) || articlesCount === 0
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
