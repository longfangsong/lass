import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/app/shared/presentation/components/themeProvider';
import type { Settings } from '../../domain/model';
import { AutoNewReviewPolicy } from '@/types/database';
import { settingsService } from '../../application/settingsService';
import type { SettingsService } from '../../application/settingsService';


// Hook for managing settings (integrates with ThemeProvider)
export function useSettings(service: SettingsService = settingsService) {
  const { theme } = useTheme(); // Get theme from ThemeProvider
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    try {
      const currentSettings = service.getSettings(theme);
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }, [service, theme]);

  const updateDailyReviewCount = useCallback((count: number) => {
    try {
      service.setDailyReviewCount(count);
      setSettings(prev => prev ? { ...prev, daily_new_review_count: count } : null);
    } catch (error) {
      console.error('Failed to update daily review count:', error);
      throw error;
    }
  }, [service]);

  const updateNotificationsEnabled = useCallback((enabled: boolean) => {
    try {
      service.setNotificationsEnabled(enabled);
      setSettings(prev => prev ? { ...prev, notifications_enabled: enabled } : null);
    } catch (error) {
      console.error('Failed to update notifications enabled:', error);
      throw error;
    }
  }, [service]);

  const updateAutoNewReview = useCallback((policy: AutoNewReviewPolicy) => {
    try {
      service.setAutoNewReview(policy);
      setSettings(prev => prev ? { ...prev, auto_new_review: policy } : null);
    } catch (error) {
      console.error('Failed to update auto new review policy:', error);
      throw error;
    }
  }, [service]);

  const resetSettings = useCallback(() => {
    try {
      service.resetSettings();
      loadSettings(); // Reload to get defaults
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }, [service, loadSettings]);

  // Load settings on mount and when theme changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    updateDailyReviewCount,
    updateNotificationsEnabled,
    updateAutoNewReview,
    resetSettings,
    reload: loadSettings,
  };
}

// Hook for notification permissions
export function useNotificationPermission(service: SettingsService = settingsService) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [requesting, setRequesting] = useState(false);

  const checkPermission = useCallback(() => {
    const currentPermission = service.getNotificationPermission();
    setPermission(currentPermission);
  }, [service]);

  const requestPermission = useCallback(async () => {
    try {
      setRequesting(true);
      const granted = await service.requestNotificationPermission();
      checkPermission(); // Refresh permission status
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    } finally {
      setRequesting(false);
    }
  }, [service, checkPermission]);

  // Check permission on mount and when page becomes visible
  useEffect(() => {
    checkPermission();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkPermission]);

  return {
    permission,
    requesting,
    requestPermission,
    checkPermission,
    isSupported: service.isNotificationSupported()
  };
}