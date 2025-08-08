import type { DBWord, WordIndex, Lexeme, WordBookEntry } from "@/types";
import Dexie, { type EntityTable } from "dexie";

export class DB extends Dexie {
  readonly meta: EntityTable<
    {
      table_name: string;
      version: number;
    },
    "table_name"
  >;
  readonly word: EntityTable<DBWord & { frequency_rank?: number }, "id">;
  readonly wordIndex: EntityTable<WordIndex, "id">;
  readonly lexeme: EntityTable<Lexeme, "id">;
  readonly wordBookEntry: EntityTable<WordBookEntry, "id">;

  constructor() {
    super("lass");
    super.version(1).stores({
      meta: "table_name",
      Word: "id, lemma, update_time",
      WordIndex: "id, word_id, spell, update_time",
      Lexeme: "id, word_id, update_time",
      WordBookEntry:
        "id, word_id, update_time, passive_review_count, active_review_count, next_passive_review_time, next_active_review_time",
    });
    this.meta = this.table("meta");
    this.word = this.table("Word");
    this.wordIndex = this.table("WordIndex");
    this.lexeme = this.table("Lexeme");
    this.wordBookEntry = this.table("WordBookEntry");
    if (import.meta.env.DEV) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).db = this;
    }
  }

  async clear() {
    await Promise.all([
      this.word.clear(),
      this.wordIndex.clear(),
      this.lexeme.clear(),
      this.meta.clear(),
      this.wordBookEntry.clear(),
    ]);
  }
}

export const db = new DB();
