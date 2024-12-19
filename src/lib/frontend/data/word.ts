import {  Word, WordSearchResult } from "@/lib/types";
import { db } from "../db";

export async function getWord(id: string): Promise<Word | null> {
  const word = await db.word.get(id);
  if (!word) {
    return null;
  }
  const indexes = await db.wordIndex.where("word_id").equals(id).toArray();
  const lexemes = await db.lexeme.where("word_id").equals(id).toArray();
  return {
    ...word,
    indexes,
    lexemes,
  };
}

export async function localIsNewEnough(): Promise<boolean> {
  const meta = await db.meta.toArray();
  if (meta.length === 0) {
    return false;
  }
  const minVersion = meta.reduce((min, it) => Math.min(min, it.version || 0), Number.MAX_VALUE);
  const now = new Date();
  return now.getTime() - minVersion < 1000 * 60 * 60 * 24;
}

export async function searchWord(
  spell: string,
): Promise<WordSearchResult[]> {
  const directMatchTask = db.word
    .where("lemma")
    .equals(spell)
    .toArray();
  const formMatchTask = db.wordIndex
    .where("spell")
    .equals(spell)
    .filter((index) => index.form !== null)
    .toArray()
    .then(indexes => Promise.all(indexes.map(index => db.word.get(index.word_id))));
  const likeMatchTask = db.word.where("lemma").startsWithIgnoreCase(spell).toArray();
  const likeFormMatchIndexesTask = db.wordIndex.where("spell").startsWithIgnoreCase(spell).toArray();
  const likeFormMatchTask = likeFormMatchIndexesTask.then(indexes => Promise.all(indexes.map(index => db.word.get(index.word_id))));
  const [directMatch, formMatch, likeMatch, likeFormMatch] = await Promise.all([directMatchTask, formMatchTask, likeMatchTask, likeFormMatchTask]);
  let words = [...directMatch, ...formMatch, ...likeMatch, ...likeFormMatch];
  const seen = new Set<string>();
  words = words.filter((word) => {
    if (!word || seen.has(word.id)) {
      return false;
    }
    seen.add(word.id);
    return true;
  });
  const result = await Promise.all(words.map(async word => {
    const lexemes = await db.lexeme.where("word_id").equals(word!.id).toArray();
    return {
      id: word!.id,
      lemma: word!.lemma,
      definitions: lexemes.map(lexeme => lexeme.definition),
    };
  }));
  return result;
}
