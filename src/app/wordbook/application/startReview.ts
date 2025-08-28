import {
  addToActiveReview,
  addToPassiveReview,
} from "@/app/wordbook/domain/model";
import type { WordBookEntry } from "@/types";
import type { Repository } from "@/app/wordbook/domain/repository";

export async function startPassiveReviewProgress(
  repository: Repository,
  entry: WordBookEntry,
) {
  const result = addToPassiveReview(entry);
  await repository.insert(result);
}

export async function startActiveReviewProgress(
  repository: Repository,
  entry: WordBookEntry,
) {
  const result = addToActiveReview(entry);
  await repository.insert(result);
}
