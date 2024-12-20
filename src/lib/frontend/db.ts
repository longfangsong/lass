import type { Dexie as TDexie, EntityTable } from "dexie";
import { DBTypes } from "../types";

export type DB = TDexie & {
  meta: EntityTable<
    {
      table_name: string;
      version: number;
    },
    "table_name"
  >;
  word: EntityTable<DBTypes.Word, "id">;
  wordIndex: EntityTable<DBTypes.WordIndex, "id">;
  lexeme: EntityTable<DBTypes.Lexeme, "id">;
};

let db: DB | null = null;

export async function getDB() {
  if (db === null) {
    const Dexie = (await import("dexie")).Dexie;
    db = new Dexie("lass") as TDexie & DB;
    db.version(1).stores({
      meta: "table_name",
      word: "id, lemma, update_time",
      wordIndex: "id, word_id, spell, update_time",
      lexeme: "id, word_id, update_time",
    });
  }
  return db;
}
