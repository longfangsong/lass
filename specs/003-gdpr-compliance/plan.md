
# Implementation Plan: GDPR Compliance

**Branch**: `003-gdpr-compliance` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/longfangsong/Projects/lass/specs/003-gdpr-compliance/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Implement GDPR compliance for the Läss Swedish learning platform with global coverage (all users, not just EU). The implementation includes:

1. **Privacy Policy & Consent**: Display a consent banner on first visit explaining data collection (email, learning progress) with explicit user consent required before proceeding. Users must agree to how cookies and data are processed.

2. **Settings Panel for Data Rights**: Add a privacy/data management section in the settings page enabling users to:
   - View all their personal data (email, wordbook entries, settings)
   - Export their data as JSON/CSV (immediate download)
   - Delete their account and all server-side data (immediate D1 deletion)
   - Access privacy policy and contact information

3. **Technical Approach**: 
   - Consent-based legal framework (not legitimate interest)
   - Immediate data operations (no queues or delays)
   - Server-side data only (D1 database) - IndexedDB is user-controlled
   - No audit logs required (solo project)
   - Cloudflare infrastructure provides GDPR-compliant data transfers

## Technical Context
**Language/Version**: TypeScript 5.x + React 19 + Node.js 20+  
**Primary Dependencies**: React, Vite, TailwindCSS, Dexie (IndexedDB), Cloudflare Workers  
**Storage**: Cloudflare D1 (SQLite-compatible, server-side), IndexedDB (client-side via Dexie)  
**Testing**: Vitest (unit + integration tests)  
**Target Platform**: Web (PWA) deployed on Cloudflare Pages + Workers  
**Project Type**: Web (frontend + backend API)  
**Performance Goals**: <200ms for data export, <1s for deletion, consent banner loads with page  
**Constraints**: Offline-first PWA, immediate operations (no async queues), local-first architecture  
**Scale/Scope**: Small user base, 21 functional requirements, 4 new UI components, 3 API endpoints

**User-Provided Implementation Details**:
- Add privacy/data management panel on settings page
- Users can delete/export their server data from this panel
- First-time login requires agreement on cookie usage and data processing via consent banner
- All operations should be immediate and in-app (no email-based workflows)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Local-First Architecture
- ✅ **PASS**: Privacy banner and settings UI work offline (React components)
- ✅ **PASS**: Consent state stored in IndexedDB (Dexie), syncs to D1 when online
- ✅ **PASS**: Privacy policy viewable offline (static content)
- ⚠️ **CONDITIONAL**: Data export/deletion require server connection (acceptable - user rights operations need server state)

### PWA-First Design
- ✅ **PASS**: Consent banner responsive with dark/light theme support
- ✅ **PASS**: Settings panel follows existing TailwindCSS design system
- ✅ **PASS**: Privacy policy as static page, cached by service worker

### Test-Driven Development
- ✅ **PASS**: Contract tests for data export/deletion/view APIs
- ✅ **PASS**: Integration tests for consent flow and settings panel
- ✅ **PASS**: Unit tests for data serialization (JSON/CSV export)
- ✅ **PASS**: Red-Green-Refactor: tests written before implementation

### Simplicity and Performance
- ✅ **PASS**: No complex consent management (simple boolean flag)
- ✅ **PASS**: No audit logs (not required for solo project)
- ✅ **PASS**: Direct D1 queries (no ORM or abstraction layers)
- ✅ **PASS**: Immediate operations (no queues, workers, or batch processing)

### Domain-Driven Design
- ✅ **PASS**: New bounded context: `privacy` or extend `settings` context
- ✅ **PASS**: Clear layers: domain (consent model), application (export service), infrastructure (D1 queries), presentation (UI components)
- ⚠️ **CONSIDERATION**: Could extend existing `settings` context vs new `privacy` context - will decide in Phase 0

**Initial Gate**: ✅ PASS - No constitutional violations, complexity justified

---

**POST-DESIGN CONSTITUTION CHECK** (After Phase 1)

### Local-First Architecture (Re-verified)
- ✅ **PASS**: ConsentRecord stored in IndexedDB (offline-first)
- ✅ **PASS**: Privacy policy as static content (cached by service worker)
- ✅ **PASS**: Settings panel works offline (React components)
- ✅ **PASS**: Data operations explicitly require server connection (acceptable - GDPR operations need server state)

