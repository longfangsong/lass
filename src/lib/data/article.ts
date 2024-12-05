import { DBTypes } from "../types";

export async function getArticleMetas(
  db: D1Database,
  limit: number,
  offset: number,
): Promise<Array<DBTypes.ArticleMeta>> {
  const result = await db
    .prepare(
      `SELECT Article.id, Article.title
      FROM Article
      ORDER BY Article.create_time DESC
      LIMIT ?1
      OFFSET ?2;`,
    )
    .bind(limit, offset)
    .all<DBTypes.ArticleMeta>();
  if (!result.success) throw new Error(result.error);
  return result.results;
}

export async function getArticle(
  db: D1Database,
  id: string,
): Promise<DBTypes.Article | null> {
  return await db
    .prepare(
      `SELECT Article.id, Article.title, Article.content, Article.create_time, Article.url, Article.voice_url
      FROM Article
      WHERE Article.id = ?1;`,
    )
    .bind(id)
    .first<DBTypes.Article>();
}

export async function getArticleCount(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count
      FROM Article;`,
    )
    .first<{ count: number }>();
  return result?.count || 0;
}

export async function getArticleMetasUpdatedAfter(
  db: D1Database,
  timestamp: number,
  limit: number,
): Promise<Array<DBTypes.ArticleMeta>> {
  const result = await db
    .prepare(
      `SELECT Article.id, Article.title
      FROM Article
      WHERE Article.update_time > ?1
      ORDER BY Article.create_time DESC
      LIMIT ?2;`,
    )
    .bind(timestamp, limit)
    .all<DBTypes.ArticleMeta>();
  if (!result.success) throw new Error(result.error);
  return result.results;
}

export function toWordsAndPunctuations(article: string): Array<Array<string>> {
  const wordsAndPunctuations = article
    .split(/(\s+)|(\.\.\.)|(\.)/)
    .filter((x) => x !== undefined && x.trim().length > 0);
  let result: Array<Array<string>> = [[]];
  for (let wordAndPunctuation of wordsAndPunctuations) {
    if (wordAndPunctuation.endsWith("...")) {
      result[result.length - 1].push(wordAndPunctuation.slice(0, -3), "...");
      result.push([]);
    } else if (
      wordAndPunctuation.startsWith('"') ||
      wordAndPunctuation.startsWith("-")
    ) {
      result.push([wordAndPunctuation[0], wordAndPunctuation.slice(1)]);
    } else if (
      wordAndPunctuation.endsWith(",") ||
      wordAndPunctuation.endsWith(";")
    ) {
      result[result.length - 1].push(
        wordAndPunctuation.slice(0, -1),
        wordAndPunctuation[wordAndPunctuation.length - 1],
      );
    } else if (
      wordAndPunctuation.endsWith(".") ||
      wordAndPunctuation.endsWith("?") ||
      wordAndPunctuation.endsWith("!") ||
      wordAndPunctuation.endsWith('"')
    ) {
      result[result.length - 1].push(
        wordAndPunctuation.slice(0, -1),
        wordAndPunctuation[wordAndPunctuation.length - 1],
      );
      result.push([]);
    } else {
      result[result.length - 1].push(wordAndPunctuation);
    }
  }
  result = result.map((it) => it.filter((it) => it.trim().length > 0));
  return result.filter((it) => it.length > 0);
}
