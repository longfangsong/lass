import {
  ClientSideDBReviewProgress,
  DBTypes,
  ReviewProgress,
  ReviewProgressAtSnapshot,
  ReviewProgressAtSnapshotWithWord,
  ReviewProgressPatchPayload,
} from "@/lib/types";
import { unescapeObject } from "./word";

export const PAGE_SIZE = 20;

export async function createReviewProgess(
  db: D1Database,
  user_email: string,
  word_id: string,
) {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO ReviewProgress(id, user_email, word_id, last_review_time, update_time) VALUES (?1, ?2, ?3, ?4, 1000 * strftime ('%s', 'now'));`,
    )
    .bind(id, user_email, word_id, new Date().getTime())
    .run();
  return id;
}

export async function getReviewProgress(
  db: D1Database,
  id: string,
): Promise<ReviewProgress | null> {
  return await db
    .prepare(
      `SELECT * FROM ReviewProgress WHERE id = ?1;`,
    )
    .bind(id)
    .first<ReviewProgress>();
}

function generateSQL(payload: ReviewProgressPatchPayload): string {
  let result = "UPDATE ReviewProgress SET";
  let current_index = 2;
  [
    "query_count",
    "review_count",
    "last_last_review_time",
    "last_review_time",
  ].forEach((field) => {
    if (payload[field as keyof ReviewProgressPatchPayload] !== undefined) {
      result += ` ${field}=?${current_index},\n`;
      current_index++;
    }
  });
  result = result.trim();
  result += "update_time=(1000 * strftime ('%s', 'now')) WHERE id=?1;";
  return result;
}

export async function updateReviewProgress(
  db: D1Database,
  id: string,
  payload: ReviewProgressPatchPayload,
) {
  const update_sql = generateSQL(payload);
  const params = [
    id,
    payload.query_count,
    payload.review_count,
    payload.last_last_review_time,
    payload.last_review_time,
  ].filter((it) => it !== undefined);
  await db
    .prepare(update_sql)
    .bind(...params)
    .run();
}

export async function getReviewProgressAtSnapshotWithWord(
  db: D1Database,
  userEmail: string,
  snapshotTime: number,
  offset: number,
  limit: number,
): Promise<Array<ReviewProgressAtSnapshotWithWord>> {
  // ---last_last_review_time---(last_review_enable_time)---last_review_time---(next_review_time)
  //                                                      ^ snapshot ==> reviewed after snapshot
  //                                                                         ^ snapshot ==> not reviewd
  const result = await db
    .prepare(
      `SELECT 
        ReviewProgressWithWord.*, 
        Lexeme.id as lexeme_id, 
        Lexeme.definition, 
        Lexeme.example, 
        Lexeme.example_meaning, 
        Lexeme.source
      FROM 
        (SELECT
          ReviewProgress.id as id,
          user_email,
          ReviewProgress.word_id as word_id,
          query_count,
          review_count,
          last_last_review_time,
          last_review_time,
          ReviewProgress.update_time as update_time,

          lemma,
          part_of_speech,
          phonetic,
          phonetic_voice,
          phonetic_url,

          CASE WHEN ?2 < last_review_time
            THEN review_count - 1
            ELSE review_count
          END as snapshot_review_count,
          CASE
            WHEN ?2 >= last_review_time AND review_count >= 6 THEN 8640000000000000
            WHEN ?2 < last_review_time THEN (coalesce(last_last_review_time + 24 * 60 * 60 * 1000 * CASE review_count - 1
                WHEN 0 THEN 0
                WHEN 1 THEN 1
                WHEN 2 THEN 3
                WHEN 3 THEN 7
                WHEN 4 THEN 15
                WHEN 5 THEN 30
                ELSE NULL
            END, 0))
            ELSE (SELECT coalesce(last_review_time + 24 * 60 * 60 * 1000 * CASE review_count
                WHEN 0 THEN 0
                WHEN 1 THEN 1
                WHEN 2 THEN 3
                WHEN 3 THEN 7
                WHEN 4 THEN 15
                WHEN 5 THEN 30
                ELSE NULL
              END, 0))
          END as snapshot_next_reviewable_time,
          (
            SELECT coalesce(last_review_time + 24 * 60 * 60 * 1000 * CASE review_count
                WHEN 0 THEN 0
                WHEN 1 THEN 1
                WHEN 2 THEN 3
                WHEN 3 THEN 7
                WHEN 4 THEN 15
                WHEN 5 THEN 30
                ELSE NULL
              END, 0)
          ) as next_reviewable_time
          FROM ReviewProgress, Word
          WHERE ReviewProgress.user_email = ?1
            AND ReviewProgress.word_id = Word.id
          ORDER BY snapshot_next_reviewable_time ASC NULLS LAST, snapshot_review_count DESC
          LIMIT ?4 OFFSET ?3 
        ) AS ReviewProgressWithWord, Lexeme
      WHERE ReviewProgressWithWord.word_id = Lexeme.word_id;`,
    )
    .bind(userEmail, snapshotTime, offset, limit)
    .all<
      ReviewProgressAtSnapshot &
        Omit<DBTypes.Word, "id"> & {
          lexeme_id: string;
          definition: string;
          example: string;
          example_meaning: string;
          source: string;
          update_time: number;
        }
    >();
  const resultMap = new Map<string, ReviewProgressAtSnapshotWithWord>();

  for (const row of result.results) {
    if (!resultMap.has(row.id)) {
      resultMap.set(row.id, {
        ...row,
        lexemes: [],
      });
    }

    const resultItem = resultMap.get(row.id)!;

    resultItem.lexemes.push({
      id: row.lexeme_id,
      word_id: row.word_id,
      definition: row.definition,
      example: row.example,
      example_meaning: row.example_meaning,
      source: row.source,
      update_time: row.update_time,
    });
  }

  return unescapeObject(Array.from(resultMap.values()));
}

export async function getReviewProgressByWord(
  db: D1Database,
  userEmail: string,
  wordId: string,
): Promise<ReviewProgress | null> {
  return await db
    .prepare(
      `SELECT
      id,
      user_email,
      word_id,
      query_count,
      review_count,
      last_last_review_time,
      last_review_time,
      (
        SELECT last_review_time + 24 * 60 * 60 * 1000 * CASE review_count
            WHEN 0 THEN 0
            WHEN 1 THEN 1
            WHEN 2 THEN 3
            WHEN 3 THEN 7
            WHEN 4 THEN 15
            WHEN 5 THEN 30
            ELSE NULL
          END
      ) as next_reviewable_time
    FROM ReviewProgress
    WHERE ReviewProgress.user_email = ?1 AND ReviewProgress.word_id = ?2;`,
    )
    .bind(userEmail, wordId)
    .first<ReviewProgress>();
}

export async function getReviewProgressesOfUserCount(
  db: D1Database,
  userEmail: string,
): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count
    FROM ReviewProgress
    WHERE ReviewProgress.user_email = ?1;`,
    )
    .bind(userEmail)
    .first<{ count: number }>();
  return result?.count || 0;
}

