import { db } from "@app/infrastructure/indexeddb";
import type { WordSearchResult } from "@/types";

export async function searchWord(
  spell: string,
): Promise<Array<WordSearchResult>> {
  // words which `lemma` is "spell"
  const directMatchTask = db.word.where("lemma").equals(spell).toArray();

  // words which is a form of the word "spell"
  const formMatchTask = db.wordIndex
    .where("spell")
    .equals(spell)
    .filter((index) => index.form !== null)
    .toArray()
    .then((indexes) =>
      Promise.all(indexes.map((index) => db.word.get(index.word_id))),
    );

  // words which `lemma` start with "spell"
  const likeMatchTask = db.word.where("lemma").startsWith(spell).toArray();

  // words which has an index which starts in "spell"
  const likeFormMatchIndexesTask = db.wordIndex
    .where("spell")
    .startsWith(spell)
    .toArray()
    .then((indexes) => {
      const resultSet = new Set<string>();
      indexes.forEach((index) => resultSet.add(index.word_id));
      return Array.from(resultSet);
    });
  const likeFormMatchTask = (async () => {
    const word_ids = await likeFormMatchIndexesTask;
    const words = await db.word.bulkGet(word_ids);
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
    }),
  );
  if (result.length === 0 && spell[0].toLocaleUpperCase() === spell[0]) {
    return await searchWord(spell.toLowerCase());
  }
  return result;
}
