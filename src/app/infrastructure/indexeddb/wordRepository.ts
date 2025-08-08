import type { DBWord, Word } from "@app/types";
import { db } from ".";
import type { Lexeme, WordIndex } from "@/types";
import type { Repository } from "@/app/domain/repository/word";

export const repository = {
  get basicInfoVersion(): Promise<number | undefined> {
    return db.meta.get("Word").then((it) => it?.version);
  },
  async bulkPutBasicInfo(words: DBWord[]) {
    // updated word has no frequency for now
    await db.word.bulkPut(words);
  },
  async setBasicInfoVersion(version: number) {
    await db.meta.put({ table_name: "Word", version });
  },
  get indexVersion(): Promise<number | undefined> {
    return db.meta.get("WordIndex").then((it) => it?.version);
  },
  async bulkPutIndex(wordIndex: WordIndex[]) {
    db.wordIndex.bulkPut(wordIndex);
  },
  async setIndexVersion(version: number) {
    db.meta.put({ table_name: "WordIndex", version });
  },
  get lexemeVersion(): Promise<number | undefined> {
    return db.meta.get("Lexeme").then((it) => it?.version);
  },
  async bulkPutLexeme(lexeme: Lexeme[]) {
    db.lexeme.bulkPut(lexeme);
  },
  async setLexemeVersion(version: number) {
    db.meta.put({ table_name: "Lexeme", version });
  },
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
} satisfies Repository;
