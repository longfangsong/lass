export type Theme = "dark" | "light" | "system";

// Import AutoNewReviewPolicy from database types
import { AutoNewReviewPolicy } from '@/types/database';

// Settings interface for the UI (theme is handled by ThemeProvider)
export interface Settings {
  theme: Theme; // For display only, actual storage handled by ThemeProvider
  daily_new_review_count: number;
  notifications_enabled: boolean;
  auto_new_review: AutoNewReviewPolicy;
}

// Default values
export const DEFAULT_DAILY_REVIEW_COUNT = 20;
export const DEFAULT_NOTIFICATIONS_ENABLED = false;
export const DEFAULT_AUTO_NEW_REVIEW = AutoNewReviewPolicy.MostFrequent;

// Simple validation functions
export function isValidDailyReviewCount(value: unknown): value is number {
  return typeof value === 'number' && 
         Number.isInteger(value) && 
         value >= 1 && 
         value <= 100;
}

export function isValidNotificationsEnabled(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isValidAutoNewReviewPolicy(value: unknown): value is AutoNewReviewPolicy {
  return typeof value === 'number' && Object.values(AutoNewReviewPolicy).includes(value as AutoNewReviewPolicy);
}