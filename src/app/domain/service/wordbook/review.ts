import { NotReviewed, type WordBookEntry } from "@/types";
import { addDays } from "date-fns";
import { assert } from "@/utils";
export const ReviewIntervals = [0, 1, 3, 7, 15, 30];

export function addToReview(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(currentReviewCount === NotReviewed);
  const now = Date.now();
  return {
    ...entry,
    passive_review_count: 0,
    next_passive_review_time: now,
    update_time: now,
  };
}

export function reviewSuccessfully(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(currentReviewCount < ReviewIntervals.length, "Invalid review count");
  const nextReviewCount = currentReviewCount + 1;
  const now = Date.now();
  if (nextReviewCount < ReviewIntervals.length) {
    const nextReview = addDays(
      now,
      ReviewIntervals[nextReviewCount] - ReviewIntervals[currentReviewCount],
    );
    return {
      ...entry,
      passive_review_count: nextReviewCount,
      next_passive_review_time: nextReview.getTime(),
      update_time: now,
    };
  } else {
    return {
      ...entry,
      passive_review_count: nextReviewCount,
      next_passive_review_time: Number.MAX_SAFE_INTEGER,
      update_time: now,
    };
  }
}

export function reviewFailed(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(
    currentReviewCount !== 0 && currentReviewCount < ReviewIntervals.length,
    "Invalid review count",
  );
  const now = Date.now();
  const nextReview = addDays(now, 1);
  return {
    ...entry,
    passive_review_count: 1,
    next_passive_review_time: nextReview.getTime(),
    update_time: now,
  };
}

export function reviewUnsure(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(
    currentReviewCount !== 0 && currentReviewCount < ReviewIntervals.length,
    "Invalid review count",
  );
  const now = Date.now();
  const nextReview = addDays(
    now,
    ReviewIntervals[currentReviewCount] -
      ReviewIntervals[currentReviewCount - 1],
  );
  return {
    ...entry,
    next_passive_review_time: nextReview.getTime(),
    update_time: now,
  };
}
