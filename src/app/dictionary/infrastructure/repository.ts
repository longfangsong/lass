import type { DBWord, Word } from "@/app/types";
import { db } from "../../shared/infrastructure/indexeddb";
import type { Lexeme, WordIndex } from "@/types";
import type { Repository } from "@/app/dictionary/domain/repository";
import type { EntityTable } from "dexie";

export const wordTable: EntityTable<
  DBWord & { frequency_rank?: number },
  "id"
> = db.table("Word");
export const wordIndexTable: EntityTable<WordIndex, "id"> =
  db.table("WordIndex");
export const lexemeTable: EntityTable<Lexeme, "id"> = db.table("Lexeme");

export const repository = {
  get basicInfoVersion(): Promise<number | undefined> {
    return db.meta.get("Word").then((it) => it?.version);
  },
  async bulkPutBasicInfo(words: DBWord[]) {
    // updated word has no frequency for now
    await wordTable.bulkPut(words);
  },
  async setBasicInfoVersion(version: number) {
    await db.meta.put({ table_name: "Word", version });
  },
  get indexVersion(): Promise<number | undefined> {
    return db.meta.get("WordIndex").then((it) => it?.version);
  },
  async bulkPutIndex(wordIndex: WordIndex[]) {
    await wordIndexTable.bulkPut(wordIndex);
  },
  async setIndexVersion(version: number) {
    await db.meta.put({ table_name: "WordIndex", version });
  },
  get lexemeVersion(): Promise<number | undefined> {
    return db.meta.get("Lexeme").then((it) => it?.version);
  },
  async bulkPutLexeme(lexeme: Lexeme[]) {
    await lexemeTable.bulkPut(lexeme);
  },
  async setLexemeVersion(version: number) {
    await db.meta.put({ table_name: "Lexeme", version });
  },
  async get(id: string): Promise<Word | undefined> {
    const [word, indexes, lexemes] = await Promise.all([
      wordTable.get(id),
      wordIndexTable.where("word_id").equals(id).toArray(),
      lexemeTable.where("word_id").equals(id).toArray(),
    ]);
    if (!word) return undefined;
    return {
      ...word,
      indexes,
      lexemes,
    };
  },
  async put(word: Word): Promise<void> {
    const saveBasicInfoTask = wordTable.put({
      id: word.id,
      lemma: word.lemma,
      part_of_speech: word.part_of_speech,
      phonetic: word.phonetic,
      update_time: Date.now(),
      frequency: word.frequency,
      phonetic_voice: word.phonetic_voice,
      phonetic_url: word.phonetic_url,
    });
    const saveIndexesTask = wordIndexTable.bulkPut(word.indexes);
    const saveLexemesTask = lexemeTable.bulkPut(word.lexemes);
    await Promise.all([saveBasicInfoTask, saveIndexesTask, saveLexemesTask]);
  },
  async getWordsByIndexSpell(spell: string): Promise<Word[]> {
    const directMatch = await wordTable.where("lemma").equals(spell).toArray();
    const formMatch = await wordIndexTable
      .where("spell")
      .equals(spell)
      .toArray()
      .then((indexes) =>
        indexes.filter((it) => it.form !== null).map((it) => it.word_id),
      )
      .then((ids) => wordTable.where("id").anyOf(ids).toArray())
      .then((result) => result.sort((a, b) => a.lemma.length - b.lemma.length));
    const found = new Set();
    let resultWords: Array<DBWord> = [];
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
      resultWords = await wordIndexTable
        .where("spell")
        .equals(spell)
        .toArray()
        .then((indexes) => indexes.map((it) => it.word_id))
        .then((ids) => wordTable.where("id").anyOf(ids).toArray())
        .then((result) =>
          result.sort(
            (a, b) =>
              Math.abs(a.lemma.length - spell.length) -
              Math.abs(b.lemma.length - spell.length),
          ),
        );
    }
    if (resultWords.length === 0 && spell[0].toLocaleUpperCase() === spell[0]) {
      return await this.getWordsByIndexSpell(spell.toLowerCase());
    }
    const result = await Promise.all(
      resultWords.map(async (word) => {
        const [indexes, lexemes] = await Promise.all([
          wordIndexTable.where("word_id").equals(word.id).toArray(),
          lexemeTable.where("word_id").equals(word.id).toArray(),
        ]);
        return { ...word, indexes, lexemes };
      }),
    );
    return result;
  },
} satisfies Repository;
