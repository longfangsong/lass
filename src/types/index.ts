import type {
  Word as DBWord,
  Lexeme,
  WordIndex,
  WordBookEntry,
} from "./database";

export type { DBWord, Lexeme, WordIndex, WordBookEntry };

export interface WordSearchResult {
  id: string;
  lemma: string;
  definitions: Array<string>;
}

export type Word = DBWord & {
  indexes: Array<WordIndex>;
  lexemes: Array<Lexeme>;
};
