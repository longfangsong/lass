import { db } from "@/app/infrastructure/db";
import type { WordBookEntry } from "@/types";
import type { WordBookEntryWithDetails } from "@app/types";

export const repository = {
  async save(entry: WordBookEntry): Promise<void> {
    await db.wordBookEntry.put(entry);
  },

  async all(): Promise<Array<WordBookEntryWithDetails>> {
    const entries = await db.wordBookEntry
      .orderBy("update_time")
      .reverse()
      .filter((it) => !it.deleted)
      .toArray();
    return await Promise.all(
      entries.map(async (entry) => {
        const [word, indexes, lexemes] = await Promise.all([
          db.word.get(entry.word_id),
          db.wordIndex.where("word_id").equals(entry.word_id).toArray(),
          db.lexeme.where("word_id").equals(entry.word_id).toArray(),
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
  },

  async filter(
    fieldName: string,
    lower: number,
    upper: number,
    includeLower: boolean = true,
    includeUpper: boolean = false,
  ): Promise<Array<WordBookEntry>> {
    return await db.wordBookEntry
      .where(fieldName)
      .between(lower, upper, includeLower, includeUpper)
      .and((it) => !it.deleted)
      .toArray();
  },

  async reviewNotStarted(): Promise<Array<WordBookEntry>> {
    return await db.wordBookEntry
      .where("passive_review_count")
      .below(0)
      .filter((it) => !it.deleted)
      .toArray();
  },

  async needReviewNow(): Promise<Array<WordBookEntry>> {
    return await db.wordBookEntry
      .where("next_passive_review_time")
      .belowOrEqual(Date.now())
      .and((it) => it.passive_review_count >= 0)
      .filter((it) => !it.deleted)
      .toArray();
  },

  async allInReview(): Promise<Array<WordBookEntry>> {
    return await db.wordBookEntry
      .where("passive_review_count")
      .aboveOrEqual(0)
      .filter((it) => !it.deleted)
      .toArray();
  },
};
