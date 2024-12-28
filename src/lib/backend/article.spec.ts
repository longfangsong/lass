import { expect, test, describe, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import { getArticle, getArticleMetas, toWordsAndPunctuations } from "./article";

describe("Test article fetching", () => {
  beforeAll(async () => {
    const stmt = env.DB.prepare(
      `INSERT INTO Article (id, title, content, create_time, url, voice_url)VALUES (?, ?, ?, ?, ?, ?)`,
    );
    await Promise.all([
      stmt
        .bind(
          "1",
          "Test article 1",
          "This is a test article",
          3,
          "https://example.com",
          "https://example.com/voice.mp3",
        )
        .run(),
      stmt
        .bind(
          "2",
          "Test article 2",
          "This is a test article",
          1,
          "https://example.com",
          "https://example.com/voice.mp3",
        )
        .run(),
      stmt
        .bind(
          "3",
          "Test article 3",
          "This is a test article",
          2,
          "https://example.com",
          "https://example.com/voice.mp3",
        )
        .run(),
    ]);
  });

  test("should be able to list the article metas", async () => {
    let metas = await getArticleMetas(env.DB, 2, 0);
    expect(metas.length).toBe(2);
    expect(metas[0].id).toBe("1");
    expect(metas[0].title).toBe("Test article 1");
    expect(metas[1].id).toBe("3");
    expect(metas[1].title).toBe("Test article 3");
    metas = await getArticleMetas(env.DB, 2, 1);
    expect(metas.length).toBe(2);
    expect(metas[0].id).toBe("3");
    expect(metas[1].id).toBe("2");
  });

  test("should be able to get the article", async () => {
    const article = await getArticle(env.DB, "1");
    expect(article?.id).toBe("1");
    expect(article?.title).toBe("Test article 1");
    expect(article?.content).toBe("This is a test article");
    expect(article?.create_time).toBe(3);
    expect(article?.url).toBe("https://example.com");
    expect(article?.voice_url).toBe("https://example.com/voice.mp3");
  });

  test("should be seperate article into words and punctuations", async () => {
    const article =
      'This is a test article. This is a test article...This is a test article! This is a test article? - This is a test article. "This is a test article"';
    const wordsAndPunctuations = toWordsAndPunctuations(article);
    expect(wordsAndPunctuations.length).toBe(6);
    expect(wordsAndPunctuations[0].length).toBe(6);
    expect(wordsAndPunctuations[0][5]).toBe(".");
    expect(wordsAndPunctuations[1][5]).toBe("...");
    expect(wordsAndPunctuations[4][0]).toBe("-");
    expect(wordsAndPunctuations[5][0]).toBe('"');
    expect(wordsAndPunctuations[5][6]).toBe('"');
  });
});
