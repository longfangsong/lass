import { save } from "@/app/domain/repository/wordbook";
import { addToReview } from "@/app/domain/service/wordbook/review";
import type { WordBookEntry } from "@/types";

export async function startReviewProgress(entry: WordBookEntry) {
  const result = addToReview(entry);
  await save(result);
}
