import { Word, WordSearchResult } from "../types";

export interface DataSource {
    searchWord(spell: string): Promise<Array<WordSearchResult>>;
    getWord(id: string): Promise<Word | null>;
    getWordsByIndexSpell(spell: string): Promise<Array<Word>>;
}