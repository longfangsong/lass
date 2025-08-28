import { addToReview } from "@/app/wordbook/domain/model";
import type { WordBookEntry } from "@/types";
import type { Repository } from "@/app/wordbook/domain/repository";

export async function startReviewProgress(
  repository: Repository,
  entry: WordBookEntry,
) {
  const result = addToReview(entry);
  await repository.insert(result);
}
