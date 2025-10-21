# Feature Specification: GDPR Compliance

**Feature Branch**: `003-gdpr-compliance`  
**Created**: 2025-10-21  
**Status**: Complete - Ready for Planning  
**Input**: User description: "GDPR compliance"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature: Make Läss compliant with GDPR regulations
2. Extract key concepts from description
   → Actors: End users, data subjects, data controllers
   → Actions: Consent management, data access, data deletion, data portability
   → Data: User emails, authentication tokens, word learning progress, user settings
   → Constraints: GDPR legal requirements for EU users
3. For each unclear aspect:
   → ~~Geographic scope - RESOLVED: Apply to all users globally~~
   → ~~Legal basis - RESOLVED: Consent-based approach~~
   → ~~Deletion propagation time - RESOLVED: D1 only, immediate deletion~~
4. Fill User Scenarios & Testing section
   → Complete
5. Generate Functional Requirements
   → Complete (marked ambiguous requirements)
6. Identify Key Entities
   → Complete
7. Run Review Checklist
   → WARN "Spec has uncertainties requiring clarification"
8. Return: SUCCESS (spec ready for planning after clarifications)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
As a user of Läss, I want to understand what personal data is collected about me, how it's used, and have full control over my data including the ability to access, export, correct, and delete it, so that I can trust the platform respects my privacy rights under GDPR.

### Acceptance Scenarios

1. **Given** a new user visits Läss for the first time, **When** they attempt to create an account or use features requiring data collection, **Then** they must be presented with clear information about data collection practices and provide explicit consent before proceeding.

2. **Given** an authenticated user, **When** they navigate to privacy settings, **Then** they can view all personal data stored about them including email, learning progress, and settings.

3. **Given** an authenticated user requests data export, **When** the request is processed, **Then** they receive all their personal data in a structured, machine-readable format (JSON or CSV) including word book entries, learning statistics, and settings.

4. **Given** an authenticated user requests account deletion, **When** the request is confirmed, **Then** all their personal data (email, word book entries, user settings, session tokens) must be permanently deleted within a reasonable timeframe, and they receive confirmation.

5. **Given** a user updates their email or other personal information, **When** the change is saved, **Then** all references to the old data across the system are updated or anonymized appropriately.

### Edge Cases

- What happens when a user requests data export but has no word book entries (new account)?
  - System should still provide export with email and settings, indicating empty learning data.

- How does the system handle deletion requests for users with active sessions?
  - All active sessions must be invalidated immediately upon deletion request confirmation.

- What happens if a user requests deletion but later tries to log in with the same OAuth provider?
  - System should treat them as a new user and re-request consent.

- How does the system handle deletion of server-side data (D1 database)?
  - All user data in D1 (UserSettings, WordBookEntry records) must be deleted immediately upon deletion request confirmation. IndexedDB is client-side storage controlled by the user and is not subject to GDPR deletion requirements.

---

## Requirements

### Functional Requirements

**Data Transparency & Access**
- **FR-001**: System MUST provide a privacy policy page explaining what data is collected (email, learning progress, user preferences), why it's collected, and the legal basis for processing (user consent for service provision).
- **FR-002**: System MUST display a privacy notice or consent banner to all first-time users (globally, not just EU) before collecting any personal data, clearly explaining data usage and requesting explicit consent.
- **FR-003**: Users MUST be able to view all their stored personal data including email address, word book entries, review statistics, and user settings.
- **FR-004**: System MUST provide timestamps showing when each piece of data was created and last updated.

**Data Portability**
- **FR-005**: Authenticated users MUST be able to export all their personal data in a structured, commonly used, machine-readable format (e.g., JSON or CSV).
- **FR-006**: Data export MUST include: user email, all word book entries with review counts and next review times, user settings (auto review preferences, daily counts), and creation/update timestamps.
- **FR-007**: System MUST generate data export immediately upon request, as all user data is available in the D1 database and can be queried at once.

**Right to Erasure (Right to be Forgotten)**
- **FR-008**: Authenticated users MUST be able to request permanent deletion of their account and all associated personal data from server-side storage.
- **FR-009**: System MUST display a clear warning before account deletion explaining that the action is irreversible and will result in loss of all synced learning progress. Users should be informed that local data in their browser (IndexedDB) can be cleared manually through browser settings.
- **FR-010**: Upon confirmed deletion request, system MUST delete from D1 database: user authentication sessions, all UserSettings records for that user, all WordBookEntry records for that user, and any server-side cached personal data.
- **FR-011**: System MUST complete server-side data deletion immediately (within seconds) of deletion request confirmation, as all user data is stored in a single D1 database.
- **FR-012**: System MUST send confirmation to the user's email when deletion is complete.

