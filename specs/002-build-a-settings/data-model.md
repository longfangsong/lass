# Data Model: Settings Page

## Core Entities

### UserSettings (Extended)
Extends existing UserSettings interface to include new configuration options.

```typescript
interface UserSettings {
  // Existing fields
  auto_new_review: AutoNewReviewPolicy;
  daily_new_review_count: number;
  update_time: number;
  
  // New fields for settings page
  theme: Theme;
  notifications_enabled: boolean;
  notification_permission_status: NotificationPermissionStatus;
}

enum Theme {
  Light = "light",
  Dark = "dark", 
  System = "system"
}

enum NotificationPermissionStatus {
  Default = "default",
  Granted = "granted",
  Denied = "denied",
  Unsupported = "unsupported"
}
```

**Validation Rules**:
- `daily_new_review_count`: Must be positive integer, max 100
- `theme`: Must be one of Theme enum values
- `notifications_enabled`: Boolean, but only meaningful if permission granted
- `notification_permission_status`: Read-only, reflects browser permission state

**State Transitions**:
```
notifications_enabled: false → true
  ↓
If permission_status === "default":
  → Request browser permission
  → Update permission_status based on response
  
If permission_status === "denied":
  → Show permission help message
  → Keep notifications_enabled as false

If permission_status === "granted":
  → Enable notifications
  → Keep notifications_enabled as true
```

### SettingsFormData
Temporary form state for user input validation before persisting to UserSettings.

```typescript
interface SettingsFormData {
  theme: Theme;
  daily_new_review_count: number;
  notifications_enabled: boolean;
}
```

**Validation Schema** (Zod):
```typescript
const settingsFormSchema = z.object({
  theme: z.nativeEnum(Theme),
  daily_new_review_count: z.number()
    .min(1, "Must be at least 1")
    .max(100, "Must be 100 or less")
    .int("Must be a whole number"),
  notifications_enabled: z.boolean()
});
```

## Data Flow

### Settings Load Flow
```
1. Component mounts
2. useSettings hook called
3. SettingsService.getSettings()
4. LocalStorageRepository.load()
5. Parse JSON from localStorage["user-settings"]
6. Validate against UserSettings schema
7. Return settings or defaults if invalid/missing
```

### Settings Save Flow
```
1. User submits form
2. Form validation (client-side with Zod)
3. SettingsService.updateSettings(formData)
4. If notifications_enabled changed to true:
   → Check permission status
   → Request permission if needed
   → Update permission_status
5. Merge form data with existing settings
6. LocalStorageRepository.save(updatedSettings)
7. Stringify and store in localStorage["user-settings"]
8. Emit settings change event for reactive updates
```

### Theme Integration Flow
```
1. Settings page loads current theme from useTheme()
2. User changes theme in settings form
3. Form calls existing setTheme() from ThemeProvider
4. Theme immediately applied to DOM
5. Settings save persists theme to localStorage["user-settings"]
6. ThemeProvider continues using localStorage["vite-ui-theme"]
7. Both storage keys kept in sync
```

## Storage Strategy

### localStorage Structure
```typescript
// Key: "user-settings"
{
  "auto_new_review": 2,
  "daily_new_review_count": 20,
  "theme": "dark",
  "notifications_enabled": true,
  "notification_permission_status": "granted",
  "update_time": 1696723200000
}

// Key: "vite-ui-theme" (existing, maintained by ThemeProvider)
"dark"
```

**Migration Strategy**:
- Existing UserSettings without new fields: Apply defaults
- Invalid data: Reset to defaults with warning
- Version field for future schema changes

### Relationships

```
UserSettings ←→ ThemeProvider
  │              (theme sync)
  │
  ├─ Daily Review System
  │    (daily_new_review_count)
  │
  └─ Notification System
       (notifications_enabled + permission_status)
```

## Error Handling

### Validation Errors
- **Client-side**: Zod schema validation with user-friendly messages
- **Type errors**: TypeScript compile-time checking
- **Range errors**: Numeric bounds validation

### Storage Errors
- **localStorage unavailable**: Graceful degradation, settings not persistent
- **Storage quota exceeded**: Clear old data, show warning
- **JSON parse errors**: Reset to defaults, log error

### Permission Errors
- **Notifications unsupported**: Disable notification options, show explanation
- **Permission denied**: Show help text for enabling in browser settings
- **Permission request failed**: Retry mechanism with user feedback

## Performance Characteristics

- **Load time**: <10ms (synchronous localStorage read)
- **Save time**: <5ms (synchronous localStorage write)
- **Memory usage**: <1KB per settings object
- **Storage size**: <1KB in localStorage
- **Validation time**: <1ms (Zod schema validation)

## Integration Points

### Existing Systems
- **ThemeProvider**: Bidirectional theme synchronization
- **Review System**: Respects daily_new_review_count setting
- **PWA**: Uses notification_permission_status for PWA features

### New Components
- **SettingsPage**: Main settings UI
- **SettingsForm**: Form component with validation
- **useSettings**: Hook for settings state management
- **SettingsService**: Business logic layer
- **LocalStorageRepository**: Persistence implementation