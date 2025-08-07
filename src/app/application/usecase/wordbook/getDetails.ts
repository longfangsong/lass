import { db } from "@app/infrastructure/db";
import type { WordBookEntry } from "@/types";
import type { WordBookEntryWithDetails } from "@app/types";

export async function getWordBookEntryDetail(
  entry: WordBookEntry,
): Promise<WordBookEntryWithDetails> {
  const [word, indexes, lexemes] = await Promise.all([
    db.word.get(entry.word_id),
    db.wordIndex.where("word_id").equals(entry.word_id).toArray(),
    db.lexeme.where("word_id").equals(entry.word_id).toArray(),
  ]);
  const { id: _, ...wordWithoutId } = word!;
  return {
    ...entry,
    ...wordWithoutId,
    indexes,
    lexemes,
  };
}
