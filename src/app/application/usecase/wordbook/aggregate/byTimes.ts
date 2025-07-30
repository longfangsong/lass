import { repository } from "@/app/domain/repository/wordbookEntry";
import { futureReviewTimes } from "@/app/domain/service/wordbook/futureReviewTimes";
import type { WordBookEntry } from "@/types";
import { addDays, closestIndexTo, eachDayOfInterval } from "date-fns";

export async function aggregate(): Promise<Array<Array<WordBookEntry>>> {
  // todo: consider daily auto new start
  const result: Array<Array<WordBookEntry>> = [...Array(31)].map((_) => []);
  const today = new Date();
  const days = eachDayOfInterval({
    start: today,
    end: addDays(today, 30),
  });
  for (const entity of await repository.allInReview()) {
    const futureTimes = futureReviewTimes(entity);
    for (const futureTime of futureTimes) {
      const index = closestIndexTo(futureTime, days);
      if (index) {
        result[index].push(entity);
      }
    }
  }
  return result;
}
