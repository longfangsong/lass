import { DEFAULT_DAILY_REVIEW_COUNT, DEFAULT_NOTIFICATIONS_ENABLED, DEFAULT_AUTO_NEW_REVIEW, isValidDailyReviewCount, isValidNotificationsEnabled, isValidAutoNewReviewPolicy, type Theme } from '../domain/model';
import { AutoNewReviewPolicy, NotificationPermissionStatus, type UserSettings } from '@/types/database';

const STORAGE_KEYS = {
  DAILY_REVIEW_COUNT: 'lass-daily-review-count', 
  NOTIFICATIONS_ENABLED: 'lass-notifications-enabled',
  AUTO_NEW_REVIEW: 'lass-auto-new-review',
  THEME: 'vite-ui-theme', // Shared with ThemeProvider
  SETTINGS_UPDATE_TIME: 'lass-settings-update-time', // For sync purposes
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
      this.setUpdateTime(Date.now());
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
      this.setUpdateTime(Date.now());
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
      this.setUpdateTime(Date.now());
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

  // Get update time for sync
  private getUpdateTime(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATE_TIME);
      if (stored) {
        return parseInt(stored, 10);
      }
    } catch (error) {
      console.warn('Failed to read settings update time from localStorage:', error);
    }
    return Date.now();
  }

  private setUpdateTime(time: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS_UPDATE_TIME, time.toString());
    } catch (error) {
      console.error('Failed to save settings update time to localStorage:', error);
    }
  }

  // Full UserSettings object for sync - composed from individual keys
  getUserSettings(): UserSettings | undefined {
    try {
      // Check if we have any settings stored
      const hasAnySettings = 
        localStorage.getItem(STORAGE_KEYS.DAILY_REVIEW_COUNT) !== null ||
        localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== null ||
        localStorage.getItem(STORAGE_KEYS.AUTO_NEW_REVIEW) !== null;

      if (!hasAnySettings) {
        return undefined;
      }

      const theme = (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || 'system';
      
      // TODO: For notification_permission_status, we need to check the actual permission
      const notificationPermissionStatus = NotificationPermissionStatus.Unsupported;
      // if ('Notification' in window) {
      //   notificationPermissionStatus = Notification.permission as NotificationPermissionStatus;
      // }

      return {
        auto_new_review: this.getAutoNewReview(),
        daily_new_review_count: this.getDailyReviewCount(),
        update_time: this.getUpdateTime(),
        theme,
        notifications_enabled: this.getNotificationsEnabled(),
        notification_permission_status: notificationPermissionStatus,
      };
    } catch (error) {
      console.warn('Failed to compose user settings from localStorage:', error);
      return undefined;
    }
  }

  setUserSettings(settings: UserSettings): void {
    try {
      // Decompose the UserSettings object into individual keys
      // We directly set values here to avoid calling setters multiple times (which would update timestamp)
      if (isValidDailyReviewCount(settings.daily_new_review_count)) {
        localStorage.setItem(STORAGE_KEYS.DAILY_REVIEW_COUNT, settings.daily_new_review_count.toString());
      }
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, settings.notifications_enabled.toString());
      if (isValidAutoNewReviewPolicy(settings.auto_new_review)) {
        localStorage.setItem(STORAGE_KEYS.AUTO_NEW_REVIEW, settings.auto_new_review.toString());
      }
      localStorage.setItem(STORAGE_KEYS.THEME, settings.theme);
      this.setUpdateTime(settings.update_time);
      // notification_permission_status is read-only (browser-controlled), so we don't store it
    } catch (error) {
      console.error('Failed to save user settings to localStorage:', error);
      throw error;
    }
  }
}

export const settingsStorage = new SettingsStorage();