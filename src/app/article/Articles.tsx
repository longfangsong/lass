import { ListGroup, ListGroupItem } from "flowbite-react";
import { DBTypes } from "@/lib/types";
import { useEffect, useState } from "react";
import { PAGE_SIZE } from "@/lib/backend/review_progress";
import { Pagination } from "flowbite-react";
import { useSearchParams, useNavigate } from "react-router";
import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";

function Skeleton() {
  return (
    <div role="status" className="max-w-sm animate-pulse">
      <div className="h-8 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function Articles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * 10;
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Array<DBTypes.ArticleMeta>>([]);
  const [articlesCount, setArticlesCount] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { articles, count: articlesCount } =
        await localFirstDataSource.getArticlesAndCount(offset, 10);
      setArticles(articles);
      setArticlesCount(articlesCount);
      setLoading(false);
    })();
  }, [offset]);

  return (
    <div className="flex flex-col justify-center">
      <ListGroup className="w-full">
        {loading ? (
          <Skeleton />
        ) : (
          articles.map((article) => (
            <ListGroupItem href={`/articles/${article.id}`} key={article.id}>
              {article.title}
            </ListGroupItem>
          ))
        )}
      </ListGroup>
      <div className="flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(articlesCount / PAGE_SIZE)}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams);
            params.set("page", page.toString());
            navigate(`?${params.toString()}`);
          }}
        />
      </div>
    </div>
  );
}
