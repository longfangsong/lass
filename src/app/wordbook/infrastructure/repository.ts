import { ReviewIntervals } from "@/app/wordbook/domain/model";
import type { Repository } from "@/app/wordbook/domain/repository";
import { db } from "../../shared/infrastructure/indexeddb";
import type { WordBookEntry } from "@/types";
import type { WordBookEntryWithDetails } from "@/app/types";
import type { EntityTable } from "dexie";

export const wordBookEntryTable: EntityTable<WordBookEntry, "id"> =
  db.table("WordBookEntry");
export const wordTable = db.table("Word");
export const wordIndexTable = db.table("WordIndex");
export const lexemeTable = db.table("Lexeme");

export const repository = {
  get version(): Promise<number | undefined> {
    return db.meta.get("WordBookEntry").then((it) => it?.version);
  },

  async setVersion(version: number): Promise<void> {
    await db.meta.put({ table_name: "WordBookEntry", version });
  },

  async insert(entry: WordBookEntry): Promise<void> {
    const existing = await wordBookEntryTable
      .where("word_id")
      .equals(entry.word_id)
      .first();
    if (existing && existing.id !== entry.id) {
      throw new Error("WordBookEntry already exists");
    } else {
      await wordBookEntryTable.put(entry);
    }
  },

  async update(entry: WordBookEntry) {
    const existing = await wordBookEntryTable.get(entry.id);
    if (!existing) {
      throw Error(`Cannot find ${entry.id} in DB!`);
    }
    await wordBookEntryTable.put(entry);
  },

  async bulkUpdate(entries: Array<WordBookEntry>) {
    // todo: check whether all entry in entries exists
    await wordBookEntryTable.bulkPut(entries);
  },

  async upsert(entry: WordBookEntry) {
    // fixme: handle deleted field
    const existing = await wordBookEntryTable
      .where("word_id")
      .equals(entry.word_id)
      .first();
    if (existing && existing.update_time < entry.update_time) {
      let deleteTask;
      if (existing.id !== entry.id) {
        deleteTask = await wordBookEntryTable.delete(existing.id);
      }
      await Promise.all([deleteTask, wordBookEntryTable.put(entry)]);
    } else if (!existing) {
      await wordBookEntryTable.put(entry);
    }
  },

  async getByWordId(wordId: string): Promise<WordBookEntry | undefined> {
    return await wordBookEntryTable.where("word_id").equals(wordId).first();
  },

  get all(): Promise<Array<WordBookEntryWithDetails>> {
    return (async () => {
      const entries = await wordBookEntryTable
        .orderBy("update_time")
        .reverse()
        .filter((it) => !it.deleted)
        .toArray();
      return await Promise.all(
        entries.map(async (entry) => {
          const [word, indexes, lexemes] = await Promise.all([
            wordTable.get(entry.word_id),
            wordIndexTable.where("word_id").equals(entry.word_id).toArray(),
            lexemeTable.where("word_id").equals(entry.word_id).toArray(),
          ]);
          const { id: _, ...wordWithoutId } = word!;
          return {
            ...entry,
            ...wordWithoutId,
            indexes,
            lexemes,
          };
        }),
      );
    })();
  },

  async filter(
    fieldName: string,
    lower: number,
    upper: number,
    includeLower: boolean = true,
    includeUpper: boolean = false,
  ): Promise<Array<WordBookEntry>> {
    return await wordBookEntryTable
      .where(fieldName)
      .between(lower, upper, includeLower, includeUpper)
      .and((it) => !it.deleted)
      .toArray();
  },

  async reviewNotStarted(): Promise<Array<WordBookEntry>> {
    return await wordBookEntryTable
      .where("passive_review_count")
      .below(0)
      .filter((it) => !it.deleted)
      .toArray();
  },

  async needReviewNow(): Promise<Array<WordBookEntry>> {
    return await wordBookEntryTable
      .where("next_passive_review_time")
      .belowOrEqual(Date.now())
      .and(
        (it) =>
          it.passive_review_count >= 0 &&
          it.passive_review_count < ReviewIntervals.length,
      )
      .filter((it) => !it.deleted)
      .toArray();
  },

  async allInReview(): Promise<Array<WordBookEntry>> {
    return await wordBookEntryTable
      .where("passive_review_count")
      .aboveOrEqual(0)
      .filter((it) => !it.deleted)
      .toArray();
  },

  async updatedBetween(
    sync_at: number,
    from: number,
    to: number,
    limit: number,
  ): Promise<Array<WordBookEntry>> {
    return await wordBookEntryTable
      .where("update_time")
      .between(from, to)
      .filter((it) => it.sync_at !== sync_at && !it.deleted)
      .limit(limit)
      .toArray();
  },
} satisfies Repository;
