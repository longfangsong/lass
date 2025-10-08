# Settings Service Interface Contract

## ISettingsRepository

Interface for persisting and retrieving user settings from local storage.

```typescript
interface ISettingsRepository {
  /**
   * Load user settings from storage
   * @returns Promise<UserSettings> - Current settings or defaults if not found
   * @throws SettingsStorageError if storage is unavailable
   */
  load(): Promise<UserSettings>;
  
  /**
   * Save user settings to storage
   * @param settings - Settings object to persist
   * @returns Promise<void>
   * @throws SettingsStorageError if save fails or quota exceeded
   */
  save(settings: UserSettings): Promise<void>;
  
  /**
   * Check if storage is available
   * @returns boolean - true if storage operations will work
   */
  isAvailable(): boolean;
  
  /**
   * Clear all settings (reset to defaults)
   * @returns Promise<void>
   */
  clear(): Promise<void>;
}
```

## ISettingsService  

Business logic interface for settings management.

```typescript
interface ISettingsService {
  /**
   * Get current user settings
   * @returns Promise<UserSettings> - Current settings with defaults applied
   */
  getSettings(): Promise<UserSettings>;
  
  /**
   * Update user settings with validation
   * @param updates - Partial settings to update
   * @returns Promise<UserSettings> - Updated settings after validation
   * @throws SettingsValidationError if updates are invalid
   */
  updateSettings(updates: Partial<UserSettings>): Promise<UserSettings>;
  
  /**
   * Request notification permission from browser
   * @returns Promise<NotificationPermissionStatus> - Permission result
   */
  requestNotificationPermission(): Promise<NotificationPermissionStatus>;
  
  /**
   * Get current notification permission status
   * @returns NotificationPermissionStatus - Current browser permission
   */
  getNotificationPermissionStatus(): NotificationPermissionStatus;
  
  /**
   * Reset settings to defaults
   * @returns Promise<UserSettings> - Default settings
   */
  resetToDefaults(): Promise<UserSettings>;
}
```

## Settings Form Contract

Props interface for the settings form component.

```typescript
interface SettingsFormProps {
  /**
   * Initial settings values
   */
  initialSettings: UserSettings;
  
  /**
   * Callback when settings are successfully saved
   * @param settings - The saved settings
   */
  onSettingsSaved: (settings: UserSettings) => void;
  
  /**
   * Callback when form encounters an error
   * @param error - Error details
   */
  onError: (error: SettingsError) => void;
  
  /**
   * Optional loading state override
   */
  isLoading?: boolean;
  
  /**
   * Optional disabled state (e.g., during save)
   */
  disabled?: boolean;
}
```

## Settings Hook Contract

React hook interface for settings state management.

```typescript
interface UseSettingsReturn {
  /**
   * Current settings state
   */
  settings: UserSettings | null;
  
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Error state
   */
  error: SettingsError | null;
  
  /**
   * Update settings function
   * @param updates - Partial settings to update
   */
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  
  /**
   * Request notification permission
   */
  requestNotificationPermission: () => Promise<NotificationPermissionStatus>;
  
  /**
   * Reset to defaults
   */
  resetToDefaults: () => Promise<void>;
  
  /**
   * Refresh settings from storage
   */
  refresh: () => Promise<void>;
}
```

## Error Types Contract

Error classes for settings operations.

```typescript
class SettingsError extends Error {
  code: string;
  context?: Record<string, any>;
}

class SettingsStorageError extends SettingsError {
  code: 'STORAGE_UNAVAILABLE' | 'QUOTA_EXCEEDED' | 'PARSE_ERROR';
}

class SettingsValidationError extends SettingsError {
  code: 'INVALID_THEME' | 'INVALID_REVIEW_COUNT' | 'INVALID_FORMAT';
  field: string;
  value: any;
}

class NotificationPermissionError extends SettingsError {
  code: 'PERMISSION_DENIED' | 'NOT_SUPPORTED' | 'REQUEST_FAILED';
  permissionStatus: NotificationPermissionStatus;
}
```

## Integration Contracts

### Theme Integration

```typescript
interface ThemeIntegration {
  /**
   * Get current theme from existing theme system
   */
  getCurrentTheme(): Theme;
  
  /**
   * Set theme using existing theme system
   * @param theme - Theme to apply
   */
  setTheme(theme: Theme): void;
  
  /**
   * Subscribe to theme changes from external sources
   * @param callback - Called when theme changes
   * @returns unsubscribe function
   */
  onThemeChange(callback: (theme: Theme) => void): () => void;
}
```

### Review System Integration

```typescript
interface ReviewSystemIntegration {
  /**
   * Update daily review limit in review system
   * @param limit - New daily limit
   */
  updateDailyReviewLimit(limit: number): void;
  
  /**
   * Get current daily review count for validation
   */
  getCurrentDailyReviewCount(): number;
}
```

## Contract Tests

Each interface requires contract tests to verify implementation compliance:

### Repository Contract Tests
- `load()` returns valid UserSettings object
- `save()` persists data correctly
- `isAvailable()` accurately reflects storage state
- Error handling for unavailable storage

### Service Contract Tests  
- `getSettings()` returns valid settings with defaults
- `updateSettings()` validates input and persists changes
- Notification permission flow works correctly
- Error propagation maintains contract

### Component Contract Tests
- Form renders with initial values
- Callbacks fire with correct data
- Error states display appropriately
- Loading and disabled states work

### Hook Contract Tests
- Returns correct shape of data
- State updates trigger re-renders
- Async operations handle loading states
- Error states are captured and returned