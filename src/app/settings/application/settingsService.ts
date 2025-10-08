import type { Settings, Theme } from '../domain/model';
import { AutoNewReviewPolicy } from '@/types/database';
import { settingsStorage } from '../infrastructure/repository';
import type { SettingsStorage } from '../infrastructure/repository';

export class SettingsService {
  constructor(private storage: SettingsStorage = settingsStorage) {}

  // Get settings (theme comes from ThemeProvider, not storage)
  getSettings(currentTheme: Theme): Settings {
    return {
      theme: currentTheme,
      daily_new_review_count: this.storage.getDailyReviewCount(),
      notifications_enabled: this.storage.getNotificationsEnabled(),
      auto_new_review: this.storage.getAutoNewReview(),
    };
  }

  // Update daily review count
  setDailyReviewCount(count: number): void {
    this.storage.setDailyReviewCount(count);
  }

  // Update notifications enabled
  setNotificationsEnabled(enabled: boolean): void {
    this.storage.setNotificationsEnabled(enabled);
  }

  // Update auto new review policy
  setAutoNewReview(policy: AutoNewReviewPolicy): void {
    this.storage.setAutoNewReview(policy);
  }

  // Reset settings to defaults (excludes theme)
  resetSettings(): void {
    this.storage.clear();
  }

  // Notification permission handling
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }
}

export const settingsService = new SettingsService();