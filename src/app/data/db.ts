import type { DBWord, WordIndex, Lexeme } from "@/types";
import Dexie, { type EntityTable } from "dexie";

export class DB extends Dexie {
  readonly meta: EntityTable<
    {
      table_name: string;
      version: number;
    },
    "table_name"
  >;
  readonly word: EntityTable<DBWord, "id">;
  readonly wordIndex: EntityTable<WordIndex, "id">;
  readonly lexeme: EntityTable<Lexeme, "id">;

  constructor() {
    super("lass");
    super.version(1).stores({
      meta: "table_name",
      Word: "id, lemma, update_time",
      WordIndex: "id, word_id, spell, update_time",
      Lexeme: "id, word_id, update_time",
    });
    this.meta = this.table("meta");
    this.word = this.table("Word");
    this.wordIndex = this.table("WordIndex");
    this.lexeme = this.table("Lexeme");
  }

  clear() {
    this.word.clear();
    this.wordIndex.clear();
    this.lexeme.clear();
    this.meta.clear();
  }
}

export const db = new DB();
