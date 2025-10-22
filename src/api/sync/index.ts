import type { WordBookEntry } from "@/types";
import type { RouterContext } from "../router";
import * as cookie from "cookie";
import * as jose from "jose";
import type { Article, Lexeme, Word, WordIndex, UserSettings } from "@/types/database";

export async function saveWordBookEntries(
  db: D1Database,
  user_email: string,
  entries: Array<WordBookEntry>,
) {
  const saveBatchSize = 4;
  for (let i = 0; i < entries.length; i += saveBatchSize) {
    const batch = entries.slice(i, i + saveBatchSize);
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

export async function getArticles(
  db: D1Database,
  from: number,
  limit: number,
  offset: number,
): Promise<Array<Article>> {
  const articles = await db
    .prepare(
      `SELECT * FROM Article WHERE update_time > ? ORDER BY update_time DESC LIMIT ? OFFSET ?`,
    )
    .bind(from, limit, offset)
    .all<Article>();

  return articles.results;
}

export async function getUserSettings(
  db: D1Database,
  email: string,
): Promise<Pick<UserSettings, 'auto_new_review' | 'daily_new_review_count' | 'update_time'> | null> {
  const result = await db
    .prepare(`SELECT auto_new_review, daily_new_review_count, update_time FROM UserSettings WHERE user_email = ?`)
    .bind(email)
    .first<Pick<UserSettings, 'auto_new_review' | 'daily_new_review_count' | 'update_time'>>();
  
  return result;
}

export async function saveUserSettings(
  db: D1Database,
  email: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  // Only save the fields that are stored in D1
  await db
    .prepare(`
      INSERT INTO UserSettings (user_email, auto_new_review, daily_new_review_count, update_time)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_email) DO UPDATE SET
        auto_new_review = CASE WHEN UserSettings.update_time >= excluded.update_time THEN UserSettings.auto_new_review ELSE excluded.auto_new_review END,
        daily_new_review_count = CASE WHEN UserSettings.update_time >= excluded.update_time THEN UserSettings.daily_new_review_count ELSE excluded.daily_new_review_count END,
        update_time = CASE WHEN UserSettings.update_time >= excluded.update_time THEN UserSettings.update_time ELSE excluded.update_time END
    `)
    .bind(
      email,
      settings.auto_new_review || 2,
      settings.daily_new_review_count || 10,
      settings.update_time || Date.now(),
    )
    .run();
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

  if (table === "WordBookEntry") {
    const postedContent: Array<WordBookEntry> = await request.json();
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
    return Response.json(updatedEntries);
  } else if (table === "UserSettings") {
    const postedSettings: Partial<UserSettings> = await request.json();
    // Save the posted settings (will use LWW based on update_time)
    console.log(postedSettings);
    await saveUserSettings(env.DB, email as string, postedSettings);
    // Get the current settings from DB (after conflict resolution)
    const currentSettings = await getUserSettings(env.DB, email as string);
    return Response.json(currentSettings);
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
    case "Article":
      return Response.json(await getArticles(env.DB, from, limit, offset));
    default:
      return new Response(`Unsupported table ${table}`, { status: 422 });
  }
}
