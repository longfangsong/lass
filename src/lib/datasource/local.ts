import { DataSource } from "./datasource";
import { DBTypes, Word, WordSearchResult } from "../types";
import { getDB } from "../frontend/db";
import { searchWord } from "../frontend/data/word";

export class LocalDataSource implements DataSource {
  async getWord(id: string): Promise<Word | null> {
    const db = await getDB();
    const word = await db.word.get(id);
    if (word === undefined) {
      return null;
    }
    const wordIndexes = await db.wordIndex
      .where("word_id")
      .equals(word.id)
      .toArray();
    const lexemes = await db.lexeme.where("word_id").equals(word.id).toArray();
    return { ...word, indexes: wordIndexes, lexemes };
  }

  async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
    const db = await getDB();
    const directMatch = await db.word.where("lemma").equals(spell).toArray();
    const formMatch = await db.wordIndex
      .where("spell")
      .equals(spell)
      .toArray()
      .then((indexes) =>
        indexes.filter((it) => it.form !== null).map((it) => it.word_id)
      )
      .then((ids) => db.word.where("id").anyOf(ids).toArray())
      .then((result) => result.sort((a, b) => a.lemma.length - b.lemma.length));
    const found = new Set();
    let resultWords: Array<DBTypes.Word> = [];
    for (const word of directMatch) {
      if (!found.has(word.id)) {
        found.add(word.id);
        resultWords.push(word);
      }
    }
    for (const word of formMatch) {
      if (!found.has(word.id)) {
        found.add(word.id);
        resultWords.push(word);
      }
    }
    if (resultWords.length === 0) {
      resultWords = await db.wordIndex
        .where("spell")
        .equals(spell)
        .toArray()
        .then((indexes) => indexes.map((it) => it.word_id))
        .then((ids) => db.word.where("id").anyOf(ids).toArray())
        .then((result) =>
          result.sort(
            (a, b) =>
              Math.abs(a.lemma.length - spell.length) -
              Math.abs(b.lemma.length - spell.length)
          )
        );
    }
    const result = await Promise.all(
      resultWords.map(async (word) => {
        const [indexes, lexemes] = await Promise.all([
          db.wordIndex.where("word_id").equals(word.id).toArray(),
          db.lexeme.where("word_id").equals(word.id).toArray(),
        ]);
        return { ...word, indexes, lexemes };
      })
    );
    return result;
  }

  async searchWord(spell: string): Promise<Array<WordSearchResult>> {
    return await searchWord(spell);
  }
}

export const localDataSource = new LocalDataSource();