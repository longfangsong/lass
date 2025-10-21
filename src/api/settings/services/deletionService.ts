/**
 * Deletion Service
 * 
 * Handles user data deletion operations for GDPR compliance.
 */

import type { DeletionResult } from '../domain/UserDataExport';

/**
 * Creates deletion result response
 */
export function createDeletionResult(recordsDeleted: number): DeletionResult {
  return {
    deletedAt: Date.now().toString(),
    recordsDeleted,
  };
}

/**
 * Deletes user settings from D1 database
 * 
 * @param db D1 database instance
 * @param userEmail User email to delete
 * @returns Number of records deleted (should be 1)
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
