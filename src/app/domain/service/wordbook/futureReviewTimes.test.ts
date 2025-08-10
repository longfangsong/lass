import { expect, test, vi } from "vitest";
import {
  addToReview,
  createEntry,
  review,
  ReviewIntervals,
  ReviewStatus,
} from "@app/domain/model/wordbookEntry";
import { futureReviewTimes } from "./futureReviewTimes";
import { addDays, isSameDay } from "date-fns";

test("case 1", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 0, 1));
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

  vi.setSystemTime(new Date(2025, 1, 0));
  const sleepAMonthResult = futureReviewTimes(started);
  expect(isSameDay(sleepAMonthResult[0], new Date(2025, 1, 0))).toBe(true);
  expect(isSameDay(sleepAMonthResult[1], new Date(2025, 1, 1))).toBe(true);
  vi.useRealTimers();
});

test("case 2", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 7, 10, 19));
  const entry = createEntry("test");
  entry.passive_review_count = 2;
  entry.next_passive_review_time = new Date(2025, 7, 10, 10).getTime();
  const result = futureReviewTimes(entry);
  expect(isSameDay(result[0], new Date())).toBe(true);
  vi.useRealTimers();
});
