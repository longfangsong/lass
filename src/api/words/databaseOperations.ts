import type { Word } from "@/types";

export async function saveWord(word: Word, db: D1Database) {
  await db
    .prepare(
      "INSERT INTO Word (id, lemma, part_of_speech, phonetic, phonetic_voice, phonetic_url, update_time, frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      word.id,
      word.lemma,
      word.part_of_speech,
      word.phonetic,
      word.phonetic_voice,
      word.phonetic_url,
      word.update_time,
      word.frequency,
    )
    .run();
  const indexesTask = word.indexes.map((index) => {
    return db
      .prepare(
        "INSERT INTO WordIndex (id, word_id, spell, form, update_time) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(index.id, word.id, index.spell, index.form, index.update_time)
      .run();
  });

  const lexemesTask = word.lexemes.map((lexeme) => {
    return db
      .prepare(
        "INSERT INTO Lexeme (id, word_id, definition, example, example_meaning, source, update_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        lexeme.id,
        word.id,
        lexeme.definition,
        lexeme.example,
        lexeme.example_meaning,
        lexeme.source,
        lexeme.update_time,
      )
      .run();
  });

  await Promise.all([...indexesTask, ...lexemesTask]);
}
