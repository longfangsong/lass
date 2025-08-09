import { addToReview } from "@app/domain/model/wordbookEntry";
import type { WordBookEntry } from "@/types";
import type { Repository } from "@/app/domain/repository/wordbookEntry";

export async function startReviewProgress(
  repository: Repository,
  entry: WordBookEntry,
) {
  const result = addToReview(entry);
  await repository.insert(result);
}
