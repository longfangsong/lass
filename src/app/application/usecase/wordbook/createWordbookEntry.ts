import { save } from "@/app/domain/repository/wordbook";
import { NotReviewed, type WordBookEntry } from "@/types";

export async function createWordbookEntry(
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
  };
  await save(entry);
  return entry;
}
