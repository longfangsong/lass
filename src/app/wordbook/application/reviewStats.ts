import type { WordBookEntry } from "@/types";
import { isSameDay, subDays } from "date-fns";

/**
 * Filter entries to get only those that represent passive reviews started today
 */
export function passiveReviewsStartedOrWillStartToday(
  entries: Array<WordBookEntry>,
): Array<WordBookEntry> {
  const now = Date.now();
  return entries.filter(
    (it) =>
      it.passive_review_count === 0 || // just started
      (it.passive_review_count === 1 && // stated and reviewed once today
        isSameDay(subDays(it.next_passive_review_time, 1), now)),
  );
}

export function remainingNeedPassiveReviewToday(
  entries: Array<WordBookEntry>,
): Array<WordBookEntry> {
  const now = Date.now();
  return entries.filter((it) => isSameDay(it.next_passive_review_time, now));
}
