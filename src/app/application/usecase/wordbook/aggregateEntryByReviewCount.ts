import { all } from "@/app/domain/repository/wordbook";
import type { WordBookEntry } from "@/types";
import { groupBy } from "rambda";

export async function aggregateEntryByReviewCount(): Promise<
  Partial<Record<number, WordBookEntry[]>>
> {
  const entries = await all();
  return groupBy<WordBookEntry>((entry) =>
    entry.passive_review_count.toString(),
  )(entries);
}
