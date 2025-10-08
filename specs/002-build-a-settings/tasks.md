# Tasks: Settings Page

**Input**: Design documents from `/specs/002-build-a-settings/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, React 19, Vite, Radix UI, TailwindCSS, Jotai
   → Structure: Web application extending existing src/app/ DDD structure
2. Load design documents:
   → data-model.md: UserSettings entity, SettingsFormData, validation schemas
   → contracts/: ISettingsRepository, ISettingsService, component interfaces
   → quickstart.md: 8 test scenarios for validation
3. Generate tasks by category:
   → Setup: Dependencies, type definitions, route configuration
   → Tests: Contract tests, integration tests (TDD)
   → Core: Domain models, services, repository implementation
   → Integration: Theme system, notification system, form validation
   → Polish: Unit tests, accessibility, performance validation
4. Task rules applied:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Tasks numbered T001-T022
6. Dependencies: Setup → Tests → Core → Integration → Polish
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: Extends existing `src/app/` structure
- **Tests**: `src/app/settings/` with `.test.ts` files
- Paths based on existing Cloudflare Workers + React architecture

## Phase 3.1: Setup
- [ ] T001 Create settings module structure at src/app/settings/ with domain/application/infrastructure/presentation folders
- [ ] T002 [P] Extend UserSettings interface in src/types/database.ts with theme, notifications_enabled, and notification_permission_status fields
- [ ] T003 [P] Add settings route to src/app/shared/presentation/App.tsx React Router configuration

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Settings repository contract tests in src/app/settings/infrastructure/localStorageRepository.test.ts
- [ ] T005 [P] Settings service contract tests in src/app/settings/application/settingsService.test.ts
- [ ] T006 [P] Settings form component tests in src/app/settings/presentation/components/settingsForm.test.tsx
- [ ] T007 [P] useSettings hook tests in src/app/settings/presentation/hooks/useSettings.test.ts
- [ ] T008 [P] Settings page integration tests in src/app/settings/presentation/pages/settingsPage.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 [P] Settings domain model with validation schemas in src/app/settings/domain/model.ts
- [ ] T010 [P] Theme and NotificationPermissionStatus enums in src/app/settings/domain/model.ts  
- [ ] T011 [P] SettingsFormData interface and Zod validation schema in src/app/settings/domain/model.ts
- [ ] T012 LocalStorageRepository implementation in src/app/settings/infrastructure/localStorageRepository.ts
- [ ] T013 SettingsService business logic implementation in src/app/settings/application/settingsService.ts
- [ ] T014 useSettings custom hook implementation in src/app/settings/presentation/hooks/useSettings.ts

## Phase 3.4: Integration
- [ ] T015 SettingsForm component with React Hook Form and Radix UI in src/app/settings/presentation/components/settingsForm.tsx
- [ ] T016 SettingsPage component with navigation and form integration in src/app/settings/presentation/pages/settingsPage.tsx
- [ ] T017 Theme integration with existing ThemeProvider in settings form component
- [ ] T018 Notification permission handling with PWA Notifications API in settings service
- [ ] T019 Form validation error handling and user feedback in settings form component

## Phase 3.5: Polish
- [ ] T020 [P] Settings navigation link in src/app/shared/presentation/components/navBar.tsx
- [ ] T021 [P] Unit tests for validation edge cases in src/app/settings/domain/model.test.ts
- [ ] T022 [P] End-to-end validation using quickstart.md scenarios

## Dependencies
- Tests (T004-T008) before implementation (T009-T019)
- T009-T011 (domain models) before T012-T013 (services)
- T012-T013 (services) before T014-T016 (components)
- T014-T016 (core components) before T017-T019 (integration)
- Implementation before polish (T020-T022)

## Parallel Example
```bash
# Launch T004-T008 together (contract tests):
Task: "Settings repository contract tests in src/app/settings/infrastructure/localStorageRepository.test.ts"
Task: "Settings service contract tests in src/app/settings/application/settingsService.test.ts"  
Task: "Settings form component tests in src/app/settings/presentation/components/settingsForm.test.tsx"
Task: "useSettings hook tests in src/app/settings/presentation/hooks/useSettings.test.ts"
Task: "Settings page integration tests in src/app/settings/presentation/pages/settingsPage.test.tsx"

# Launch T009-T011 together (domain models):
Task: "Settings domain model with validation schemas in src/app/settings/domain/model.ts"
Task: "Theme and NotificationPermissionStatus enums in src/app/settings/domain/model.ts"
Task: "SettingsFormData interface and Zod validation schema in src/app/settings/domain/model.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Follow existing DDD structure in src/app/ directory
- Integrate with existing ThemeProvider and UserSettings patterns
- Use React Hook Form + Zod for form validation
- Verify tests fail before implementing
- Commit after each task completion

## Task Generation Rules Applied

1. **From Contracts**:
   - ISettingsRepository → contract test T004
   - ISettingsService → contract test T005  
   - SettingsForm props → component test T006
   - UseSettingsReturn → hook test T007

2. **From Data Model**:
   - UserSettings extension → T002 type definition
   - SettingsFormData → T011 model creation
   - Validation schemas → T009 domain implementation

3. **From Quickstart Scenarios**:
   - 8 test scenarios → integration tests T008, T022
   - Navigation scenario → T003 route setup, T020 nav link
   - Theme scenario → T017 theme integration
   - Notification scenario → T018 permission handling

4. **Ordering**:
   - Setup (T001-T003) → Tests (T004-T008) → Models (T009-T011) → Services (T012-T014) → Components (T015-T016) → Integration (T017-T019) → Polish (T020-T022)

## Validation Checklist

- [x] All contracts have corresponding tests (T004-T007)
- [x] All entities have model tasks (T009-T011)
- [x] All tests come before implementation (T004-T008 before T009-T019)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration with existing systems (ThemeProvider, UserSettings, navigation)
- [x] PWA compliance (notifications, localStorage, offline-first)