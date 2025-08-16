import type { Repository } from "@/app/domain/repository/article";
import type { Article } from "@/types";
import { db } from ".";

export const repository = {
  get version(): Promise<number | undefined> {
    return db.meta.get("Article").then((it) => it?.version);
  },
  async setVersion(version: number): Promise<void> {
    await db.meta.put({ table_name: "Article", version });
  },
  async count(): Promise<number> {
    return await db.article.count();
  },
  async bulkPut(articles: Article[]): Promise<void> {
    await db.article.bulkPut(articles);
  },
  async mostRecent(limit: number, offset: number): Promise<Article[]> {
    return await db.article
      .orderBy("update_time")
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },
} satisfies Repository;
