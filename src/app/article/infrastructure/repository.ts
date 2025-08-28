import { db } from "@/app/shared/infrastructure/indexeddb";
import type { Article } from "@/types";
import type { Repository } from "../domain/repository";
import type { EntityTable } from "dexie";

const table: EntityTable<Article, "id"> = db.table("Article");

export const repository = {
  get version(): Promise<number | undefined> {
    return db.meta.get("Article").then((it) => it?.version);
  },
  async setVersion(version: number): Promise<void> {
    await db.meta.put({ table_name: "Article", version });
  },
  async count(): Promise<number> {
    return await table.count();
  },
  async bulkPut(articles: Article[]): Promise<void> {
    await table.bulkPut(articles);
  },
  async get(id: string): Promise<Article | undefined> {
    return await table.get(id);
  },
  async mostRecent(limit: number, offset: number): Promise<Article[]> {
    return await table
      .orderBy("update_time")
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },
} satisfies Repository;
