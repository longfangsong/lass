import { addToReview } from "@/app/domain/model/wordbookEntry";
import { repository } from "@/app/domain/repository/wordbookEntry";
import type { WordBookEntry } from "@/types";

export async function startReviewProgress(entry: WordBookEntry) {
  const result = addToReview(entry);
  await repository.insert(result);
}
