/**
 * D1 Database Queries for Privacy Operations
 * 
 * These functions are used in the API layer (Cloudflare Workers)
 * where D1Database global type is available.
 */

/**
 * Query user settings for export
 * 
 * @param db D1 database instance
 * @param userEmail User email
 * @returns User settings with all fields or null if not found
 */
export async function queryUserSettings(
  db: D1Database,
  userEmail: string
): Promise<{
  user_email: string;
  auto_new_review: number;
  daily_new_review_count: number;
  update_time: number;
} | null> {
  const result = await db
    .prepare('SELECT * FROM UserSettings WHERE user_email = ?')
    .bind(userEmail)
    .first();
  
  return result as {
    user_email: string;
    auto_new_review: number;
    daily_new_review_count: number;
    update_time: number;
  } | null;
}

/**
 * Delete user settings from D1
 * 
 * @param db D1 database instance
 * @param userEmail User email
 * @returns Number of records deleted
 */
export async function deleteUserSettings(
  db: D1Database,
  userEmail: string
): Promise<number> {
  const result = await db
    .prepare('DELETE FROM UserSettings WHERE user_email = ?')
    .bind(userEmail)
    .run();
  
  return result.meta.changes;
}
