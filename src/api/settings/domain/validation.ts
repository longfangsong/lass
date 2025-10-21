/**
 * Validation functions for user data export operations
 */

/**
 * Validates export format parameter
 */
export function isValidExportFormat(format: unknown): format is 'json' | 'csv' {
  return format === 'json' || format === 'csv';
}

/**
 * Validates email format (basic validation)
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates ISO 8601 timestamp string
 */
export function isValidISOTimestamp(timestamp: unknown): timestamp is string {
  if (typeof timestamp !== 'string') return false;
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  } catch {
    return false;
  }
}

/**
 * Validates user settings data
 */
export function isValidSettingsData(data: unknown): data is {
  autoNewReview: number;
  dailyNewReviewCount: number;
  updatedAt: string;
} {
  if (typeof data !== 'object' || data === null) return false;
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.autoNewReview === 'number' &&
    obj.autoNewReview >= 0 &&
    obj.autoNewReview <= 3 &&
    typeof obj.dailyNewReviewCount === 'number' &&
    obj.dailyNewReviewCount > 0 &&
    typeof obj.updatedAt === 'string' &&
    isValidISOTimestamp(obj.updatedAt)
  );
}

/**
 * Validates wordbook entry data
 */
export function isValidWordBookEntry(entry: unknown): entry is {
  id: string;
  wordId: string;
  lemma: string;
  passiveReviewCount: number;
  activeReviewCount: number;
  addedAt: string;
} {
  if (typeof entry !== 'object' || entry === null) return false;
  
  const obj = entry as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    obj.id.length > 0 &&
    typeof obj.wordId === 'string' &&
    obj.wordId.length > 0 &&
    typeof obj.lemma === 'string' &&
    obj.lemma.length > 0 &&
    typeof obj.passiveReviewCount === 'number' &&
    obj.passiveReviewCount >= 0 &&
    typeof obj.activeReviewCount === 'number' &&
    obj.activeReviewCount >= 0 &&
    typeof obj.addedAt === 'string' &&
    isValidISOTimestamp(obj.addedAt)
  );
}

/**
 * Sanitizes filename for export
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9_\-.]/gi, '_');
}

/**
 * Generates filename for export
 */
export function generateExportFilename(type: 'settings' | 'wordbook', format: 'json' | 'csv'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `lass-${type}-${date}.${format}`;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}