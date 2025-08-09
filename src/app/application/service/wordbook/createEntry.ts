import type { Repository } from "@/app/domain/repository/wordbookEntry";
import { NotReviewed, type WordBookEntry } from "@/types";

export async function createEntry(
  repository: Repository,
  wordId: string,
): Promise<WordBookEntry> {
  const entry = {
    id: crypto.randomUUID(),
    word_id: wordId,
    passive_review_count: NotReviewed,
    next_passive_review_time: NotReviewed,
    active_review_count: NotReviewed,
    next_active_review_time: NotReviewed,
    deleted: false,
    update_time: Date.now(),
    sync_at: null,
  };
  await repository.insert(entry);
  return entry;
}
