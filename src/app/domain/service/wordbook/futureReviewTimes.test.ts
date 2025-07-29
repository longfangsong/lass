import { expect, test } from "vitest";
import {
  addToReview,
  createEntry,
  review,
  ReviewIntervals,
  ReviewStatus,
} from "../../model/wordbookEntry";
import { futureReviewTimes } from "./futureReviewTimes";
import { addDays } from "date-fns";

test("futureReviewTimes", () => {
  const newCreated = createEntry("test");
  expect(() => futureReviewTimes(newCreated)).toThrow();
  const started = addToReview(newCreated);
  const now = new Date();

  const startedResult = futureReviewTimes(started);
  expect(startedResult.length).toBe(6);
  for (let i = 0; i < ReviewIntervals.length; ++i) {
    expect(startedResult[i].getTime()).closeTo(
      addDays(now, ReviewIntervals[i]).getTime(),
      1000,
      `Expected reviewOnceResult[${i}] to be close to addDays(now, ${ReviewIntervals[i]})`,
    );
  }

  const reviewOnce = review(started, ReviewStatus.StillRemember);
  const reviewOnceResult = futureReviewTimes(reviewOnce);
  expect(reviewOnceResult.length).toBe(5);
  for (let i = 1; i < ReviewIntervals.length; ++i) {
    expect(reviewOnceResult[i - 1].getTime()).closeTo(
      addDays(now, ReviewIntervals[i]).getTime(),
      1000,
      `Expected reviewOnceResult[${i - 1}] to be close to addDays(now, ${ReviewIntervals[i]})`,
    );
  }

  let done = reviewOnce;
  for (let i = 2; i <= ReviewIntervals.length; ++i) {
    done = review(done, ReviewStatus.StillRemember);
  }
  expect(done.passive_review_count).toBe(6);
  const reviewDoneResult = futureReviewTimes(done);
  expect(reviewDoneResult.length).toBe(0);
});
