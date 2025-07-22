import type { WordSearchResult } from "@/types";
import { unescapeObject } from "@api/utils";

export async function searchInDatabase(
  db: D1Database,
  spell: string,
): Promise<Array<WordSearchResult>> {
  const result = await db
    .prepare(
      `SELECT FoundWords.id, FoundWords.lemma, Lexeme.definition, Lexeme.source FROM (
          SELECT 0 as source_id, Word.id, Word.lemma, length (lemma) FROM Word WHERE Word.lemma=?1
          UNION
          SELECT 1 as source_id, Word.id, Word.lemma, length (lemma) FROM Word, WordIndex
            WHERE Word.id=WordIndex.word_id AND WordIndex.spell=?1 AND WordIndex.form is not null
          UNION
          SELECT 2 as source_id, Word.id, Word.lemma, length (lemma) FROM Word WHERE Word.lemma LIKE ?2
          UNION
          SELECT 3 as source_id, Word.id, Word.lemma, length (lemma) FROM Word, WordIndex WHERE Word.id=WordIndex.word_id AND WordIndex.spell LIKE ?2
          ORDER BY length (lemma)
          LIMIT 20
      ) AS FoundWords, Lexeme
      WHERE FoundWords.id=Lexeme.word_id
      GROUP BY FoundWords.lemma, Lexeme.definition
      ORDER BY FoundWords.source_id ASC;`,
    )
    .bind(spell, `${spell}%`)
    .all<{ id: string; lemma: string; definition: string }>();
  if (!result.success) throw new Error(result.error);
  const groupedResults: Record<string, WordSearchResult> = {};
  for (const row of result.results) {
    if (!groupedResults[row.id]) {
      groupedResults[row.id] = {
        id: row.id,
        lemma: row.lemma,
        definitions: [],
      };
    }
    groupedResults[row.id].definitions.push(row.definition);
  }
  return unescapeObject(Object.values(groupedResults));
}
