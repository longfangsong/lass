import { NotReviewed, type WordBookEntry } from "@/types";
import { expect, test, vi } from "vitest";
import { aggregate } from "./byTimes";
import type { Repository } from "../../domain/repository";

test("aggregate by times", async () => {
  vi.useFakeTimers();
  const entries: Array<WordBookEntry> = [
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 1, 0, 0, 1).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 2, 0, 0, 1).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 3, 0, 0, 1).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 3, 0, 0, 1).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 3, 8).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 3, 12).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 3, 16).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 3, 20).getTime(),
    },
    {
      passive_review_count: 0,
      next_passive_review_time: new Date(2025, 0, 3, 23, 59).getTime(),
    },
  ].map((it, index) => ({
    id: `we-${index}`,
    word_id: `w-${index}`,
    ...it,
    active_review_count: NotReviewed,
    next_active_review_time: NotReviewed,
    deleted: false,
    update_time: 0,
    sync_at: null,
  }));
  vi.setSystemTime(new Date(2025, 0, 1, 12).getTime());
  let result = await aggregate({
    async allInReview() {
      return entries;
    },
  } as unknown as Repository);
  expect(result[0].length).toBe(1);
  expect(result[0].map((it) => it.id)).toContain("we-0");
  expect(result[1].length).toBe(2);
  expect(result[1].map((it) => it.id)).toContain("we-0");
  expect(result[1].map((it) => it.id)).toContain("we-1");
  expect(result[2].length).toBe(8);
  expect(result[2].map((it) => it.id)).not.toContain("we-0");
  expect(result[2].map((it) => it.id)).toContain("we-1");
  expect(result[3].length).toBe(8);
  expect(result[3].map((it) => it.id)).toContain("we-0");
  expect(result[3].map((it) => it.id)).not.toContain("we-1");
  expect(result[30].length).toBe(9);

  vi.setSystemTime(new Date(2025, 0, 3, 12).getTime());
  result = await aggregate({
    async allInReview() {
      return entries;
    },
  } as unknown as Repository);
  expect(result[0].length).toBe(9);
  expect(result[1].length).toBe(9);
  expect(result[2].length).toBe(0);
  expect(result[3].length).toBe(9);
  expect(result[30].length).toBe(9);

  vi.useRealTimers();
});