### PWA-First Design (Re-verified)
- ✅ **PASS**: ConsentBanner uses shadcn/ui Dialog (responsive, accessible)
- ✅ **PASS**: PrivacyPanel extends Settings Accordion (consistent design)
- ✅ **PASS**: All components support dark/light theme (TailwindCSS)
- ✅ **PASS**: Mobile-responsive layouts in quickstart validation

### Test-Driven Development (Re-verified)
- ✅ **PASS**: 5 contract tests defined (privacy-api.yaml → tests)
- ✅ **PASS**: 8 integration test scenarios (quickstart.md → Story 1-8)
- ✅ **PASS**: Unit tests for validation, serialization planned
- ✅ **PASS**: Red-Green-Refactor order enforced in task planning

### Simplicity and Performance (Re-verified)
- ✅ **PASS**: Direct D1 queries (no ORM), <200ms export target
- ✅ **PASS**: Single transaction deletion (<1s target), no async queues
- ✅ **PASS**: Simple consent boolean (no complex state machine)
- ✅ **PASS**: 4 API endpoints only (minimal surface area)

### Domain-Driven Design (Re-verified)
- ✅ **DECISION**: Extend `settings` bounded context (not new `privacy` context)
  - Rationale: Privacy panel lives in Settings page, minimal domain logic
  - Structure: `src/app/settings/` with domain/application/infrastructure/presentation layers
- ✅ **PASS**: Clear separation: ConsentRecord (domain) → PrivacyService (application) → D1Queries (infrastructure) → PrivacyPanel (presentation)
- ✅ **PASS**: API routes in `src/api/privacy/` (backend bounded context)

**Post-Design Gate**: ✅ PASS - Design aligns with all constitutional principles

---

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 - Web application (frontend + backend detected)

Current Läss structure:
```
src/
├── api/                    # Cloudflare Workers API routes
│   ├── auth/              # OAuth authentication
│   ├── sync/              # Data sync endpoints
│   ├── words/             # Dictionary API
│   └── lexemes/           # Word definitions API
└── app/                   # React frontend
    ├── article/           # Bounded context: Articles
    ├── dictionary/        # Bounded context: Dictionary
    ├── settings/          # Bounded context: Settings (EXTEND)
    ├── wordbook/          # Bounded context: Wordbook
    └── shared/            # Shared components

migrations/                 # D1 database migrations
```

**GDPR Implementation Structure**:
```
src/
├── api/
│   └── settings/          
│       ├── index.ts       # Existing settings route handler
│       ├── export.ts      # NEW: GET /api/settings/export
│       └── delete.ts      # NEW: DELETE /api/settings (account deletion)
└── app/
    └── settings/          # EXTEND: Add privacy panel
        ├── domain/
        │   └── (no new domain models - UserSettings already exists)
        ├── application/
        │   └── privacyService.ts  # NEW: Export/delete logic
        ├── infrastructure/
        │   └── (reuse existing D1 queries)
        └── presentation/
            ├── PrivacyPanel.tsx   # NEW: Settings UI
            └── ConsentBanner.tsx  # NEW: First-visit banner

migrations/
└── (no new migrations - reuse existing UserSettings table)
```

## Phase 0: Outline & Research

**Status**: ✅ COMPLETE

All research completed and documented in [research.md](./research.md).

### Key Research Outcomes

1. **Consent Management**: Modal banner using shadcn/ui Dialog, IndexedDB + D1 storage
2. **Data Export**: JSON primary format, CSV optional, server-side generation from D1
3. **Data Deletion**: Single D1 transaction, cascade deletes (UserSettings, WordBookEntry, Sessions)
4. **UI Design**: Extend Settings page with Accordion section for privacy controls
5. **Storage Strategy**: IndexedDB-first (offline), D1 sync (server record)
6. **Testing Approach**: TDD with contract → integration → unit progression
7. **Performance Targets**: <200ms export, <1s deletion, indexed queries
8. **Accessibility**: WCAG AA, keyboard navigation, screen reader support

**No unresolved technical questions** - All NEEDS CLARIFICATION items resolved.

**Output**: ✅ research.md created

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

**Status**: ✅ COMPLETE

1. ✅ **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. ✅ **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. ⚠️ **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)
   - **NOTE**: Contract tests will be generated during Phase 3 task execution

