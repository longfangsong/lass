import type { RouterContext } from "@api/router";
import type { Word as DBWord, Lexeme, Word, WordIndex } from "@/types";
import { searchInDatabase } from "./search";
import { createWordWithAI } from "../aiDictionary";
import { saveWord } from "./databaseOperations";
import { unescapeObject } from "../utils";

export async function getById({ params, env }: RouterContext) {
  const word: DBWord | null = await env.DB.prepare(
    "SELECT * FROM Word WHERE id = ?",
  )
    .bind(params.id)
    .first();
  if (word === null) {
    return new Response("Word not found", { status: 404 });
  } else {
    const [lexemesResult, wordIndexesResult] = await Promise.all([
      env.DB.prepare("SELECT * FROM Lexeme WHERE word_id = ?")
        .bind(word.id)
        .all<Lexeme>(),
      env.DB.prepare("SELECT * FROM WordIndex WHERE word_id = ?")
        .bind(word.id)
        .all<WordIndex>(),
    ]);
    const lexemes = lexemesResult.results;
    const indexes = wordIndexesResult.results;
    const result: Word = { ...word, lexemes, indexes };
    return Response.json(unescapeObject(result));
  }
}

export async function search({ query, env }: RouterContext) {
  const spell = query.get("spell")!;
  const words = await searchInDatabase(env.DB, spell);
  if (
    words.length === 0 &&
    (query.get("ai") === "true" || query.get("ai") === "1")
  ) {
    const aiResult = await createWordWithAI(spell, env.GEMINI_API_KEY);
    if (aiResult) {
      await saveWord(aiResult, env.DB);
      words.push({
        id: aiResult.id,
        lemma: aiResult.lemma,
        definitions: aiResult.lexemes.map((lexeme) => lexeme.definition),
      });
    } else {
      console.error("Getting word meaning with AI failed");
    }
  }
  return Response.json(unescapeObject(words));
}
