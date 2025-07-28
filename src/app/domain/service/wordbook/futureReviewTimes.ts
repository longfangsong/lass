import type { WordBookEntry } from "@/types";
import { addDays, subDays } from "date-fns";
import { ReviewIntervals } from "./review";

export function futureReviewTimes(entry: WordBookEntry): Array<Date> {
  // expect_review_times[i] === init_review_time +
  //   \sum_{i=0}^{i=passive_review_count}
  // todo: optimize
  const estimatedInitReviewTime = subDays(
    entry.next_passive_review_time,
    entry.passive_review_count,
  );
  const allEstimatedReviewTimes = ReviewIntervals.map((interval) =>
    addDays(estimatedInitReviewTime, interval),
  );
  return allEstimatedReviewTimes.slice(entry.passive_review_count);
}