**Data Minimization & Retention**
- **FR-013**: System MUST only collect personal data that is necessary for providing the Swedish learning service (email for authentication and sync, learning progress for spaced repetition backup).
- **FR-014**: System MUST NOT process user data for any purpose beyond service provision (no analytics, marketing, or AI training).
- **FR-015**: System MUST retain user data indefinitely until user requests deletion, as there is no automatic inactive account deletion policy.

**User Rights & Support**
- **FR-016**: System MUST provide a clear mechanism for users to exercise their GDPR rights (access, rectification, erasure, portability, restrict processing, object).
- **FR-017**: System MUST handle data export and deletion requests immediately in-app, as these operations can be completed instantly from the D1 database.
- **FR-018**: System MUST provide contact information for data protection inquiries (email address or contact form).

**Cross-Border Data Transfers**
- **FR-019**: System MUST inform users that data is stored on Cloudflare infrastructure, which is GDPR-compliant and provides appropriate safeguards for cross-border data transfers.

**Third-Party Data Sharing**
- **FR-020**: System MUST disclose that OAuth providers (GitHub/Google) are used only for authentication purposes and receive no user data beyond the initial email retrieval during login.
- **FR-021**: System MUST disclose that DeepL API is used for translating Swedish example sentences and receives only text content (no personal identifiers).
- **FR-022**: System MUST disclose that Google Gemini AI API is used for querying Swedish meaning and getting example sentences and receives only text content (no personal identifiers).

### Key Entities

- **User/Data Subject**: An individual using Läss, identified by email address obtained through OAuth authentication (GitHub or Google). The user has GDPR rights including access, portability, erasure, and consent management.

- **Personal Data**: Information that identifies or relates to a user, including:
  - Email address (from OAuth provider)
  - Word book learning progress (WordBookEntry records in D1)
  - User preferences (UserSettings records in D1)
  - Authentication session tokens (server-side)
  
  Note: IndexedDB data is client-side storage under user control and not subject to GDPR controller obligations.

- **Data Export Package**: A machine-readable file (JSON/CSV) containing all personal data about a user, generated upon request, including metadata about data collection and processing.

- **Privacy Policy Document**: Legal text explaining data collection, processing purposes, legal basis, retention periods, user rights, and contact information (project author as data controller). Must be versioned and users notified of material changes.

- **Deletion Request**: A record of user's request to delete their account, including request timestamp, confirmation status, deletion completion timestamp, and verification that all data has been removed.

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain - **All resolved!** (down from 14)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (immediate in-app operations for export/deletion)
- [x] Scope is clearly bounded (Global GDPR compliance for all users, consent-based, server-side personal data in D1, data used only for service provision, no auto-deletion, immediate request handling, author as data controller, Cloudflare GDPR-compliant infrastructure)
- [x] Dependencies and assumptions identified (OAuth providers for auth only, Cloudflare infrastructure, DeepL/Gemini APIs for text processing only)

### Outstanding Clarifications Required

None - all clarifications have been resolved.

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked and resolved (14/14 resolved: local storage, anonymized stats, deletion time, export time, consent management, inactive account auto-deletion, rights request handling, audit logs, DPO, Cloudflare regions, third-party contracts, geographic scope, legal basis)
- [x] User scenarios defined
- [x] Requirements generated (22 functional requirements)
- [x] Entities identified (5 key entities)
- [x] Review checklist passed - **SPECIFICATION COMPLETE**

---

## Next Steps

✅ **Specification is complete and ready for planning phase!**

Key decisions finalized:
1. ✅ Apply GDPR-level protections to all users globally (not just EU)
2. ✅ Use consent-based legal basis (users explicitly consent to data collection for service provision)
3. ✅ All technical implementation details clarified (immediate operations, D1 storage, no audit logs, Cloudflare infrastructure)

Ready to proceed to:
- Planning phase: Break down requirements into technical tasks
- Data model design: Define privacy policy table, consent tracking
- UI/UX design: Privacy notice/consent banner, settings page, data export/deletion flows
