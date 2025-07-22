import type { Word as DBWord, Lexeme, WordIndex } from "./database";

export type { DBWord, Lexeme, WordIndex };

export interface WordSearchResult {
  id: string;
  lemma: string;
  definitions: Array<string>;
}

export type Word = DBWord & {
  indexes: Array<WordIndex>;
  lexemes: Array<Lexeme>;
};
