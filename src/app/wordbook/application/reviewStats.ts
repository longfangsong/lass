import type { WordBookEntry } from "@/types";
import type { Repository } from "@/app/wordbook/domain/repository";
import { isSameDay, subDays } from "date-fns";

/**
 * Count passive reviews started today
 * A passive review is considered started today if:
 * - passive_review_count is 0 (never reviewed), OR
 * - passive_review_count is 1 AND the review started today
 */
export async function countPassiveReviewsStartedToday(
  repository: Repository,
): Promise<number> {
  const allEntries = await repository.allInReview();
  const now = Date.now();
  const startedToday = allEntries.filter(
    (it) =>
      it.passive_review_count === 0 ||
      (it.passive_review_count === 1 &&
        isSameDay(subDays(it.next_passive_review_time, 1), now)),
  );
  return startedToday.length;
}

/**
 * Filter entries to get only those that represent passive reviews started today
 */
export function filterPassiveReviewsStartedToday(
  entries: Array<WordBookEntry>,
): Array<WordBookEntry> {
  const now = Date.now();
  return entries.filter(
    (it) =>
      it.passive_review_count === 0 ||
      (it.passive_review_count === 1 &&
        isSameDay(subDays(it.next_passive_review_time, 1), now)),
  );
}