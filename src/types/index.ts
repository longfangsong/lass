import type {
  Word as DBWord,
  Lexeme,
  WordIndex,
  WordBookEntry,
  UserSettings,
  WithPhonetic,
} from "./database";

import { AutoNewReviewPolicy, NotReviewed } from "./database";
export type {
  DBWord,
  Lexeme,
  WordIndex,
  WordBookEntry,
  UserSettings,
  WithPhonetic,
};

export { AutoNewReviewPolicy, NotReviewed };

export interface WordSearchResult {
  id: string;
  lemma: string;
  definitions: Array<string>;
}

export type Word = DBWord & {
  indexes: Array<WordIndex>;
  lexemes: Array<Lexeme>;
};

export type WordBookEntryWithDetails = WordBookEntry & Omit<Word, "id">;
