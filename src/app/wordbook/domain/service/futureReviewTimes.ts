import type { WordBookEntry } from "@/types";
import { addDays, subDays } from "date-fns";
import { assert } from "@/utils";
import { ReviewIntervals } from "../model";

export function futureReviewTimes(entry: WordBookEntry): Array<Date> {
  // expect_review_times[i] === init_review_time +
  //   \sum_{i=0}^{i=passive_review_count}
  // todo: optimize
  assert(entry.passive_review_count >= 0);
  const estimatedInitReviewTime = subDays(
    Math.max(entry.next_passive_review_time, Date.now()),
    ReviewIntervals[entry.passive_review_count],
  );
  const allEstimatedReviewTimes = ReviewIntervals.map((interval) =>
    addDays(estimatedInitReviewTime, interval),
  );
  return allEstimatedReviewTimes.slice(entry.passive_review_count);
}
