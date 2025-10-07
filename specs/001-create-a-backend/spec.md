# Feature Specification: DeepL Free API Integration for Active Review

**Feature Branch**: `001-create-a-backend`  
**Created**: 6 oktober 2025  
**Updated**: 7 oktober 2025  
**Status**: Draft  
**Input**: User description: "Create a backend API to polyfill English meanings of Swedish sentences using DeepL Free API for active review when only Swedish examples are available"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature clearly specified: API to translate Swedish example sentences to English
2. Extract key concepts from description
   → Actors: Swedish learners using active review, backend API, DeepL Free API service
   → Actions: translate Swedish sentences, store translations, retrieve during active review
   → Data: Swedish example sentences, English translations, API responses
   → Constraints: only when English meaning unavailable, DeepL Free API limits
3. For each unclear aspect:
   → DeepL Free API has known limits: 500,000 characters/month
   → API key authentication already available
   → Rate limiting: standard HTTP rate limits apply
4. Fill User Scenarios & Testing section
   → Primary flow: User encounters Swedish-only example during active review
5. Generate Functional Requirements
   → Each requirement testable and measurable
6. Identify Key Entities
   → Translation requests, cached translations, API responses
7. Run Review Checklist
   → Spec focused on user value, not implementation details
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A Swedish learner is doing active review exercises where they need to construct Swedish sentences. The system has many Lexeme records with Swedish `example` sentences but missing English `example_meaning` translations. The system should provide API endpoints to fill these missing English translations using DeepL Free API, improving the data quality and learning experience for all users.

### Acceptance Scenarios
1. **Given** a word has lexemes with `example` but no `example_meaning` **When** the translation API is called for that word **Then** all missing `example_meaning` fields are populated with English translations
2. **Given** a Swedish example sentence has been translated **When** the same sentence appears in other lexemes **Then** the system uses the cached translation without re-translating
3. **Given** a translation request fails **When** the system cannot obtain a translation **Then** the `example_meaning` field remains empty and the failure is logged
4. **Given** an admin runs batch translation **When** processing multiple lexemes **Then** the system efficiently translates all missing `example_meaning` fields across the database

### Edge Cases
- What happens when DeepL Free API is unavailable or returns errors?
- How does the system handle sentences that are too long for translation?
- What if the translation quality is poor or nonsensical?
- How does the system behave when DeepL Free API monthly character limits (500,000) are exceeded?

## Requirements

### Functional Requirements
- **FR-001**: System MUST detect when Lexeme records have `example` but missing `example_meaning` fields
- **FR-002**: System MUST provide API endpoints to translate Swedish `example` text to English `example_meaning` using DeepL Free API
- **FR-003**: System MUST store successful translations permanently in the Lexeme table `example_meaning` field
- **FR-004**: System MUST cache translations to avoid re-translating identical Swedish text
- **FR-005**: System MUST continue functioning when DeepL Free API is unavailable (graceful degradation)
- **FR-006**: System MUST provide translation API responses within 5 seconds
- **FR-007**: System MUST track translation requests and responses to monitor character usage against monthly limits
- **FR-008**: System MUST handle translation requests while staying within DeepL Free API monthly limit of 500,000 characters
- **FR-009**: System MUST support batch processing of multiple lexemes for data migration scenarios
- **FR-010**: System MUST validate that translations are reasonable before storing (maximum 500 characters per translation)

### Key Entities
- **Translation Request**: Represents a request to translate a Swedish sentence, including the source text and request metadata
- **Cached Translation**: Stored English translation of a Swedish sentence, with creation timestamp and source information (DeepL Free API)
- **Translation Response**: Result from DeepL Free API service, including translated text and any error information
- **Character Usage Tracking**: Monthly character consumption monitoring to stay within DeepL Free API limits

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified (DeepL Free API limits)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
