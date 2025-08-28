import type { WordBookEntry } from "@/types";
import type { WordBookEntryWithDetails } from "@/app/types";
import {
  wordIndexTable,
  wordTable,
  lexemeTable,
} from "../infrastructure/repository";

export async function getWordBookEntryDetail(
  entry: WordBookEntry,
): Promise<WordBookEntryWithDetails> {
  const [word, indexes, lexemes] = await Promise.all([
    wordTable.get(entry.word_id),
    wordIndexTable.where("word_id").equals(entry.word_id).toArray(),
    lexemeTable.where("word_id").equals(entry.word_id).toArray(),
  ]);
  const { id: _, ...wordWithoutId } = word!;
  return {
    ...entry,
    ...wordWithoutId,
    indexes,
    lexemes,
  };
}