export async function getReviewProgressesUpdatedAfterCount(
  db: D1Database,
  userEmail: string,
  timestamp: number,
): Promise<number> {
  return (
    (await db
      .prepare(
        `SELECT COUNT(*) as count
    FROM ReviewProgress
    WHERE ReviewProgress.user_email = ?1
    AND ReviewProgress.update_time > ?2
    ORDER BY id ASC
    LIMIT ?3 OFFSET ?4;`,
      )
      .bind(userEmail, timestamp)
      .first<number>()) || 0
  );
}

export async function getDBReviewProgressUpdateIn(
  db: D1Database,
  userEmail: string,
  update_after: number,
  update_before: number,
  limit: number,
  offset: number,
): Promise<Array<DBTypes.ReviewProgress>> {
  const result = await db
    .prepare(
      `SELECT id, user_email, word_id, query_count, review_count, last_last_review_time, last_review_time, update_time
      FROM ReviewProgress WHERE user_email=?1 AND update_time > ?2 AND update_time < ?3 LIMIT ?4 OFFSET ?5`,
    )
    .bind(userEmail, update_after, update_before, limit, offset)
    .all<DBTypes.ReviewProgress>();
  if (!result.success) throw new Error(result.error);
  return result.results;
}

export async function upsertDBReviewProgresses(
  db: D1Database,
  userEmail: string,
  updates: Array<ClientSideDBReviewProgress>,
) {
  const stmt = db.prepare(
    `INSERT INTO ReviewProgress(id, user_email, word_id, query_count, review_count, last_last_review_time, last_review_time, update_time)
          VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
          ON CONFLICT(id) DO UPDATE SET
            query_count=excluded.query_count,
            review_count=excluded.review_count,
            last_last_review_time=excluded.last_last_review_time,
            last_review_time=excluded.last_review_time,
            update_time=excluded.update_time
          WHERE update_time < excluded.update_time AND user_email=excluded.user_email;`,
  );
  const stmts = updates.map((update) =>
    stmt.bind(
      update.id,
      userEmail,
      update.word_id,
      update.query_count,
      update.review_count,
      update.last_last_review_time,
      update.last_review_time,
      update.update_time,
    ),
  );
  if (stmts.length === 0) return;
  await db.batch(stmts);
}
