
# Implementation Plan: Settings Page

**Branch**: `002-build-a-settings` | **Date**: 7 oktober 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-build-a-settings/spec.md`

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
User settings configuration page for Läss Swedish learning platform. Provides local storage-based settings for theme preference (light/dark/system), daily review limits, and PWA notification preferences. Integrates with existing theme system and review logic without cross-device synchronization.

## Technical Context
**Language/Version**: TypeScript with React 19 + Vite  
**Primary Dependencies**: React Router, Radix UI components, TailwindCSS, Jotai (state management)  
**Storage**: Browser localStorage (no backend sync), existing UserSettings interface extension  
**Testing**: Vitest for unit/integration tests, React Testing Library for component tests  
**Target Platform**: Progressive Web App (PWA) - browser-based with offline capabilities
**Project Type**: web - React frontend with existing Cloudflare Workers backend (frontend-only feature)  
**Performance Goals**: Immediate theme application, <100ms settings save/load operations  
**Constraints**: PWA compliance, offline-first architecture, localStorage size limits, existing DDD structure  
**Scale/Scope**: Single settings page, 3-5 configuration options, minimal UI complexity
**User Input**: Existing libraries should be sufficient to implement this feature

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Local-First Architecture**: ✅ PASS  
- Settings stored in localStorage for offline access
- Integrates with existing IndexedDB/Dexie pattern
- No network dependency for core settings functionality

**PWA-First Design**: ✅ PASS  
- Uses PWA Notifications API for browser notifications
- Responsive design following existing patterns
- Theme support extends existing dark/light system

**Test-Driven Development**: ✅ PASS  
- Will use Vitest and React Testing Library
- Component tests for settings UI
- Integration tests for localStorage persistence

**Simplicity and Performance**: ✅ PASS  
- Extends existing UserSettings interface (no new complexity)
- Uses existing Radix UI components and patterns
- Simple localStorage operations, no heavy computations

**Domain-Driven Design**: ✅ PASS  
- Follows existing DDD structure with domain/application/infrastructure/presentation layers
- Extends shared domain models without violating bounded contexts
- Settings as a cross-cutting concern, properly integrated

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

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

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
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each interface contract → contract test task [P]
- Settings domain model → model creation and validation tasks [P]
- Form component → component test and implementation tasks
- Integration points → integration test tasks
- Quickstart scenarios → end-to-end test tasks

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Domain → Application → Infrastructure → Presentation
- Domain layer: Types and validation first
- Application layer: Services and business logic
- Infrastructure layer: localStorage repository
- Presentation layer: Components, hooks, pages
- Mark [P] for parallel execution (independent files)

**Settings-Specific Task Categories**:
1. **Setup & Types**: Extend UserSettings interface, create new enums
2. **Domain Tests**: Validation schemas, business rules
3. **Repository Tests**: localStorage operations, error handling
4. **Service Tests**: Settings management, notification permissions
5. **Component Tests**: Form validation, theme integration
6. **Integration Tests**: Cross-system compatibility
7. **Implementation**: Make all tests pass following TDD

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations identified. The feature follows existing patterns and architecture.

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
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
