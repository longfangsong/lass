import type { WordBookEntry } from "@/types";
import type { WordBookEntryWithDetails } from "@app/types";

export interface Repository {
  readonly version: Promise<number | undefined>;
  readonly all: Promise<Array<WordBookEntryWithDetails>>;
  setVersion(version: number): Promise<void>;
  getByWordId(wordId: string): Promise<WordBookEntry | undefined>;
  insert(entry: WordBookEntry): Promise<void>;
  update(entry: WordBookEntry): Promise<void>;
  bulkUpdate(entries: Array<WordBookEntry>): Promise<void>;
  upsert(entry: WordBookEntry): Promise<void>;
  filter(
    fieldName: string,
    lower: number,
    upper: number,
    includeLower: boolean,
    includeUpper: boolean
  ): Promise<Array<WordBookEntry>>;
  reviewNotStarted(): Promise<Array<WordBookEntry>>;
  needReviewNow(): Promise<Array<WordBookEntry>>;
  allInReview(): Promise<Array<WordBookEntry>>;
  updatedBetween(sync_at: number,
    from: number,
    to: number,
    limit: number): Promise<Array<WordBookEntry>>;
}

