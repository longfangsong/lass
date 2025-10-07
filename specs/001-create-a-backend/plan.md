
# Implementation Plan: DeepL Free API Integration for Active Review

**Branch**: `001-create-a-backend` | **Date**: 7 oktober 2025 | **Spec**: [specs/001-create-a-backend/spec.md](./spec.md)
**Inpu**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)specification from `/specs/001-create-a-backend/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully from /specs/001-create-a-backend/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected Web application (existing React frontend + Cloudflare Workers backend) 
   → Set Structure Decision to Option 2: Web application (extends existing architecture)
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → All constitutional requirements aligned with existing architecture
   → Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → All technical details clarified from existing codebase and DeepL documentation
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, .github/copilot-instructions.md
7. Re-evaluate Constitution Check section
   → No new violations detected, design follows existing patterns
   → Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Add DeepL Free API integration to the existing `/api` endpoint to automatically translate Swedish `example` text to English `example_meaning` when the `example_meaning` field is missing in Lexeme records. This enhances the existing data by filling gaps in English translations, improving the active review experience for Swedish language learners.

## Technical Context
**Language/Version**: TypeScript (Node.js 20+) for backend, React 19 + TypeScript for frontend  
**Primary Dependencies**: DeepL API SDK, Cloudflare Workers, React, Dexie (IndexedDB)  
**Storage**: Cloudflare D1 (SQLite-compatible) with IndexedDB sync via Dexie  
**Testing**: Vitest for all tests (unit, integration, contract)  
**Target Platform**: Cloudflare Workers (serverless backend), PWA (frontend)
**Project Type**: Web application - extends existing React frontend + Cloudflare Workers backend  
**Performance Goals**: <5 seconds translation response time, <500ms cached response time  
**Constraints**: DeepL Free API 500,000 characters/month limit, offline-first architecture, PWA compatibility  
**Scale/Scope**: Support for existing user base, ~1000 translations/month estimated, integration with 100k+ dictionary entries

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Local-First Architecture ✅
- **Compliant**: No offline functionality impact, API enhances existing data
- **Data Quality**: Improves existing Lexeme records without changing core architecture

### PWA-First Design ✅
- **Compliant**: Feature enhances existing PWA, no impact on offline core functionality
- **Responsive**: Backend API only, frontend uses existing responsive UI components

### Test-Driven Development (NON-NEGOTIABLE) ✅
- **Compliant**: All code changes will include Vitest tests
- **Coverage**: API contract tests, translation service tests, database interaction tests
- **Integration**: End-to-end tests for active review with translation flow

### Simplicity and Performance ✅
- **Compliant**: Simple API endpoints that update existing database fields
- **YAGNI**: Only translates when explicitly requested, updates existing data structure
- **Performance**: Leverages existing D1 database, no additional caching complexity

### Domain-Driven Design & Bounded Contexts ✅
- **Compliant**: Pure API enhancement, does not modify existing bounded contexts
- **Layers**: Infrastructure (DeepL API integration), API (translation endpoints)
- **Separation**: Clean translation service that updates existing Lexeme data without touching wordbook logic

**Constitutional Compliance**: PASS - No violations detected

## Project Structure

### Documentation (this feature)
```
specs/001-create-a-backend/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (existing structure extended)
src/
├── api/                           # Existing Cloudflare Workers API
│   ├── translate/                 # NEW: Translation service
│   │   └── index.ts              # NEW: Translation functions
│   ├── lexemes/
│   │   └── index.ts              # UPDATED: Add translation logic
│   └── router.ts                 # UPDATED: Add translation endpoint
└── types/
    └── index.ts                  # UPDATED: Add translation types
```

**Structure Decision**: Extend existing API structure - add translation capability to existing lexeme endpoints, no database changes needed

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Enhanced Lexeme: Use existing table, populate missing example_meaning fields
   - TranslationRequest: Runtime entity for API requests (not persisted)
   - UsageTracking: Simple in-memory quota management

2. **Generate API contracts** from functional requirements:
   - PATCH /api/lexemes/{lexeme_id}?fill_example_meaning=1 - Fill missing meaning for one lexeme
   - GET /api/translate/usage - Get current usage statistics
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Lexeme update tests (fill missing example_meaning fields)
   - Usage tracking tests (quota management without persistence)
   - Integration tests with existing lexeme endpoints

4. **Extract test scenarios** from user stories:
   - Lexeme with missing example meaning → API fills it
   - Usage tracking → prevents API overuse
   - Graceful degradation → works when DeepL API fails

5. **Update .github/copilot-instructions.md incrementally**:
   - Add DeepL API integration context
   - Document simplified translation approach
   - Update recent changes with this feature

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- No database migration needed (uses existing Lexeme table)
- Each API endpoint → contract test task [P]
- Translation service implementation → service task [P]
- Integration with existing lexeme endpoints → integration task
- Simple usage tracking → monitoring task [P]

**Ordering Strategy**:
- TDD order: Contract tests before API implementation
- Dependency order: Translation Service → API Endpoints → Integration  
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 8-10 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

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
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
