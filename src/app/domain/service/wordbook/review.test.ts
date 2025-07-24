import { expect, test } from "vitest";
import {
  addToReview,
  reviewFailed,
  reviewSuccessfully,
  reviewUnsure,
} from "./review";
import { addDays } from "date-fns";
import { type WordBookEntry, NotReviewed } from "@/types";

function newEntry(wordId: string): WordBookEntry {
  return {
    id: crypto.randomUUID(),
    word_id: wordId,
    passive_review_count: NotReviewed,
    next_passive_review_time: NotReviewed,
    active_review_count: NotReviewed,
    next_active_review_time: NotReviewed,
    deleted: false,
    update_time: new Date().getTime(),
  };
}

test("add to review", async () => {
  const initial = newEntry("test");
  const result = addToReview(initial);
  expect(result.word_id).toBe(initial.word_id);
  expect(result.passive_review_count).toBe(0);
  expect(result.next_passive_review_time).lessThanOrEqual(Date.now());
  expect(() => addToReview(result)).toThrow();
});

test("review successfully", () => {
  const initial = newEntry("test");
  const justAdded = addToReview(initial);
  const initLearned = reviewSuccessfully(justAdded);
  expect(initLearned.passive_review_count).toBe(1);
  expect(initLearned.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
  const reviewedFirstTime = reviewSuccessfully(initLearned);
  expect(reviewedFirstTime.passive_review_count).toBe(2);
  expect(reviewedFirstTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
  const reviewedSecondTime = reviewSuccessfully(reviewedFirstTime);
  expect(reviewedSecondTime.passive_review_count).toBe(3);
  expect(reviewedSecondTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 4).getTime(),
    1000,
  );
  const reviewedThirdTime = reviewSuccessfully(reviewedSecondTime);
  expect(reviewedThirdTime.passive_review_count).toBe(4);
  expect(reviewedThirdTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 8).getTime(),
    1000,
  );
  const reviewedFourthTime = reviewSuccessfully(reviewedThirdTime);
  expect(reviewedFourthTime.passive_review_count).toBe(5);
  expect(reviewedFourthTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 15).getTime(),
    1000,
  );
  const reviewedFifthTime = reviewSuccessfully(reviewedFourthTime);
  expect(reviewedFifthTime.passive_review_count).toBe(6);
  expect(reviewedFifthTime.next_passive_review_time).toBe(
    Number.MAX_SAFE_INTEGER,
  );
  expect(() => reviewSuccessfully(reviewedFifthTime)).toThrow();
});

test("review failed", () => {
  const initial = newEntry("test");
  const justAdded = addToReview(initial);
  expect(() => reviewFailed(justAdded)).toThrow();
  const initLearned = reviewSuccessfully(justAdded);
  expect(initLearned.passive_review_count).toBe(1);
  expect(initLearned.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
  const reviewedFirstTime = reviewSuccessfully(initLearned);
  expect(reviewedFirstTime.passive_review_count).toBe(2);
  expect(reviewedFirstTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
  const reviewedSecondTime = reviewFailed(reviewedFirstTime);
  expect(reviewedSecondTime.passive_review_count).toBe(1);
  expect(reviewedSecondTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
});

test("review unsure", () => {
  const initial = newEntry("test");
  const justAdded = addToReview(initial);
  expect(() => reviewUnsure(justAdded)).toThrow();
  const initLearned = reviewSuccessfully(justAdded);
  expect(initLearned.passive_review_count).toBe(1);
  expect(initLearned.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
  const reviewedFirstTime = reviewSuccessfully(initLearned);
  expect(reviewedFirstTime.passive_review_count).toBe(2);
  expect(reviewedFirstTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
  const reviewedSecondTime = reviewUnsure(reviewedFirstTime);
  expect(reviewedSecondTime.passive_review_count).toBe(2);
  expect(reviewedSecondTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
});
