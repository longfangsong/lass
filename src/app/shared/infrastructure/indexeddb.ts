import Dexie, { type EntityTable } from "dexie";

export class DB extends Dexie {
  readonly meta: EntityTable<
    {
      table_name: string;
      version: number;
    },
    "table_name"
  >;
  constructor() {
    super("lass");
    super.version(1).stores({
      meta: "table_name",
      Article: "id, update_time",
      Word: "id, lemma, update_time",
      WordIndex: "id, word_id, spell, update_time",
      Lexeme: "id, word_id, update_time",
      WordBookEntry:
        "id, word_id, update_time, passive_review_count, active_review_count, next_passive_review_time, next_active_review_time",
    });
    this.meta = this.table("meta");
    if (import.meta.env.DEV) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).db = this;
    }
  }
}

export const db = new DB();
