import type { Word } from "@app/types";
import { type WordBookEntry } from "@/types";
import { sortBy, zip } from "remeda";

export async function randomPick(
  entries: Array<WordBookEntry>,
  count: number,
): Promise<Array<WordBookEntry>> {
  if (entries.length <= count) {
    // If we need more items than available, return everything
    return entries;
  }
  const result = [];
  const pickedIndexes = new Set<number>();
  for (let i = 0; i < count; ++i) {
    let randomOffset = Math.floor(Math.random() * entries.length);
    while (pickedIndexes.has(randomOffset)) {
      randomOffset = Math.floor(Math.random() * entries.length);
    }
    pickedIndexes.add(randomOffset);
    const randomEntry = entries[randomOffset];
    if (randomEntry) {
      result.push(randomEntry);
    }
  }
  return result;
}

async function mostFrequentUncurry(
  bulkGetWord: (ids: Array<string>) => Promise<Array<Word | undefined>>,
  entries: Array<WordBookEntry>,
  count: number,
): Promise<Array<WordBookEntry>> {
  const notReviewedIds = entries.map((it) => it.word_id);
  const correspondingWords = await bulkGetWord(notReviewedIds);
  const sorted = zip(entries, correspondingWords).sort(
    (a, b) => (b[1]!.frequency || 0) - (a[1]!.frequency || 0),
  );
  return sorted.slice(0, count).map((it) => it[0]);
}

export function mostFrequent(
  bulkGetWord: (ids: Array<string>) => Promise<Array<Word | undefined>>,
) {
  return (entries: Array<WordBookEntry>, count: number) =>
    mostFrequentUncurry(bulkGetWord, entries, count);
}

export async function firstCome(
  entries: Array<WordBookEntry>,
  count: number,
): Promise<Array<WordBookEntry>> {
  const sorted = sortBy(entries, (it) => it.update_time);
  return sorted.slice(0, count);
}
