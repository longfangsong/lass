import { NotReviewed, type WordBookEntry } from "@/types";

export function newEntry(wordId: string): WordBookEntry {
  return {
    id: crypto.randomUUID(),
    word_id: wordId,
    passive_review_count: NotReviewed,
    next_passive_review_time: NotReviewed,
    active_review_count: NotReviewed,
    next_active_review_time: NotReviewed,
    deleted: false,
    update_time: new Date().getTime(),
  };
}
