import { DEFAULT_DAILY_REVIEW_COUNT, DEFAULT_NOTIFICATIONS_ENABLED, DEFAULT_AUTO_NEW_REVIEW, isValidDailyReviewCount, isValidNotificationsEnabled, isValidAutoNewReviewPolicy } from '../domain/model';
import { AutoNewReviewPolicy } from '@/types/database';

const STORAGE_KEYS = {
  DAILY_REVIEW_COUNT: 'lass-daily-review-count', 
  NOTIFICATIONS_ENABLED: 'lass-notifications-enabled',
  AUTO_NEW_REVIEW: 'lass-auto-new-review',
} as const;

export class SettingsStorage {
  // Daily review count
  getDailyReviewCount(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DAILY_REVIEW_COUNT);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (isValidDailyReviewCount(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to read daily review count from localStorage:', error);
    }
    return DEFAULT_DAILY_REVIEW_COUNT;
  }

  setDailyReviewCount(count: number): void {
    if (!isValidDailyReviewCount(count)) {
      throw new Error(`Invalid daily review count: ${count}. Must be between 1 and 100.`);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_REVIEW_COUNT, count.toString());
    } catch (error) {
      console.error('Failed to save daily review count to localStorage:', error);
      throw error;
    }
  }

  // Notifications enabled
  getNotificationsEnabled(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
      if (stored) {
        const parsed = stored === 'true';
        if (isValidNotificationsEnabled(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to read notifications enabled from localStorage:', error);
    }
    return DEFAULT_NOTIFICATIONS_ENABLED;
  }

  setNotificationsEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Failed to save notifications enabled to localStorage:', error);
      throw error;
    }
  }

  // Auto new review policy
  getAutoNewReview(): AutoNewReviewPolicy {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTO_NEW_REVIEW);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (isValidAutoNewReviewPolicy(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to read auto new review policy from localStorage:', error);
    }
    return DEFAULT_AUTO_NEW_REVIEW;
  }

  setAutoNewReview(policy: AutoNewReviewPolicy): void {
    if (!isValidAutoNewReviewPolicy(policy)) {
      throw new Error(`Invalid auto new review policy: ${policy}. Must be a valid policy number.`);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_NEW_REVIEW, policy.toString());
    } catch (error) {
      console.error('Failed to save auto new review policy to localStorage:', error);
      throw error;
    }
  }

  // Utility methods
  clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear settings from localStorage:', error);
      throw error;
    }
  }
}

export const settingsStorage = new SettingsStorage();