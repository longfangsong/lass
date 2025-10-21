/**
 * Export Service
 * 
 * Handles data serialization and export formatting.
 */
import { escapeCSVField } from '../../utils/response';


/**
 * Exports user settings as CSV
 */
export function exportSettingsAsCSV(
  email: string,
  autoNewReview: number,
  dailyNewReviewCount: number,
  update_time: number,
): string {
  const header = 'email,autoNewReview,dailyNewReviewCount';
  const row = [
    escapeCSVField(email),
    autoNewReview,
    dailyNewReviewCount,
    update_time,
  ].join(',');
  
  return `${header}\n${row}`;
}
