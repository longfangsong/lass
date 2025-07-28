import { db } from "@/app/infrastructure/db";
import type { Word } from "@/types";

export async function getWordById(
  id: string,
): Promise<undefined | (Word & { frequency_rank?: number })> {
  const [word, indexes, lexemes] = await Promise.all([
    db.word.get(id),
    db.wordIndex.where("word_id").equals(id).toArray(),
    db.lexeme.where("word_id").equals(id).toArray(),
  ]);
  if (!word) return undefined;
  return {
    ...word,
    indexes,
    lexemes,
  };
}
