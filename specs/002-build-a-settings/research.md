# Research: Settings Page Implementation

## Research Questions

### 1. Local Storage Strategy for User Settings

**Decision**: Extend existing localStorage pattern with typed settings interface

**Rationale**: 
- Läss already uses localStorage for theme preferences in ThemeProvider
- Constitution requires local-first architecture
- No cross-device sync needed per requirements (FR-015)
- Browser localStorage provides 5-10MB capacity, sufficient for settings

**Alternatives considered**:
- IndexedDB: Rejected as overkill for simple key-value settings
- Backend sync: Explicitly rejected per FR-015 requirement
- SessionStorage: Rejected as settings need to persist across sessions

**Implementation pattern**:
```typescript
// Extend existing UserSettings interface
interface UserSettings {
  auto_new_review: AutoNewReviewPolicy;
  daily_new_review_count: number;
  theme: Theme; // NEW
  notifications_enabled: boolean; // NEW
  update_time: number;
}
```

### 2. PWA Notifications API Integration

**Decision**: Use standard Web Notifications API with permission handling

**Rationale**:
- Läss is already a PWA with service worker support
- Web Notifications API provides cross-browser compatibility
- Supports offline notification scheduling via service worker
- Integrates with existing PWA manifest

**Alternatives considered**:
- Push API: Rejected as no server component needed for local reminders
- Custom in-app notifications: Rejected as user wants system-level notifications
- Third-party services: Against constitution's simplicity principle

**Permission flow**:
1. User enables notifications in settings
2. Request Notification.requestPermission()
3. Store permission status in settings
4. Show appropriate UI feedback

### 3. Theme Integration with Existing System

**Decision**: Extend existing ThemeProvider component, no changes to core theme logic

**Rationale**:
- Existing theme system in ThemeProvider already supports light/dark/system
- Uses localStorage with key "vite-ui-theme"
- ModeToggle component already exists for theme switching
- Settings page will provide alternative UI to existing theme toggle

**Alternatives considered**:
- Replace ModeToggle: Rejected to maintain existing UX
- Duplicate theme logic: Rejected to avoid code duplication
- Create new theme system: Rejected as existing system works well

**Integration approach**:
- Settings page imports and uses existing useTheme hook
- No changes to ThemeProvider or theme storage mechanism
- Settings UI provides dropdown instead of button toggle

### 4. Form Validation and Error Handling

**Decision**: Use React Hook Form with Zod validation schema

**Rationale**:
- Läss project uses TypeScript extensively for type safety
- Zod provides runtime validation matching TypeScript types
- React Hook Form handles form state efficiently
- Follows existing patterns in the codebase for form handling

**Alternatives considered**:
- Built-in HTML5 validation: Rejected for limited error messaging
- Custom validation: Rejected to avoid reinventing validation logic
- Formik: Rejected as React Hook Form is more performant

**Validation rules**:
- Daily review count: positive integer, max 100 (reasonable limit)
- Theme: enum validation (light/dark/system)
- Notifications: boolean with browser support check

### 5. Component Architecture and Testing Strategy

**Decision**: Follow existing DDD structure with comprehensive testing

**Rationale**:
- Constitution mandates DDD principles and TDD approach
- Existing codebase has clear domain/application/infrastructure/presentation separation
- Vitest and React Testing Library already configured
- Component tests ensure UI behavior, integration tests verify localStorage

**Architecture approach**:
```
src/app/settings/
├── domain/
│   ├── model.ts          # Settings types and validation
│   └── repository.ts     # Settings persistence interface
├── application/
│   └── settingsService.ts # Business logic for settings management
├── infrastructure/
│   └── localStorageRepository.ts # localStorage implementation
└── presentation/
    ├── pages/
    │   └── settingsPage.tsx
    ├── components/
    │   └── settingsForm.tsx
    └── hooks/
        └── useSettings.ts
```

**Testing strategy**:
- Unit tests: Settings domain model validation
- Component tests: Form interactions and UI state
- Integration tests: localStorage persistence and theme integration
- E2E tests: User workflow from navigation to settings save

## Implementation Dependencies

### Existing Libraries (Confirmed Available)
- **React Router**: Navigation to settings page ✅
- **Radix UI**: Form components (Select, Switch, Button) ✅
- **TailwindCSS**: Styling and responsive design ✅
- **React Hook Form**: Form state management ✅
- **Zod**: Schema validation ✅
- **Vitest**: Testing framework ✅
- **React Testing Library**: Component testing ✅

### Browser APIs
- **Web Notifications API**: For review reminders ✅
- **localStorage**: Settings persistence ✅
- **matchMedia**: System theme detection (existing) ✅

### Integration Points
- **ThemeProvider**: Existing theme system ✅
- **useTheme**: Existing theme hook ✅
- **UserSettings**: Existing settings interface (to extend) ✅
- **Review system**: Integration for daily limits ✅

## Risk Assessment

### Low Risk
- Theme integration: Existing system is stable and well-tested
- localStorage usage: Simple key-value operations
- Form validation: Standard patterns with proven libraries

### Medium Risk
- Notification permissions: Browser differences in permission UI
- Settings persistence: Need careful migration if changing localStorage format

### Mitigation Strategies
- Progressive enhancement: Settings work without notifications if not supported
- Graceful degradation: Fallback UI states for permission denied
- Backward compatibility: Version settings data structure for future migrations

## Performance Considerations

- **Settings load**: <10ms from localStorage
- **Settings save**: <5ms to localStorage, atomic operations
- **Theme switching**: Immediate DOM class changes (existing system)
- **Validation**: Client-side only, no network requests
- **Bundle size**: Minimal impact, reusing existing components

## Conclusion

All technical decisions align with constitutional principles and leverage existing infrastructure. No new dependencies required beyond those already available in the project. Implementation can proceed with high confidence using established patterns.