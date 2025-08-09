import { futureReviewTimes } from "@app/domain/service/wordbook/futureReviewTimes";
import type { WordBookEntry } from "@/types";
import {
  addDays,
  addHours,
  closestIndexTo,
  eachDayOfInterval,
  startOfDay,
} from "date-fns";
import type { Repository } from "@/app/domain/repository/wordbookEntry";

export async function aggregate(
  repository: Repository,
): Promise<Array<Array<WordBookEntry>>> {
  // todo: consider daily auto new start
  const result: Array<Array<WordBookEntry>> = [...Array(31)].map((_) => []);
  const now = new Date();
  const rangeStart = startOfDay(now);
  const days = eachDayOfInterval({
    start: startOfDay(now),
    end: addDays(startOfDay(now), 30),
  }).map((it) => addHours(it, 12));
  for (const entity of await repository.allInReview()) {
    const futureTimes = futureReviewTimes(entity);
    for (const futureTime of futureTimes) {
      if (futureTime > rangeStart) {
        const index = closestIndexTo(futureTime, days);
        if (index !== undefined) {
          result[index].push(entity);
        }
      }
    }
  }
  return result;
}
