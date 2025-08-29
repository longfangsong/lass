import { NotReviewed, type WordBookEntry } from "@/types";
import { assert } from "@/utils";
import { addDays } from "date-fns";

export const ReviewIntervals = [0, 1, 3, 7, 15, 30];

export function createEntry(wordId: string): WordBookEntry {
  return {
    id: crypto.randomUUID(),
    word_id: wordId,
    passive_review_count: NotReviewed,
    next_passive_review_time: NotReviewed,
    active_review_count: NotReviewed,
    next_active_review_time: NotReviewed,
    deleted: false,
    update_time: Date.now(),
    sync_at: null,
  };
}

export function addToPassiveReview(entry: WordBookEntry): WordBookEntry {
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

export function addToActiveReview(entry: WordBookEntry): WordBookEntry {
  assert(
    entry.passive_review_count > 3,
    "Must complete passive review more than 3 times before starting active review.",
  );
  const currentReviewCount = entry.active_review_count;
  assert(currentReviewCount === NotReviewed);
  const now = Date.now();
  return {
    ...entry,
    active_review_count: 0,
    next_active_review_time: now,
    update_time: now,
  };
}

function reviewStillRemember(entry: WordBookEntry): WordBookEntry {
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

function reviewForgotten(entry: WordBookEntry): WordBookEntry {
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

function reviewUnsure(entry: WordBookEntry): WordBookEntry {
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

export enum ReviewStatus {
  StillRemember,
  Forgotten,
  Unsure,
}

export function review(
  entry: WordBookEntry,
  status: ReviewStatus,
): WordBookEntry {
  assert(entry.passive_review_count >= 0);
  switch (status) {
    case ReviewStatus.StillRemember:
      return reviewStillRemember(entry);
    case ReviewStatus.Forgotten:
      return reviewForgotten(entry);
    case ReviewStatus.Unsure:
      return reviewUnsure(entry);
    default:
      throw new Error(`Invalid review status: ${status}`);
  }
}

function reviewActiveStillRemember(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.active_review_count;
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
      active_review_count: nextReviewCount,
      next_active_review_time: nextReview.getTime(),
      update_time: now,
    };
  } else {
    return {
      ...entry,
      active_review_count: nextReviewCount,
      next_active_review_time: Number.MAX_SAFE_INTEGER,
      update_time: now,
    };
  }
}

function reviewActiveForgotten(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.active_review_count;
  assert(currentReviewCount < ReviewIntervals.length, "Invalid review count");
  const now = Date.now();
  const nextReview = addDays(now, 1);
  return {
    ...entry,
    active_review_count: 1,
    next_active_review_time: nextReview.getTime(),
    update_time: now,
  };
}

function reviewActiveUnsure(entry: WordBookEntry): WordBookEntry {
  const currentReviewCount = entry.active_review_count;
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
    next_active_review_time: nextReview.getTime(),
    update_time: now,
  };
}

export function reviewActive(
  entry: WordBookEntry,
  status: ReviewStatus,
): WordBookEntry {
  assert(entry.active_review_count >= 0);
  switch (status) {
    case ReviewStatus.StillRemember:
      return reviewActiveStillRemember(entry);
    case ReviewStatus.Forgotten:
      return reviewActiveForgotten(entry);
    case ReviewStatus.Unsure:
      return reviewActiveUnsure(entry);
    default:
      throw new Error(`Invalid review status: ${status}`);
  }
}
