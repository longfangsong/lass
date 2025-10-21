import { db } from "@/app/shared/infrastructure/indexeddb";
import type { InitableTable, MetaTable, SyncableTable, TwoWaySyncableTable } from "../domain/types";
import type { Article, Lexeme, WordBookEntry, WordIndex } from "@/types";
import { millisecondsInDay } from "date-fns/constants";
import type { Word } from "@/app/types";
import { hoursToMilliseconds, minutesToMilliseconds } from "date-fns";

export const metaTable: MetaTable = {
  getVersion: async function (table: string): Promise<number | undefined> {
    return (await db.table("meta").get(table))?.version;
  },
  setVersion: async function (table: string, version: number): Promise<void> {
    await db.table("meta").put({ table_name: table, version });
  },
};

export const articleTable: SyncableTable<Article> = {
  name: "Article",
  autoSyncInterval: hoursToMilliseconds(3),
  batchSize: 10,
  bulkPut: async function (data: Article[]): Promise<void> {
    await db.table("Article").bulkPut(data);
  },
};

export const wordTable: InitableTable<Word> = {
  name: "Word",
  autoSyncInterval: millisecondsInDay,
  batchSize: 1000,
  bulkPut: async function (data: Word[]): Promise<void> {
    await db.table("Word").bulkPut(data);
  },
  afterInit: async function (): Promise<void> {
    const wordTable = db.table("Word");
    await db.transaction("rw", wordTable, async () => {
      const allWords = await wordTable
        .toCollection()
        .filter((it) => it.frequency !== null)
        .reverse()
        .sortBy("frequency");
      allWords.forEach((word, index) => {
        word.frequency_rank = index + 1;
      });
      await wordTable.bulkPut(allWords);
    });
  },
};

export const wordIndexTable: InitableTable<WordIndex> = {
  name: "WordIndex",
  autoSyncInterval: millisecondsInDay,
  batchSize: 1000,
  bulkPut: async function (data: WordIndex[]): Promise<void> {
    await db.table("WordIndex").bulkPut(data);
  },
  afterInit: async function (): Promise<void> { },
};

export const lexemeTable: InitableTable<Lexeme> = {
  name: "Lexeme",
  autoSyncInterval: millisecondsInDay,
  batchSize: 1000,
  bulkPut: async function (data: Lexeme[]): Promise<void> {
    await db.table("Lexeme").bulkPut(data);
  },
  afterInit: async function (): Promise<void> { },
};

export const wordBookEntryTable: TwoWaySyncableTable<WordBookEntry> = {
  name: "WordBookEntry",
  autoSyncInterval: minutesToMilliseconds(2),
  batchSize: 50,
  bulkPut: async function (data: WordBookEntry[]): Promise<void> {
    await db.table("WordBookEntry").bulkPut(data);
  },
  updatedBetween: function (sync_at: number, from: number, to: number, limit: number): Promise<WordBookEntry[]> {
    return db.table("WordBookEntry")
      .where("update_time")
      .between(from, to)
      .filter((it) => it.sync_at !== sync_at && !it.deleted)
      .limit(limit)
      .toArray();
  }
};
