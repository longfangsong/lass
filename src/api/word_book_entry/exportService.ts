/**
 * Word Book Entry Export Service
 * 
 * Handles wordbook data serialization and export formatting.
 */
import type { WordBookEntry } from '@/types';
import { escapeCSVField } from '../utils/response';

/**
 * Exports wordbook entries as CSV
 */
export function exportWordBookAsCSV(
    entries: Array<WordBookEntry>
): string {
    const header = 'id,wordId,passiveReviewCount,nextPassiveReviewTime,activeReviewCount,nextActiveReviewTime,updateTime';

    const rows = entries.map(entry => {
        return [
            escapeCSVField(entry.id),
            escapeCSVField(entry.word_id),
            entry.passive_review_count,
            entry.next_passive_review_time === -1
                ? ''
                : entry.next_passive_review_time,
            entry.active_review_count,
            entry.next_active_review_time === -1
                ? ''
                : entry.next_active_review_time,
            entry.update_time,
        ].join(',');
    });

    return `${header}\n${rows.join('\n')}`;
}
