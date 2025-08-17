import type { DBWord, Lexeme, WordIndex } from "@/types";
import type { Word } from "@app/types";

// todo: separate into Sync
export interface Repository {
  readonly basicInfoVersion: Promise<number | undefined>;
  readonly indexVersion: Promise<number | undefined>;
  readonly lexemeVersion: Promise<number | undefined>;

  bulkPutBasicInfo(words: DBWord[]): Promise<void>;
  bulkPutIndex(wordIndex: WordIndex[]): Promise<void>;
  bulkPutLexeme(lexeme: Lexeme[]): Promise<void>;

  setBasicInfoVersion(version: number): Promise<void>;
  setIndexVersion(version: number): Promise<void>;
  setLexemeVersion(version: number): Promise<void>;

  get(id: string): Promise<Word | undefined>;
  put(word: Word): Promise<void>;
  getWordsByIndexSpell(spell: string): Promise<Word[]>;
}
