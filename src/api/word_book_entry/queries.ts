/**
 * D1 Database Queries for Word Book Entry Operations
 * 
 * These functions are used in the API layer (Cloudflare Workers)
 * where D1Database global type is available.
 */

import type { WordBookEntry } from "../types";

/**
 * Query wordbook entries with Word details for export
 * 
 * @param db D1 database instance
 * @param userEmail User email
 * @returns Array of wordbook entries with joined Word data
 */
export async function queryWordBookEntries(
  db: D1Database,
  userEmail: string
): Promise<Array<WordBookEntry>> {
const result = await db
    .prepare(`
        SELECT
            id,
            word_id,
            passive_review_count,
            next_passive_review_time,
            active_review_count,
            next_active_review_time,
            deleted,
            update_time,
            sync_at
        FROM WordBookEntry
        WHERE user_email = ?
    `)
    .bind(userEmail)
    .all<Omit<WordBookEntry, 'user_email'>>();
  
  return result.results.map(entry => ({
    ...entry,
    user_email: userEmail,
  }));
}

/**
 * Delete all wordbook entries for a user
 * 
 * @param db D1 database instance
 * @param userEmail User email
 * @returns Number of records deleted
 */
export async function deleteWordBookEntries(
  db: D1Database,
  userEmail: string
): Promise<number> {
  const result = await db
    .prepare('DELETE FROM WordBookEntry WHERE user_email = ?')
    .bind(userEmail)
    .run();
  
  return result.meta.changes;
}
