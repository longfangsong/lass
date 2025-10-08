import { useTheme } from '@/app/shared/presentation/components/themeProvider';
import { toast } from 'sonner';
import type { Settings, Theme } from '../../domain/model';
import { AutoNewReviewPolicy } from '@/types/database';
import { useSettings, useNotificationPermission } from '../hooks/useSettings';
import { throttle } from '@/utils';

interface SettingsFormProps {
  onSave?: (settings: Settings) => void;
  className?: string;
}

export function SettingsForm({ onSave, className }: SettingsFormProps) {
  const { settings, loading, updateDailyReviewCount, updateNotificationsEnabled, updateAutoNewReview } = useSettings();
  const { theme, setTheme } = useTheme();
  const { permission, requesting, requestPermission, isSupported } = useNotificationPermission();

  // Create throttled handlers directly
  const handleThemeChange = throttle((newTheme: Theme) => {
    try {
      setTheme(newTheme);
      onSave?.({ ...settings!, theme: newTheme });
    } catch {
      toast.error('Failed to update theme');
    }
  }, 300);

  const handleDailyReviewCountChange = throttle((count: number) => {
    if (count >= 1 && count <= 100) {
      try {
        updateDailyReviewCount(count);
        onSave?.({ ...settings!, daily_new_review_count: count });
      } catch {
        toast.error('Failed to update daily review count');
      }
    } else {
      toast.error(`Invalid daily review count: ${count}. Must be between 1 and 100.`);
    }
  }, 500);

  const handleNotificationsToggle = throttle(async (enabled: boolean) => {
    try {
      if (enabled && permission !== 'granted' && isSupported) {
        // Request permission before enabling notifications
        const granted = await requestPermission();
        if (!granted) {
          // User denied permission, show helpful message
          toast.error('Notification permission denied. Please enable notifications in your browser settings.');
          return;
        }
      }
      
      updateNotificationsEnabled(enabled);
      onSave?.({ ...settings!, notifications_enabled: enabled });
    } catch {
      toast.error('Failed to update notification settings');
      // On error, don't change the toggle state
    }
  }, 300);

  const handleAutoNewReviewChange = throttle((policy: AutoNewReviewPolicy) => {
    try {
      updateAutoNewReview(policy);
      onSave?.({ ...settings!, auto_new_review: policy });
    } catch {
      toast.error('Failed to update auto new review policy');
    }
  }, 300);

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  // Available theme options
  const themeOptions: Theme[] = ["light", "dark", "system"];

  // Auto new review policy options with labels
  const autoNewReviewOptions = [
    { value: AutoNewReviewPolicy.No, label: "Disabled", description: "No automatic new reviews" },
    { value: AutoNewReviewPolicy.Random, label: "Random", description: "Random words from your wordbook" },
    { value: AutoNewReviewPolicy.MostFrequent, label: "Most Frequent", description: "Most common words first" },
    { value: AutoNewReviewPolicy.FirstCome, label: "First Added", description: "Words added first" },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Theme Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Theme
        </label>
        <div className="flex gap-2">
          {themeOptions.map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => handleThemeChange(themeOption)}
              className={`
                px-3 py-2 text-sm rounded-md border transition-colors
                ${theme === themeOption
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-input'
                }
              `}
            >
              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Review Count */}
      <div className="space-y-3">
        <label 
          htmlFor="daily-review-count"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Daily New Review Count
        </label>
        <div className="flex items-center gap-3">
          <input
            id="daily-review-count"
            type="number"
            min="1"
            max="100"
            value={settings.daily_new_review_count}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                handleDailyReviewCountChange(value);
              }
            }}
            className="
              flex h-9 w-20 rounded-md border border-input bg-background 
              px-3 py-1 text-sm shadow-sm transition-colors 
              file:border-0 file:bg-transparent file:text-sm file:font-medium 
              placeholder:text-muted-foreground 
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
              disabled:cursor-not-allowed disabled:opacity-50
            "
          />
          <span className="text-sm text-muted-foreground">
            words per day (1-100)
          </span>
        </div>
      </div>

      {/* Auto New Review Policy */}
      <div className="space-y-3">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Auto New Review Policy
        </label>
        <div className="space-y-2">
          {autoNewReviewOptions.map((option) => (
            <label key={option.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="auto-new-review"
                value={option.value}
                checked={settings.auto_new_review === option.value}
                onChange={() => handleAutoNewReviewChange(option.value)}
                className="mt-1 h-4 w-4 text-primary border-2 border-input focus:ring-2 focus:ring-ring"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Review Notifications
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNotificationsToggle(!settings.notifications_enabled)}
            disabled={requesting || (!isSupported && !settings.notifications_enabled)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent 
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
              focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed 
              disabled:opacity-50
              ${settings.notifications_enabled 
                ? 'bg-primary' 
                : 'bg-input'
              }
            `}
          >
            <span className="sr-only">
              {settings.notifications_enabled ? 'Disable' : 'Enable'} notifications
            </span>
            <span
              className={`
                ${settings.notifications_enabled ? 'translate-x-6' : 'translate-x-1'}
                inline-block h-4 w-4 transform rounded-full bg-background transition
              `}
            />
          </button>
          
          <div className="flex flex-col">
            <span className="text-sm">
              {settings.notifications_enabled ? 'Enabled' : 'Disabled'}
            </span>
            {!isSupported && (
              <span className="text-xs text-muted-foreground">
                Notifications not supported in this browser
              </span>
            )}
            {isSupported && permission === 'denied' && (
              <span className="text-xs text-destructive">
                Notification permission denied. Enable in browser settings.
              </span>
            )}
            {requesting && (
              <span className="text-xs text-muted-foreground">
                Requesting permission...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}