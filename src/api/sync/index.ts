import type { WordBookEntry } from "@/types";
import type { RouterContext } from "../router";
import * as cookie from "cookie";
import * as jose from "jose";
import type { Lexeme, Word, WordIndex } from "@/types/database";

const BATCH_SIZE = 2;

// async function updateBatch(db: D1Database, entries: Array<WordBookEntry>) {
//   for (const entry of entries) {
//     const stmt = db.prepare(`
//         UPDATE WordBookEntry SET
//           passive_review_count = ?,
//           next_passive_review_time = ?,
//           active_review_count = ?,
//           next_active_review_time = ?,
//           deleted = ?,
//           update_time = ?,
//           sync_at = ?
//         WHERE id = ?`);

//     await stmt
//       .bind(
//         entry.passive_review_count,
//         entry.next_passive_review_time,
//         entry.active_review_count,
//         entry.next_active_review_time,
//         entry.deleted,
//         entry.update_time,
//         entry.sync_at,
//         entry.id,
//       )
//       .run();
//   }
// }

export async function saveWordBookEntries(
  db: D1Database,
  user_email: string,
  entries: Array<WordBookEntry>,
) {
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const placeholders = batch
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");

    const stmt = db.prepare(`
      INSERT INTO WordBookEntry (
        id, user_email, word_id, passive_review_count,
        next_passive_review_time, active_review_count,
        next_active_review_time, deleted, update_time,
        sync_at
      ) VALUES ${placeholders}
      ON CONFLICT(word_id, user_email) DO UPDATE SET
        passive_review_count = CASE WHEN WordBookEntry.update_time >= excluded.update_time THEN WordBookEntry.passive_review_count ELSE excluded.passive_review_count END,
        next_passive_review_time = CASE WHEN WordBookEntry.update_time >= excluded.update_time THEN WordBookEntry.next_passive_review_time ELSE excluded.next_passive_review_time END,
        active_review_count = CASE WHEN WordBookEntry.update_time >= excluded.update_time THEN WordBookEntry.active_review_count ELSE excluded.active_review_count END,
        next_active_review_time = CASE WHEN WordBookEntry.update_time >= excluded.update_time THEN WordBookEntry.next_active_review_time ELSE excluded.next_active_review_time END,
        deleted = CASE WHEN WordBookEntry.update_time >= excluded.update_time THEN WordBookEntry.deleted ELSE excluded.deleted END,
        update_time = CASE WHEN WordBookEntry.update_time >= excluded.update_time THEN WordBookEntry.update_time ELSE excluded.update_time END,
        sync_at = CASE WHEN WordBookEntry.update_time >= excluded.update_time THEN WordBookEntry.sync_at ELSE excluded.sync_at END;`);

    const bindValues = [];
    for (const entry of batch) {
      bindValues.push(
        entry.id,
        user_email,
        entry.word_id,
        entry.passive_review_count,
        entry.next_passive_review_time,
        entry.active_review_count,
        entry.next_active_review_time,
        entry.deleted,
        entry.update_time,
        entry.sync_at,
      );
    }

    await stmt.bind(...bindValues).run();
  }
}

export async function getWordBookEntries(
  db: D1Database,
  email: string,
  limit: number,
  offset: number,
  from: number,
  to: number,
): Promise<Array<WordBookEntry>> {
  const entries = await db
    .prepare(
      `SELECT * FROM WordBookEntry
      WHERE user_email = ? AND ? <= sync_at AND sync_at < ?
      ORDER BY id
      LIMIT ? OFFSET ?`,
    )
    .bind(email, from, to, limit, offset)
    .all<WordBookEntry>();
  return entries.results;
}

export async function getWords(
  db: D1Database,
  from: number,
  limit: number,
  offset: number,
): Promise<Array<Word>> {
  const words = await db
    .prepare(`SELECT * FROM Word WHERE update_time > ? LIMIT ? OFFSET ?`)
    .bind(from, limit, offset)
    .all<Word>();

  return words.results.map((word) => ({
    id: word.id,
    lemma: word.lemma,
    part_of_speech: word.part_of_speech,
    phonetic: word.phonetic,
    phonetic_voice: word.phonetic_voice,
    phonetic_url: word.phonetic_url,
    update_time: word.update_time,
    frequency: word.frequency,
  }));
}

export async function getWordIndexes(
  db: D1Database,
  from: number,
  limit: number,
  offset: number,
): Promise<Array<WordIndex>> {
  const indexes = await db
    .prepare(`SELECT * FROM WordIndex WHERE update_time > ? LIMIT ? OFFSET ?`)
    .bind(from, limit, offset)
    .all<WordIndex>();

  return indexes.results.map((index) => ({
    id: index.id,
    word_id: index.word_id,
    spell: index.spell,
    form: index.form,
    update_time: index.update_time,
  }));
}

export async function getLexemes(
  db: D1Database,
  from: number,
  limit: number,
  offset: number,
): Promise<Array<Lexeme>> {
  const lexemes = await db
    .prepare(`SELECT * FROM Lexeme WHERE update_time > ? LIMIT ? OFFSET ?`)
    .bind(from, limit, offset)
    .all<Lexeme>();

  return lexemes.results.map((lexeme) => ({
    id: lexeme.id,
    word_id: lexeme.word_id,
    definition: lexeme.definition,
    example: lexeme.example,
    example_meaning: lexeme.example_meaning,
    source: lexeme.source,
    update_time: lexeme.update_time,
  }));
}

export async function post({ params, env, request, query }: RouterContext) {
  const { table } = params;
  const limit = Number(query.get("limit"));
  const offset = Number(query.get("offset"));
  const from = Number(query.get("from"));
  const cookies = cookie.parse(request.headers.get("Cookie") || "");
  const token = cookies.auth_token;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  const { payload } = await jose.jwtVerify(token, secret);
  const { email } = payload;
  const postedContent: Array<WordBookEntry> = await request.json();
  if (table === "WordBookEntry") {
    await saveWordBookEntries(env.DB, email as string, postedContent);
    const to = Number(query.get("to"));
    const updatedEntries = await getWordBookEntries(
      env.DB,
      email as string,
      limit,
      offset,
      from,
      to,
    );
    // updatedEntries.forEach((it) => (it.sync_at = sync_at));
    // await updateBatch(env.DB, updatedEntries);
    return Response.json(updatedEntries);
  } else {
    return new Response(`Unsupported table ${table}`, { status: 422 });
  }
}

export async function get({ params, env, query, request }: RouterContext) {
  const { table } = params;
  const from = Number(query.get("from")!);
  const limit = Number(query.get("limit")!);
  const offset = Number(query.get("offset")!);
  switch (table) {
    case "WordBookEntry": {
      const to = Number(query.get("to")!);
      const cookies = cookie.parse(request.headers.get("Cookie") || "");
      const token = cookies.auth_token;
      if (!token) {
        return new Response("Unauthorized", { status: 401 });
      }
      const secret = new TextEncoder().encode(env.AUTH_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      const { email } = payload;
      return Response.json(
        await getWordBookEntries(
          env.DB,
          email as string,
          limit,
          offset,
          from,
          to,
        ),
      );
    }
    case "Word":
      return Response.json(await getWords(env.DB, from, limit, offset));
    case "WordIndex":
      return Response.json(await getWordIndexes(env.DB, from, limit, offset));
    case "Lexeme":
      return Response.json(await getLexemes(env.DB, from, limit, offset));
    default:
      return new Response(`Unsupported table ${table}`, { status: 422 });
  }
}
