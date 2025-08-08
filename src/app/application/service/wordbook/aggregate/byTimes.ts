import { futureReviewTimes } from "@app/domain/service/wordbook/futureReviewTimes";
import type { WordBookEntry } from "@/types";
import {
  addDays,
  addHours,
  closestIndexTo,
  eachDayOfInterval,
  startOfDay,
} from "date-fns";
import { repository } from "@/app/infrastructure/indexeddb/wordbookEntryRepository";

export async function aggregate(): Promise<Array<Array<WordBookEntry>>> {
  // todo: consider daily auto new start
  const result: Array<Array<WordBookEntry>> = [...Array(31)].map((_) => []);
  const now = new Date();
  const days = eachDayOfInterval({
    start: startOfDay(now),
    end: addDays(startOfDay(now), 30),
  }).map((it) => addHours(it, 12));
  console.log(days);
  for (const entity of await repository.allInReview()) {
    const futureTimes = futureReviewTimes(entity);
    for (const futureTime of futureTimes) {
      const index = closestIndexTo(futureTime, days);
      if (index !== undefined) {
        result[index].push(entity);
      }
    }
  }
  return result;
}
