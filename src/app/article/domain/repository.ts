import type { Article } from "@/types";

export interface Repository {
  readonly version: Promise<number | undefined>;
  setVersion(version: number): Promise<void>;

  count(): Promise<number>;
  bulkPut(articles: Article[]): Promise<void>;
  get(id: string): Promise<Article | undefined>;
  mostRecent(limit: number, offset: number): Promise<Article[]>;
}
