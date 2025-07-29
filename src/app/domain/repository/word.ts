import { db } from "@/app/infrastructure/db";
import type { Word } from "@app/types";

export const repository = {
  get: async (id: string): Promise<Word | undefined> => {
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
  },
};
