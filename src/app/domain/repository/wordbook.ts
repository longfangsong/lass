import { db } from "@/app/infrastructure/db";
import { ReviewIntervals } from "../service/wordbook/review";
import type { WordBookEntry } from "@/types";
import type { WordBookEntryWithDetails } from "@/types";

export async function save(entry: WordBookEntry): Promise<void> {
  await db.wordBookEntry.put(entry);
}

export async function all(
  offset: number,
  limit: number,
): Promise<Array<WordBookEntryWithDetails>> {
  const entries = await db.wordBookEntry
    .orderBy("update_time")
    .reverse()
    .offset(offset)
    .limit(limit)
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
}

export async function needReviewNow(): Promise<Array<WordBookEntry>> {
  return await db.wordBookEntry
    .where("next_passive_review_time")
    .between(0, Date.now())
    .and((it) => !it.deleted)
    .toArray();
}

export async function allInReview(): Promise<Array<WordBookEntry>> {
  return await db.wordBookEntry
    .where("passive_review_count")
    .between(0, ReviewIntervals.length, true, false)
    .and((it) => !it.deleted)
    .toArray();
}
