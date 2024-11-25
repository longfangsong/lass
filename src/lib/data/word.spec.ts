import { expect, test, describe } from "vitest";
import { env } from "cloudflare:test";
import { getWord, getWordByAI, getWordsByIndex, searchWord } from "./word";
import { Word } from "../types";

describe("Test word fetching", () => {
  test("should be able to search the word (full match)", async () => {
    const result = await searchWord(env.DB, "a");
    expect(result.length).toBeGreaterThanOrEqual(10);
    const firstResult = result[0];
    expect(firstResult.lemma).toBe("a");
    expect(firstResult.definitions).contains("första bokstaven i alfabetet");
    expect(firstResult.definitions).contains(
      "the first letter of the alphabet",
    );
  });

  test("should show all direct matches", async () => {
    const result = await searchWord(env.DB, "av");
    const directMatches = result.filter((it) => it.lemma === "av");
    expect(directMatches.length).toBe(2);
  });

  test("should show other form of word first", async () => {
    const result = await searchWord(env.DB, "abnormt");
    expect(result[0].lemma).toBe("abnorm");
  });

  test("should be able to search the word (prefix)", async () => {
    const result = await searchWord(env.DB, "abstr");
    expect(result.length).toBe(3);
    expect(result.map((it) => it.lemma)).contains("abstrakt");
  });

  test("should be able to get the word", async () => {
    const searchResult = await searchWord(env.DB, "barn");
    const wordId = searchResult[0].id;
    const result: Word | null = await getWord(env.DB, wordId);
    expect(result).not.toBeNull();
    expect(result?.lemma).toBe("barn");
    expect(result?.part_of_speech).toBe("subst.");
    const obestPlural = result?.indexes.find((it) => it.form === "obest.f.pl.");
    expect(obestPlural?.spell).toBe("barn");
    const bestSing = result?.indexes.find((it) => it.form === "best.f.sing.");
    expect(bestSing?.spell).toBe("barnet");
    const otherRelated = result?.indexes.find((it) => it.spell === "barnbok");
    expect(otherRelated?.form).toBe(null);
    const meanings = result?.lexemes;
    expect(meanings?.length).not.toBe(0);
  });

  test("should be able to get the words by index", async () => {
    let searchResult = await getWordsByIndex(env.DB, "barnen");
    expect(searchResult).not.toBeNull();
    expect(searchResult?.length).toBe(1);
    expect(searchResult![0].lemma).toBe("barn");

    searchResult = await getWordsByIndex(env.DB, "abonnerads");
    expect(searchResult).not.toBeNull();
    expect(searchResult?.length).toBe(1);
    expect(searchResult![0].lemma).toBe("abonnerar");
  });

  test("should do unescaping", async () => {
    const result = await searchWord(env.DB, "absorberar");
    const definitions = result[0].definitions;
    expect(
      definitions.find((it) => it.includes("someone's")),
    ).not.toBeUndefined();
  });

  test("should be able to get the word by index", async () => {
    const result = await getWordsByIndex(env.DB, "sitt");
    const firstResult = result![0];
    expect(firstResult.lemma).toBe("sin");
  });
});