4. ✅ **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. ✅ **Update agent file incrementally** (O(1) operation):
   - Updated `.github/copilot-instructions.md` with GDPR context
   - Added new tech from current plan (Privacy API, consent management)
   - Preserved manual additions between markers
   - Updated recent changes (GDPR moved to #1)
   - Kept under 177 lines for token efficiency

**Output**: 
- ✅ data-model.md (entities: UserDataExport virtual entity, deletion simplified)
- ✅ /contracts/privacy-api.yaml (3 endpoints: export, delete, view - NO consent endpoint)
- ✅ /contracts/README.md (usage guide, examples, performance targets)
- ✅ quickstart.md (8 user stories with validation steps)
- ✅ .github/copilot-instructions.md (agent context updated)

**Key Deliverables**:
1. **Data Model**: Simplified! No separate consent table - implicit via UserSettings existence
2. **API Contracts**: OpenAPI 3.0 spec with 3 endpoints (consent removed - banner-only UX)
3. **Quickstart Guide**: 8 user stories (consent banner is client-side, no API)
4. **Agent Context**: GitHub Copilot instructions updated with GDPR compliance context

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Status**: ✅ COMPLETE (Approach Described)

### Task Generation Strategy

The `/tasks` command will generate tasks from Phase 1 deliverables following TDD and DDD principles:

#### 1. Contract Test Tasks (Parallel)
From `contracts/privacy-api.yaml`:
- [P] Contract test: GET /api/settings/export (JSON)
- [P] Contract test: GET /api/settings/export (CSV)
- [P] Contract test: DELETE /api/settings (account deletion)
- [P] Contract test: GET /api/settings/data-summary

#### 2. Domain Model Tasks (Parallel)
From `data-model.md`:
- [P] Create UserDataExport interface (TypeScript types)
- [P] Validation functions for export data
- **NOTE**: No ConsentRecord or UserConsent entities - consent implicit via UserSettings!

#### 3. Infrastructure Tasks (Sequential)
- **No database migration needed!** (UserSettings already exists)
- D1 privacy queries (export, delete, view)

#### 4. Application Service Tasks
- Privacy service: export user data (JSON serialization)
- Privacy service: export user data (CSV serialization)
- Privacy service: delete user account (D1 transaction - 2 DELETE statements)
- Privacy service: view data summary

#### 5. API Endpoint Tasks (Sequential - depend on services)
- GET /api/settings/export handler (format parameter)
- DELETE /api/settings handler (confirmation validation, account deletion)
- Router integration (extend existing settings routes)

#### 6. Presentation/UI Tasks (Sequential - depend on API)
- ConsentBanner component (client-side only, no API call)
- PrivacyPanel component (Settings accordion section)
- Data export modal (format selection, download button)
- Account deletion modal (confirmation input)
- Privacy policy page (/privacy-policy route)

#### 7. Integration Test Tasks
From `quickstart.md` user stories:
- Story 1: First-time user sees consent banner
- Story 2: Authenticated user syncs consent to server
- Story 3: User views their data in settings
- Story 4: User exports data (JSON)
- Story 5: User exports data (CSV)
- Story 6: User deletes account
- Story 7: User revisits privacy policy
- Story 8: User changes consent decision

### Ordering Strategy

**Primary Order**: TDD → Domain → Infrastructure → Application → API → UI

**Parallelization**:
- All contract tests can run in parallel [P]
- All domain models independent [P]
- Infrastructure tasks sequential (database setup before queries)
- UI components parallel after API complete

**Dependencies**:
1. Contract tests → Domain models (tests drive model design)
2. Domain models → Infrastructure (models define storage requirements)
3. Infrastructure → Application services (services use storage)
4. Application services → API endpoints (endpoints call services)
5. API endpoints → UI components (UI calls API)

**Estimated Task Count**: 22-26 tasks total (reduced from 28-32 due to removed consent API/storage)

### Task Template Structure

Each task will follow TDD structure:
```
## Task N: [Description]
**Type**: [Test|Model|Service|API|UI]
**Dependencies**: [Task IDs]
**Files**: 
- tests/[type]/[feature].test.ts (create failing test)
- src/[context]/[layer]/[file].ts (implement to pass test)

**Acceptance**:
- [ ] Test fails (Red)
- [ ] Implementation passes test (Green)
- [ ] Code refactored if needed (Refactor)
- [ ] Lint passes
- [ ] TypeScript compiles
```

**IMPORTANT**: This approach will be executed by the `/tasks` command, NOT by `/plan`

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (re-evaluated after Phase 1)
- [x] All NEEDS CLARIFICATION resolved

---

**Plan Complete** ✅ - Ready for `/tasks` command
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
