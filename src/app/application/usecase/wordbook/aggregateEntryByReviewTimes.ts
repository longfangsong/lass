import { allInReview } from "@/app/domain/repository/wordbook";
import { futureReviewTimes } from "@/app/domain/service/wordbook/futureReviewTimes";
import type { WordBookEntry } from "@/types";
import { addDays, closestIndexTo, eachDayOfInterval } from "date-fns";

export async function aggregateEntryByReviewTimes(): Promise<
  Array<Array<WordBookEntry>>
> {
  // todo: consider daily auto new start
  const result: Array<Array<WordBookEntry>> = [...Array(30)].map((_) => []);
  const today = new Date();
  const days = eachDayOfInterval({
    start: today,
    end: addDays(today, 30),
  });
  for (const entity of await allInReview()) {
    const futureTimes = futureReviewTimes(entity);
    for (const futureTime of futureTimes) {
      const index = closestIndexTo(futureTime, days);
      if (index && index >= 0 && index < 30) {
        result[index].push(entity);
      }
    }
  }
  return result;
}
