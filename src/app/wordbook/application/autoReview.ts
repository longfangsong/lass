import {
  firstCome,
  mostFrequent,
  randomPick,
} from "@/app/wordbook/domain/service/reviewPicker";
import type { Word } from "@/app/types";
import { AutoNewReviewPolicy, type WordBookEntry } from "@/types";

export function getPicker(
  bulkGetWord: (ids: Array<string>) => Promise<Array<Word | undefined>>,
): (policy: AutoNewReviewPolicy) => (entries: Array<WordBookEntry>, count: number) => Promise<Array<WordBookEntry>> {
  return (policy: AutoNewReviewPolicy) => {
    switch (policy) {
      case AutoNewReviewPolicy.Random:
        return randomPick;
      case AutoNewReviewPolicy.MostFrequent:
        return mostFrequent(bulkGetWord);
      case AutoNewReviewPolicy.FirstCome:
        return firstCome;
      default:
        throw new Error(`Unknown policy: ${policy}`);
    }
  };
}
