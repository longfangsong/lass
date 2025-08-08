import { addToReview } from "@app/domain/model/wordbookEntry";
import type { WordBookEntry } from "@/types";
import { repository } from "@/app/infrastructure/indexeddb/wordbookEntryRepository";

export async function startReviewProgress(entry: WordBookEntry) {
  const result = addToReview(entry);
  await repository.insert(result);
}
