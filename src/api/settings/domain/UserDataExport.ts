/**
 * User Data Export Interface
 * 
 * This is a virtual entity (not stored in database) that represents
 * the structure of exported user data for GDPR compliance.
 * 
 * Generated on-demand from D1 queries when user requests data export.
 */

export interface ExportMetadata {
  exportDate: string;        // ISO 8601: "2025-10-21T14:30:00Z"
  exportVersion: string;     // API version: "1.0"
  userId: string;            // User email
}

export interface UserInfo {
  email: string;
  registeredAt: string;      // ISO 8601
}

export interface SettingsExport {
  autoNewReview: number;     // 0 = no, 1 = random, 2 = frequent, 3 = fifo
  dailyNewReviewCount: number;
  updatedAt: string;         // ISO 8601
}

/**
 * Settings-only export (for GET /api/settings?format=json|csv)
 */
export interface UserSettingsExport {
  email: string;
  autoNewReview: number;
  dailyNewReviewCount: number;
  registeredAt: number;      
  updatedAt: number;         
}

/**
 * Deletion response
 */
export interface DeletionResult {
  deletedAt: string;        
  recordsDeleted: number;
}

/**
 * Data summary for UI display
 */
export interface DataSummary {
  email: string;
  registeredAt: string;
  wordBookCount: number;
  lastActivityAt: string;
  dataSize: {
    wordbook: string;        // Human-readable (e.g., "15.2 KB")
    settings: string;        // Human-readable (e.g., "0.3 KB")
    total: string;           // Human-readable (e.g., "15.5 KB")
  };
}
