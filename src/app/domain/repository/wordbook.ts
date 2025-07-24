import { db } from "@/app/infrastructure/db";
import { ReviewIntervals } from "../service/wordbook/review";
import type { WordBookEntry } from "@/types";

export async function needReviewNow(): Promise<Array<WordBookEntry>> {
  return await db.wordBookEntry
    .where("next_passive_review_time")
    .between(0, Date.now())
    .toArray();
}

export async function allInReview(): Promise<Array<WordBookEntry>> {
  return await db.wordBookEntry
    .where("passive_review_count")
    .between(0, ReviewIntervals.length, true, false)
    .toArray();
}
