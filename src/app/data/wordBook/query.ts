import { AutoNewReviewPolicy, type WordBookEntry } from "@/types";
import { db } from "../db";
import { zip } from "rambda";

async function randomPick(count: number): Promise<Array<WordBookEntry>> {
  return db.transaction("r", db.wordBookEntry, async () => {
    const notReviewed = db.wordBookEntry.where("passive_review_count").below(0);
    const totalCount = await notReviewed.count();
    if (totalCount <= count) {
      // If we need more items than available, return everything
      return await notReviewed.toArray();
    }
    const result = [];
    const usedOffsets = new Set<number>();
    for (let i = 0; i < count; ++i) {
      let randomOffset = Math.floor(Math.random() * totalCount);
      while (usedOffsets.has(randomOffset)) {
        randomOffset = Math.floor(Math.random() * totalCount);
      }
      usedOffsets.add(randomOffset);
      const randomEntry = await notReviewed
        .clone()
        .offset(randomOffset)
        .first();
      if (randomEntry) {
        result.push(randomEntry);
      }
    }
    return result;
  });
}

async function mostFrequent(count: number): Promise<Array<WordBookEntry>> {
  return db.transaction("r", db.wordBookEntry, db.word, async () => {
    const notReviewed = await db.wordBookEntry
      .where("passive_review_count")
      .below(0)
      .toArray();
    const notReviewedIds = notReviewed.map((it) => it.word_id);
    const correspondingWords = await db.word.bulkGet(notReviewedIds);
    const sorted = zip(notReviewed)(correspondingWords).sort(
      (a, b) => (b[1]!.frequency || 0) - (a[1]!.frequency || 0),
    );
    return sorted.slice(0, count).map((it) => it[0]);
  });
}

async function firstCome(count: number): Promise<Array<WordBookEntry>> {
  return db.transaction("r", db.wordBookEntry, async () => {
    const all = await db.wordBookEntry
      .where("passive_review_count")
      .below(0)
      .sortBy("update_time");
    return all.slice(0, count);
  });
}

export async function pickNewReview(
  count: number,
  policy: AutoNewReviewPolicy,
): Promise<Array<WordBookEntry>> {
  switch (policy) {
    case AutoNewReviewPolicy.No:
      return [];
    case AutoNewReviewPolicy.Random:
      return randomPick(count);
    case AutoNewReviewPolicy.MostFrequent:
      return mostFrequent(count);
    case AutoNewReviewPolicy.FirstCome:
      return firstCome(count);
  }
  throw new Error("Unreachable");
}

export async function needReviewNow(): Promise<Array<WordBookEntry>> {
  return await db.wordBookEntry
    .where("next_passive_review_time")
    .between(0, Date.now())
    .toArray();
}

export const ReviewIntervals = [0, 1, 3, 7, 15, 30];

export async function allInReview(): Promise<Array<WordBookEntry>> {
  return await db.wordBookEntry
    .where("passive_review_count")
    .between(0, ReviewIntervals.length, true, false)
    .toArray();
}
