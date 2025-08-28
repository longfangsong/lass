import { expect, test } from "vitest";
import { addDays } from "date-fns";
import { addToPassiveReview, createEntry, review, ReviewStatus } from "./model";

test("add to review", async () => {
  const initial = createEntry("test");
  const result = addToPassiveReview(initial);
  expect(result.word_id).toBe(initial.word_id);
  expect(result.passive_review_count).toBe(0);
  expect(result.next_passive_review_time).lessThanOrEqual(Date.now());
  expect(() => addToPassiveReview(result)).toThrow();
});

test("Only can review when added", async () => {
  const initial = createEntry("test");
  expect(() => review(initial, ReviewStatus.StillRemember)).toThrow();
});

test("review successfully", () => {
  const initial = createEntry("test");
  const justAdded = addToPassiveReview(initial);
  const initLearned = review(justAdded, ReviewStatus.StillRemember);
  expect(initLearned.passive_review_count).toBe(1);
  expect(initLearned.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
  const reviewedFirstTime = review(initLearned, ReviewStatus.StillRemember);
  expect(reviewedFirstTime.passive_review_count).toBe(2);
  expect(reviewedFirstTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
  const reviewedSecondTime = review(
    reviewedFirstTime,
    ReviewStatus.StillRemember,
  );
  expect(reviewedSecondTime.passive_review_count).toBe(3);
  expect(reviewedSecondTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 4).getTime(),
    1000,
  );
  const reviewedThirdTime = review(
    reviewedSecondTime,
    ReviewStatus.StillRemember,
  );
  expect(reviewedThirdTime.passive_review_count).toBe(4);
  expect(reviewedThirdTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 8).getTime(),
    1000,
  );
  const reviewedFourthTime = review(
    reviewedThirdTime,
    ReviewStatus.StillRemember,
  );
  expect(reviewedFourthTime.passive_review_count).toBe(5);
  expect(reviewedFourthTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 15).getTime(),
    1000,
  );
  const reviewedFifthTime = review(
    reviewedFourthTime,
    ReviewStatus.StillRemember,
  );
  expect(reviewedFifthTime.passive_review_count).toBe(6);
  expect(reviewedFifthTime.next_passive_review_time).toBe(
    Number.MAX_SAFE_INTEGER,
  );
  expect(() => review(reviewedFifthTime, ReviewStatus.StillRemember)).toThrow();
});

test("review failed", () => {
  const initial = createEntry("test");
  const justAdded = addToPassiveReview(initial);
  expect(() => review(justAdded, ReviewStatus.Forgotten)).toThrow();
  const initLearned = review(justAdded, ReviewStatus.StillRemember);
  expect(initLearned.passive_review_count).toBe(1);
  expect(initLearned.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
  const reviewedFirstTime = review(initLearned, ReviewStatus.StillRemember);
  expect(reviewedFirstTime.passive_review_count).toBe(2);
  expect(reviewedFirstTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
  const reviewedSecondTime = review(reviewedFirstTime, ReviewStatus.Forgotten);
  expect(reviewedSecondTime.passive_review_count).toBe(1);
  expect(reviewedSecondTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
});

test("review unsure", () => {
  const initial = createEntry("test");
  const justAdded = addToPassiveReview(initial);
  expect(() => review(justAdded, ReviewStatus.Unsure)).toThrow();
  const initLearned = review(justAdded, ReviewStatus.StillRemember);
  expect(initLearned.passive_review_count).toBe(1);
  expect(initLearned.next_passive_review_time).closeTo(
    addDays(Date.now(), 1).getTime(),
    1000,
  );
  const reviewedFirstTime = review(initLearned, ReviewStatus.StillRemember);
  expect(reviewedFirstTime.passive_review_count).toBe(2);
  expect(reviewedFirstTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
  const reviewedSecondTime = review(reviewedFirstTime, ReviewStatus.Unsure);
  expect(reviewedSecondTime.passive_review_count).toBe(2);
  expect(reviewedSecondTime.next_passive_review_time).closeTo(
    addDays(Date.now(), 2).getTime(),
    1000,
  );
});
