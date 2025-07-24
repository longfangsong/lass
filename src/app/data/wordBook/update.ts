import { NotReviewed, type WordBookEntry } from "@/types";
import { ReviewIntervals } from "./query";
import { addDays } from "date-fns";
import { assert } from "@/utils";

export function addToReview(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(currentReviewCount === NotReviewed);
  return {
    ...entry,
    passive_review_count: 0,
    next_passive_review_time: Date.now(),
  };
}

export function reviewSuccessfully(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(currentReviewCount < ReviewIntervals.length, "Invalid review count");
  const nextReviewCount = currentReviewCount + 1;
  if (nextReviewCount < ReviewIntervals.length) {
    const nextReview = addDays(
      new Date(),
      ReviewIntervals[nextReviewCount] - ReviewIntervals[currentReviewCount],
    );
    return {
      ...entry,
      passive_review_count: nextReviewCount,
      next_passive_review_time: nextReview.getTime(),
    };
  } else {
    return {
      ...entry,
      passive_review_count: nextReviewCount,
      next_passive_review_time: Number.MAX_SAFE_INTEGER,
    };
  }
}

export function reviewFailed(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(
    currentReviewCount !== 0 && currentReviewCount < ReviewIntervals.length,
    "Invalid review count",
  );
  const nextReview = addDays(new Date(), 1);
  return {
    ...entry,
    passive_review_count: 1,
    next_passive_review_time: nextReview.getTime(),
  };
}

export function reviewUnsure(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.passive_review_count;
  assert(
    currentReviewCount !== 0 && currentReviewCount < ReviewIntervals.length,
    "Invalid review count",
  );
  const nextReview = addDays(
    new Date(),
    ReviewIntervals[currentReviewCount] -
      ReviewIntervals[currentReviewCount - 1],
  );
  return {
    ...entry,
    next_passive_review_time: nextReview.getTime(),
  };
}
