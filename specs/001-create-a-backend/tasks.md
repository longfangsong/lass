# Tasks: DeepL Free API Integration for Active Review

**Input**: Design documents from `/specs/001-create-a-backend/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, Cloudflare Workers, Vitest, DeepL API
   → Structure: Web application extending existing API
2. Load design documents:
   → data-model.md: TranslationRequest entity, enhanced Lexeme table
   → contracts/: PATCH /lexemes/{lexeme_id}, GET /translate/usage
   → quickstart.md: 5 test scenarios for validation
3. Generate tasks by category:
   → Setup: Dependencies, environment configuration
   → Tests: Contract tests, integration tests (TDD)
   → Core: Translation service, API endpoints
   → Integration: Error handling, usage tracking
   → Polish: Unit tests, performance validation
4. Task rules applied:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Tasks numbered T001-T020
6. Dependencies: Setup → Tests → Core → Integration → Polish
7. Parallel execution examples provided
8. Validation: All contracts tested, all scenarios covered
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: Extends existing `src/api/` structure
- **Tests**: `src/api/translate/`, `src/api/lexemes/` with `.test.ts` files
- Paths based on existing Cloudflare Workers architecture

## Phase 3.1: Setup
- [ ] T001 Install DeepL API SDK dependency in package.json
- [ ] T002 [P] Add DEEPL_API_KEY to .dev.vars.example and wrangler.toml environment configuration
- [ ] T003 [P] Update worker-configuration.d.ts with DEEPL_API_KEY type definition

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test PATCH /lexemes/{lexeme_id}?fill_example_meaning=1 in src/api/lexemes/update.test.ts
- [ ] T005 [P] Contract test GET /translate/usage in src/api/translate/usage.test.ts
- [ ] T006 [P] Integration test: Fill missing example meaning scenario in src/api/translate/integration.test.ts
- [ ] T007 [P] Integration test: API failure graceful degradation in src/api/translate/graceful-degradation.test.ts
- [ ] T008 [P] Integration test: Quota management tracking in src/api/translate/quota.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 [P] DeepL API client in src/api/translate/client.ts
- [ ] T010 [P] Translation service with error handling in src/api/translate/service.ts
- [ ] T011 [P] Usage tracking service in src/api/translate/usage.ts
- [ ] T012 PATCH /lexemes/{lexeme_id} endpoint implementation in src/api/lexemes/update.ts
- [ ] T013 GET /translate/usage endpoint in src/api/translate/index.ts
- [ ] T014 Update src/api/router.ts to register new PATCH /lexemes/:lexeme_id route
- [ ] T015 Add TypeScript interfaces for translation in src/types/index.ts

## Phase 3.4: Integration
- [ ] T016 Error handling and logging for DeepL API failures in src/api/translate/service.ts
- [ ] T017 Input validation for lexeme updates in src/api/lexemes/update.ts
- [ ] T018 Database integration for lexeme updates in src/api/lexemes/update.ts
- [ ] T019 Environment variable validation and startup checks in src/api/translate/client.ts

## Phase 3.5: Polish
- [ ] T020 [P] Unit tests for translation service edge cases in src/api/translate/service.test.ts
- [ ] T021 [P] Performance validation: <5s translation response time
- [ ] T022 [P] Update README.md with DeepL API setup instructions
- [ ] T023 Run quickstart.md validation scenarios
- [ ] T024 Code review and cleanup: remove duplication, improve error messages

## Dependencies
- Setup (T001-T003) before everything
- Tests (T004-T008) before implementation (T009-T019)
- T009 (DeepL client) blocks T010 (Translation service)
- T010 (Translation service) blocks T012 (PATCH endpoint)
- T011 (Usage tracking) blocks T013 (Usage endpoint)
- T014 (Router update) requires T012, T013
- T015 (Types) supports T009-T013 [P]
- Implementation (T009-T015) before integration (T016-T019)
- All core work before polish (T020-T024)

## Parallel Example
```bash
# Launch T004-T008 together (Phase 3.2):
# These can run in parallel because they create different test files

# Terminal 1:
# Task: "Contract test PATCH /lexemes/{lexeme_id}?fill_example_meaning=1 in src/api/lexemes/update.test.ts"

# Terminal 2:
# Task: "Contract test GET /translate/usage in src/api/translate/usage.test.ts"

# Terminal 3:
# Task: "Integration test: Fill missing example meaning scenario in src/api/translate/integration.test.ts"

# Terminal 4:
# Task: "Integration test: API failure graceful degradation in src/api/translate/graceful-degradation.test.ts"

# Terminal 5:
# Task: "Integration test: Quota management tracking in src/api/translate/quota.test.ts"
```

```bash
# Launch T009, T010, T011 together (Phase 3.3 core services):
# These can run in parallel because they create different service files

# Terminal 1:
# Task: "DeepL API client in src/api/translate/client.ts"

# Terminal 2:
# Task: "Translation service with error handling in src/api/translate/service.ts"

# Terminal 3:
# Task: "Usage tracking service in src/api/translate/usage.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD principle)
- Use existing Cloudflare Workers patterns and file structure
- DeepL Free API has 500k character/month limit
- Focus on graceful degradation when API fails
- No new database tables - only populate existing Lexeme.example_meaning

## Task Generation Rules Applied

1. **From Contracts** (translation-api.yaml):
   - PATCH /lexemes/{lexeme_id} → T004 (contract test) + T012 (implementation)
   - GET /translate/usage → T005 (contract test) + T013 (implementation)
   
2. **From Data Model** (data-model.md):
   - TranslationRequest entity → T010 (translation service)
   - Enhanced Lexeme table → T012 (lexeme update endpoint)
   - UsageTracking → T011 (usage service)
   
3. **From User Stories** (quickstart.md scenarios):
   - Scenario 1: Fill missing meanings → T006 (integration test)
   - Scenario 2: API failure → T007 (graceful degradation test)
   - Scenario 3: Quota management → T008 (quota test)
   - Scenarios 4-5: Covered by end-to-end validation in T023

4. **Ordering Applied**:
   - Setup (T001-T003) → Tests (T004-T008) → Core (T009-T015) → Integration (T016-T019) → Polish (T020-T024)
   - Dependencies enforced: DeepL client before service, service before endpoints

## Validation Checklist ✅

- [x] All contracts have corresponding tests (T004: PATCH lexemes, T005: GET usage)
- [x] All entities have implementation tasks (TranslationRequest → T010, UsageTracking → T011)
- [x] All tests come before implementation (T004-T008 before T009-T015)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path (all paths provided)
- [x] No task modifies same file as another [P] task (verified file isolation)
- [x] TDD enforced: Tests must fail before implementation begins
- [x] Quickstart scenarios covered in integration tests
- [x] Constitutional compliance: extends existing API, no wordbook changes