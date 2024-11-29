import { getArticleCount, getArticleMetas } from "@/lib/data/article";
import { getDB } from "@/lib/db";
import { ListGroup, ListGroupItem } from "flowbite-react";
import { ArticlesPagination } from "./pagination";

export const runtime = "edge";

export default async function Articles({
  searchParams,
}: {
  searchParams?: { page?: number };
}) {
  const [release, db] = await getDB();
  const articlesCount = await getArticleCount(db);
  const offset = ((searchParams?.page || 1) - 1) * 10;
  const articles = await getArticleMetas(db, 10, offset);
  release();
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
