import { dictionaryModel } from "../ai";
import { DBTypes, Word, WordSearchResult } from "../types";

function unescapeString(str: string): string {
  return str.replace(/&#39;/g, "'");
}

function unescapeObject(obj: any): any {
  if (typeof obj === "string") {
    return unescapeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(unescapeObject);
  }
  if (typeof obj === "object" && obj !== null) {
    const result: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = unescapeObject(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

export async function searchWord(
  db: D1Database,
  spell: string
): Promise<Array<WordSearchResult>> {
  const result = await db
    .prepare(
      `SELECT FoundWords.id, FoundWords.lemma, Lexeme.definition, Lexeme.source FROM (
          SELECT 0 as source_id, Word.id, Word.lemma, length (lemma) FROM Word WHERE Word.lemma=?1
          UNION
          SELECT 1 as source_id, Word.id, Word.lemma, length (lemma) FROM Word, WordIndex
            WHERE Word.id=WordIndex.word_id AND WordIndex.spell=?1 AND WordIndex.form is not null
          UNION
          SELECT 2 as source_id, Word.id, Word.lemma, length (lemma) FROM Word WHERE Word.lemma LIKE ?2
          UNION
          SELECT 3 as source_id, Word.id, Word.lemma, length (lemma) FROM Word, WordIndex WHERE Word.id=WordIndex.word_id AND WordIndex.spell LIKE ?2
          ORDER BY length (lemma)
          LIMIT 20
      ) AS FoundWords, Lexeme
      WHERE FoundWords.id=Lexeme.word_id
      GROUP BY FoundWords.lemma, Lexeme.definition
      ORDER BY FoundWords.source_id ASC;`
    )
    .bind(spell, `${spell}%`)
    .all<{ id: string; lemma: string; definition: string }>();
  if (!result.success) throw new Error(result.error);
  const groupedResults: Record<string, WordSearchResult> = {};
  for (const row of result.results) {
    if (!groupedResults[row.id]) {
      groupedResults[row.id] = {
        id: row.id,
        lemma: row.lemma,
        definitions: [],
      };
    }
    groupedResults[row.id].definitions.push(row.definition);
  }
  return unescapeObject(Object.values(groupedResults));
}

async function getDBWord(
  db: D1Database,
  id: string
): Promise<DBTypes.Word | null> {
  return unescapeObject(
    await db
      .prepare(
        `SELECT Word.id, Word.lemma, Word.part_of_speech, Word.phonetic, Word.phonetic_voice, Word.phonetic_url
      FROM Word
      WHERE Word.id=?1`
      )
      .bind(id)
      .first<DBTypes.Word>()
  );
}

export async function getDBWordsByIndex(
  db: D1Database,
  index_spell: string
): Promise<Array<DBTypes.Word> | null> {
  const queryResult = await db
    .prepare(
      `
      SELECT DISTINCT FoundWord.id,
          FoundWord.lemma,
          FoundWord.part_of_speech,
          FoundWord.phonetic,
          FoundWord.phonetic_voice,
          FoundWord.phonetic_url
      FROM (
        SELECT 0 as source_id,
          Word.id,
          Word.lemma,
          Word.part_of_speech,
          Word.phonetic,
          Word.phonetic_voice,
          Word.phonetic_url
        FROM Word
        WHERE Word.lemma=?1
        UNION
        SELECT 1 as source_id,
          Word.id,
          Word.lemma,
          Word.part_of_speech,
          Word.phonetic,
          Word.phonetic_voice,
          Word.phonetic_url
        FROM Word, WordIndex
        WHERE Word.id=WordIndex.word_id
          AND WordIndex.spell=?1
          AND WordIndex.form is NOT NULL
      ) as FoundWord ORDER BY source_id, length(FoundWord.lemma);`
    )
    .bind(index_spell)
    .all<DBTypes.Word>();
  if (queryResult.success && queryResult.results.length !== 0) {
    return unescapeObject(queryResult.results);
  }
  const backupQueryResult = await db
    .prepare(
      `SELECT Word.id,
          Word.lemma,
          Word.part_of_speech,
          Word.phonetic,
          Word.phonetic_voice,
          Word.phonetic_url,
          ABS(length(WordIndex.spell)-length(?1)) as length_diff
      FROM Word, WordIndex
      WHERE Word.id=WordIndex.word_id
          AND WordIndex.spell=?1
          AND WordIndex.form is NULL
          ORDER BY length_diff ASC;`
    )
    .bind(index_spell)
    .all<DBTypes.Word>();
  return backupQueryResult.success
    ? unescapeObject(backupQueryResult.results)
    : null;
}

async function getDBWordIndexesByWordId(
  db: D1Database,
  wordId: string
): Promise<Array<DBTypes.WordIndex>> {
  const result = await db
    .prepare(
      `SELECT WordIndex.id, WordIndex.word_id, WordIndex.spell, WordIndex.form
      FROM WordIndex
      WHERE WordIndex.word_id=?1`
    )
    .bind(wordId)
    .all<DBTypes.WordIndex>();
  if (!result.success) throw new Error(result.error);
  return unescapeObject(result.results);
}

async function getDBLexemesByWordId(
  db: D1Database,
  wordId: string
): Promise<Array<DBTypes.Lexeme>> {
  const result = await db
    .prepare(
      `SELECT Lexeme.id, Lexeme.word_id, Lexeme.definition, Lexeme.example, Lexeme.example_meaning, Lexeme.source
      FROM Lexeme
      WHERE Lexeme.word_id=?1`
    )
    .bind(wordId)
    .all<DBTypes.Lexeme>();
  if (!result.success) throw new Error(result.error);
  return unescapeObject(result.results);
}

interface AIResponse {
  spell: string;
  pronunciation: string;
  part_of_speech: string;
  meaning: string;
  example_sentence: string;
  example_sentence_meaning: string;
}

async function saveAIResponseIntoDB(db_client: D1Database, word: Word) {
  await saveDBWord(db_client, word);
  const lexeme = word.lexemes[0];
  const wordIndex = word.indexes[0];
  await Promise.all([
    saveWordIndex(db_client, wordIndex),
    saveLexeme(db_client, lexeme),
  ]);
}

async function saveLexeme(db_client: D1Database, lexeme: DBTypes.Lexeme) {
  await db_client
    .prepare(
      `INSERT INTO Lexeme (id, word_id, definition, example, example_meaning, source) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(
      lexeme.id,
      lexeme.word_id,
      lexeme.definition,
      lexeme.example,
      lexeme.example_meaning,
      lexeme.source
    )
    .run();
}

async function saveWordIndex(
  db_client: D1Database,
  wordIndex: DBTypes.WordIndex
) {
  await db_client
    .prepare(
      `INSERT INTO WordIndex (id, word_id, spell, form) VALUES (?1, ?2, ?3, ?4)`
    )
    .bind(wordIndex.id, wordIndex.word_id, wordIndex.spell, wordIndex.form)
    .run();
}

async function saveDBWord(db_client: D1Database, word: DBTypes.Word) {
  await db_client
    .prepare(
      `INSERT INTO Word (id, lemma, part_of_speech, phonetic, phonetic_voice, phonetic_url) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(
      word.id,
      word.lemma,
      word.part_of_speech,
      word.phonetic,
      word.phonetic_voice,
      word.phonetic_url
    )
    .run();
}

async function fetchPhonetic(spell: string): Promise<ArrayBuffer> {
  const url = `https://ttsmp3.com/makemp3_new.php`;
  const headers = new Headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded");
  const urlencoded = new URLSearchParams();
  urlencoded.append("msg", spell);
  urlencoded.append("lang", "Astrid");
  urlencoded.append("source", "ttsmp3");
  const requestOptions = {
    method: "POST",
    headers: headers,
    body: urlencoded,
    signal: AbortSignal.timeout(5000),
  };
  let response = await fetch(url, requestOptions);
  let response_json: any = await response.json();
  let pronunciation_url = response_json["URL"];
  let pronunciation_response = await fetch(pronunciation_url!);
  return await pronunciation_response.arrayBuffer();
}

export async function getWordByAI(spell: string): Promise<Word> {
  const model = dictionaryModel();
  const result = await model.generateContent(
    `Check the Swedish word "${spell}" in dictionary.
    - If it is a noun please check its indefinite single form.
    - If it is a verb please check its imperative form.
    - If it is a adjective please check its n-form.
    - Else just check its origin form.`
  );

  const responseJson: AIResponse = JSON.parse(result.response.text());
  const wordId = crypto.randomUUID();
  let dbWord: Word = {
    id: wordId,
    lemma: responseJson.spell,
    part_of_speech: responseJson.part_of_speech,
    phonetic: responseJson.pronunciation,
    phonetic_voice: null,
    phonetic_url: null,
    indexes: [
      {
        id: crypto.randomUUID(),
        word_id: wordId,
        spell: responseJson.pronunciation,
        form: null,
      },
    ],
    lexemes: [
      {
        id: crypto.randomUUID(),
        word_id: wordId,
        definition: responseJson.meaning,
        example: responseJson.example_sentence,
        example_meaning: responseJson.example_sentence_meaning,
        source: "gemini",
      },
    ],
  };
  dbWord.phonetic_voice = Array.from(
    new Uint8Array(await fetchPhonetic(dbWord.lemma))
  );
  return dbWord;
}

export async function getWord(
  db: D1Database,
  id: string
): Promise<Word | null> {
  const word = await getDBWord(db, id);
  if (!word) return null;
  const [indexes, lexemes] = await Promise.all([
    getDBWordIndexesByWordId(db, id),
    getDBLexemesByWordId(db, id),
  ]);
  return {
    ...word,
    indexes,
    lexemes,
  };
}

export async function getWords(db: D1Database, ids: string[]): Promise<Word[]> {
  const words = await db
    .prepare(
      `SELECT Word.id, Word.lemma, Word.part_of_speech, Word.phonetic, Word.phonetic_voice, Word.phonetic_url,
        WordIndex.id as index_id, WordIndex.spell as index_spell, WordIndex.form as index_form,
        Lexeme.id as lexeme_id, Lexeme.definition, Lexeme.example, Lexeme.example_meaning, Lexeme.source
      FROM Word, WordIndex, Lexeme
      WHERE Word.id = WordIndex.word_id AND
        Word.id = Lexeme.word_id AND
        Word.id IN (${ids.map(() => "?").join(",")})`
    )
    .bind(...ids)
    .all<
      DBTypes.Word & {
        index_id: string;
        index_spell: string;
        index_form: string;
        lexeme_id: string;
        definition: string;
        example: string;
        example_meaning: string;
        source: string;
      }
    >();

  if (!words.success) throw new Error(words.error);

  const wordMap = new Map<string, Word>();

  for (const row of words.results) {
    if (!wordMap.has(row.id)) {
      wordMap.set(row.id, {
        id: row.id,
        lemma: row.lemma,
        part_of_speech: row.part_of_speech,
        phonetic: row.phonetic,
        phonetic_voice: row.phonetic_voice,
        phonetic_url: row.phonetic_url,
        indexes: [],
        lexemes: [],
      });
    }

    const word = wordMap.get(row.id)!;

    if (
      row.index_id &&
      !word.indexes.find((wordIndex) => wordIndex.id === row.index_id)
    ) {
      word.indexes.push({
        id: row.index_id,
        word_id: row.id,
        spell: row.index_spell,
        form: row.index_form,
      });
    }

    if (
      row.lexeme_id &&
      !word.lexemes.find((lexeme) => lexeme.id === row.lexeme_id)
    ) {
      word.lexemes.push({
        id: row.lexeme_id,
        word_id: row.id,
        definition: row.definition,
        example: row.example,
        example_meaning: row.example_meaning,
        source: row.source,
      });
    }
  }

  return unescapeObject(Array.from(wordMap.values()));
}

export async function getWordsByIndex(
  db: D1Database,
  index_spell: string
): Promise<Array<Word> | null> {
  let words = await getDBWordsByIndex(db, index_spell);
  if (!words || words.length === 0) {
    const aiResponse = await getWordByAI(index_spell);
    await saveAIResponseIntoDB(db, aiResponse);
    words = [aiResponse];
  }
  return await Promise.all(
    words.map(async (word) => {
      const [indexes, lexemes] = await Promise.all([
        getDBWordIndexesByWordId(db, word.id),
        getDBLexemesByWordId(db, word.id),
      ]);
      return {
        ...word,
        indexes,
        lexemes,
      };
    })
  );
}
