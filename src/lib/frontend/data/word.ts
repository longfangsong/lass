import { Word, WordSearchResult } from "@/lib/types";
import { getDB } from "../db";

export async function getWord(id: string): Promise<Word | null> {
  const db = await getDB();
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
  const db = await getDB();
  const [word, wordIndex, lexeme] = await Promise.all([
    db.meta.get("Word"),
    db.meta.get("WordIndex"),
    db.meta.get("Lexeme"),
  ]);
  if (
    word?.version === undefined ||
    wordIndex?.version === undefined ||
    lexeme?.version === undefined
  ) {
    return false;
  }
  const minVersion = Math.min(word.version, wordIndex.version, lexeme.version);
  const now = new Date();
  return now.getTime() - minVersion < 1000 * 60 * 60 * 24;
}

export async function searchWord(spell: string): Promise<WordSearchResult[]> {
  const startTime = new Date();
  const db = await getDB();

  const directMatchTask = db.word.where("lemma").equals(spell).toArray().then(words => {
    console.log(`Direct match ${spell} in local took ${new Date().getTime() - startTime.getTime()}ms`);
    console.log(`direct match count: ${words.length}`);
    return words;
  });

  const formMatchTask = db.wordIndex
    .where("spell")
    .equals(spell)
    .filter((index) => index.form !== null)
    .toArray()
    .then((indexes) =>
      Promise.all(indexes.map((index) => db.word.get(index.word_id)))
    ).then(words => {
      console.log(`Form match ${spell} in local took ${new Date().getTime() - startTime.getTime()}ms`);
      console.log(`form match count: ${words.length}`);
      return words;
    });

  const likeMatchTask = db.word
    .where("lemma")
    .startsWithIgnoreCase(spell)
    .toArray()
    .then(words => {
      console.log(`Like match ${spell} in local took ${new Date().getTime() - startTime.getTime()}ms`);
      console.log(`like match count: ${words.length}`);
      return words;
    });

  const likeFormMatchIndexesTask = db.wordIndex
    .where("spell")
    .startsWithIgnoreCase(spell)
    .toArray()
    .then(indexes => {
      const resultSet = new Set<string>();
      indexes.forEach(index => resultSet.add(index.word_id));
      return Array.from(resultSet);
    });

  const likeFormMatchTask = (async () => {
    const word_ids = await likeFormMatchIndexesTask;
    const words = await db.word.bulkGet(word_ids);
    console.log(`Like form match ${spell} in local took ${new Date().getTime() - startTime.getTime()}ms`);
    console.log(`like form match count: ${words.length}`);
    return words;
  })();

  const [directMatch, formMatch, likeMatch, likeFormMatch] = await Promise.all([
    directMatchTask,
    formMatchTask,
    likeMatchTask,
    likeFormMatchTask,
  ]);
  let words = [...directMatch, ...formMatch, ...likeMatch, ...likeFormMatch];
  const seen = new Set<string>();
  words = words.filter((word) => {
    if (!word || seen.has(word.id)) {
      return false;
    }
    seen.add(word.id);
    return true;
  });
  const result = await Promise.all(
    words.map(async (word) => {
      const lexemes = await db.lexeme
        .where("word_id")
        .equals(word!.id)
        .toArray();
      return {
        id: word!.id,
        lemma: word!.lemma,
        definitions: lexemes.map((lexeme) => lexeme.definition),
      };
    })
  );
  const endTime = new Date();
  console.log(
    `Search word ${spell} in local took ${
      endTime.getTime() - startTime.getTime()
    }ms`
  );
  return result;
}
