import type { Lexeme, Word } from "@/types";
import type { RouterContext } from "../router";
import { getLexemeWithAI } from "../aiDictionary";
import { handleLexemeUpdate } from "./translateExampleSentence";

export async function getByWordId({ env, query }: RouterContext) {
  const word_id = query.get("word_id")!;
  let spell = query.get("spell");
  const lexemesResult = await env.DB.prepare(
    "SELECT * FROM Lexeme WHERE word_id = ?",
  )
    .bind(word_id)
    .all<Lexeme>();
  if (
    lexemesResult.success &&
    lexemesResult.results.length > 0 &&
    !lexemesResult.results.every((lexeme) => lexeme.source === "lexin-swe")
  ) {
    return Response.json(lexemesResult.results);
  } else {
    if (!spell) {
      const wordResult = await env.DB.prepare("SELECT * FROM Word WHERE id = ?")
        .bind(word_id)
        .first<Word>();
      spell = wordResult?.lemma || null;
    }
    if (!spell) {
      return new Response("Word not found", { status: 404 });
    }
    const aiResult = await getLexemeWithAI(word_id, spell, env.GEMINI_API_KEY);
    if (aiResult) {
      await env.DB.prepare(
        "INSERT INTO Lexeme (id, word_id, definition, example, example_meaning, source, update_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          aiResult.id,
          aiResult.word_id,
          aiResult.definition,
          aiResult.example,
          aiResult.example_meaning,
          aiResult.source,
          aiResult.update_time,
        )
        .run();
      return Response.json([aiResult]);
    } else {
      return new Response("Get lexeme from AI failed", { status: 500 });
    }
  }
}

/**
 * PATCH /lexemes/:lexeme_id route handler
 */
export async function updateLexeme({ request, env, params }: RouterContext): Promise<Response> {
  const lexemeId = params.lexeme_id;

  if (!lexemeId) {
    return new Response(
      JSON.stringify({ error: 'Missing lexeme_id parameter' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return handleLexemeUpdate(request, env, lexemeId);
}