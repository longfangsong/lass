# Research: GDPR Compliance Implementation

**Date**: 2025-10-21  
**Status**: Complete

## Overview

Research findings for implementing GDPR compliance in Läss, focusing on consent management, data export/deletion, and privacy UI components.

---

## 1. Consent Banner Design & Storage

### Decision
Implement a modal/banner consent UI using shadcn/ui Dialog component, storing consent state in IndexedDB with sync to D1.

### Rationale
- **User Experience**: Modal ensures users cannot miss the consent requirement (blocking UI pattern)
- **Storage Strategy**: IndexedDB-first for offline support, D1 for server-side record keeping
- **Component Library**: shadcn/ui already in use (see `components.json`), provides accessible Dialog primitive
- **GDPR Requirement**: Explicit consent before data collection (FR-002)

### Alternatives Considered
1. **Cookie-based consent only**: Rejected - need server-side record for compliance documentation
2. **Banner (non-blocking)**: Rejected - users might skip, violates explicit consent requirement
3. **Separate consent page**: Rejected - adds friction, modal is sufficient for simple consent

### Implementation Notes
- Store consent as `{ userId: string, consentGiven: boolean, timestamp: number }` in IndexedDB
- Sync to D1 `UserConsent` table when user authenticates
- Show banner on first app load (check localStorage/IndexedDB for previous consent)
- Include links to privacy policy and data usage explanation

---

## 2. Data Export Format & Generation

### Decision
Generate JSON export as primary format, with CSV as optional alternative. Use server-side generation from D1 queries.

### Rationale
- **JSON Advantages**: Preserves data structure, supports nested objects (wordbook entries with metadata), standard machine-readable format
- **CSV Alternative**: Human-friendly for spreadsheet import, useful for non-technical users
- **Performance**: D1 query + JSON serialization is fast (<200ms for typical user data ~100-1000 entries)
- **GDPR Article 20**: Requires "structured, commonly used, machine-readable format" - both JSON and CSV qualify

### Alternatives Considered
1. **XML export**: Rejected - verbose, no advantage over JSON
2. **Client-side export from IndexedDB**: Rejected - doesn't include server-only data, source of truth is D1
3. **Async email delivery**: Rejected - spec requires immediate in-app download

### Export Schema
```typescript
interface UserDataExport {
  exportDate: string;        // ISO 8601 timestamp
  user: {
    email: string;
    createdAt: string;
  };
  settings: {
    autoNewReview: number;
    dailyNewReviewCount: number;
    updatedAt: string;
  };
  wordbook: Array<{
    wordId: string;
    lemma: string;
    partOfSpeech: string;
    passiveReviewCount: number;
    nextPassiveReviewTime: string;
    activeReviewCount: number;
    nextActiveReviewTime: string;
    addedAt: string;
  }>;
}
```

### CSV Export Strategy
For CSV, flatten structure with headers:
```
Email,Setting_AutoNewReview,Setting_DailyCount,Word_Lemma,Word_POS,Word_PassiveCount,...
user@example.com,2,10,hej,interjection,5,...
```

---

## 3. Data Deletion Scope & Cascade

### Decision
Delete all user data from D1 in single transaction: UserSettings, WordBookEntry records, authentication sessions. IndexedDB cleanup is user-responsibility (documented in UI).

### Rationale
- **Single Transaction**: D1 supports transactions, ensures atomicity (all-or-nothing deletion)
- **Cascade Strategy**: Manual CASCADE via SQL (D1/SQLite doesn't enforce foreign key cascades by default)
- **Performance**: Immediate deletion (~100-500ms for typical user)
- **GDPR Requirement**: Right to erasure (FR-008 to FR-012) applies to server-controlled data only

### SQL Deletion Order
```sql
BEGIN TRANSACTION;
-- 1. Delete wordbook entries (foreign key to user_email)
DELETE FROM WordBookEntry WHERE user_email = ?;

-- 2. Delete user settings
DELETE FROM UserSettings WHERE user_email = ?;

-- 3. Invalidate sessions (if stored in DB)
DELETE FROM Sessions WHERE user_email = ?;

COMMIT;
```

### Alternatives Considered
1. **Soft delete with flag**: Rejected - GDPR requires permanent deletion, adds complexity
2. **Async deletion via queue**: Rejected - spec requires immediate deletion
3. **Anonymization instead of deletion**: Rejected - insufficient for "right to be forgotten"

### Email Confirmation
Send confirmation email BEFORE deleting email from database:
1. Prepare confirmation email with deletion timestamp
2. Send via email service
3. Execute deletion transaction
4. If email fails, log but proceed (user already confirmed in-app)

---

## 4. Privacy Policy Content & Versioning

### Decision
Create static Markdown privacy policy, convert to HTML at build time, version with Git. No database storage or complex CMS.

### Rationale
- **Simplicity**: Static file is easy to maintain, version control via Git provides audit trail
- **Build-time Generation**: Vite plugin can convert MD → HTML, include in bundle
- **Offline Support**: Static HTML cached by service worker (PWA requirement)
- **Versioning**: Git commit sha as version ID, show "Last Updated" date in UI
- **GDPR Requirement**: FR-001 requires privacy policy explaining data collection

### Content Structure
```markdown
# Privacy Policy

Last Updated: [YYYY-MM-DD] | Version: [Git SHA short]

## 1. Data Controller
- Name: [Author name]
- Contact: [Email address]

## 2. Data We Collect
- Email address (from OAuth provider)
- Learning progress (wordbook entries, review statistics)
- User preferences (settings)

## 3. How We Use Data
- Authentication and account management
- Backup and sync of learning progress
- Spaced repetition algorithm

## 4. Legal Basis
- User consent (provided on first visit)

## 5. Data Retention
- Indefinite until user requests deletion

## 6. Your Rights
- View your data (Settings → Privacy)
- Export your data (JSON/CSV download)
- Delete your account (immediate permanent deletion)

## 7. Third Parties
- GitHub/Google OAuth (authentication only, no data sharing)
- DeepL API (text translation, no personal data)
- Gemini AI (dictionary queries, no personal data)
- Cloudflare (GDPR-compliant hosting)

## 8. Contact
- Email: [contact email]
```

### Alternatives Considered
1. **Database-stored policy**: Rejected - overengineered, static is sufficient
2. **Third-party policy generator**: Rejected - custom policy fits project better
3. **PDF download**: Rejected - HTML is web-native, more accessible

---

## 5. Settings UI Layout & Navigation

### Decision
Add "Privacy & Data" collapsible section in existing Settings page, below current settings. Use shadcn/ui Accordion component for progressive disclosure.

### Rationale
- **Existing Pattern**: Settings page already uses sections (user preferences, etc.)
- **Progressive Disclosure**: Accordion keeps UI clean, privacy options revealed on demand
- **Accessibility**: shadcn/ui Accordion has proper ARIA attributes
- **User Expectation**: Privacy settings typically found in "Settings" on web apps

### UI Layout
```
Settings Page
├── User Preferences (existing)
│   ├── Auto New Review
│   └── Daily Review Count
├── Privacy & Data (NEW)
│   ├── View Privacy Policy (link)
│   ├── View My Data (button → shows data in modal)
│   ├── Export My Data (button → immediate download)
│   └── Delete My Account (button → confirmation dialog → immediate deletion)
└── [Future sections]
```

### Component Hierarchy
```tsx
<SettingsPage>
  {/* Existing sections */}
  <Accordion>
    <AccordionItem value="privacy">
      <AccordionTrigger>Privacy & Data</AccordionTrigger>
      <AccordionContent>
        <PrivacyPanel>
          <PrivacyPolicyLink />
          <ViewDataButton />
          <ExportDataButton />
          <DeleteAccountButton />
        </PrivacyPanel>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</SettingsPage>
```

### Alternatives Considered
1. **Separate "Privacy" page**: Rejected - adds navigation complexity for 4 actions
2. **Top-level privacy nav item**: Rejected - doesn't fit app's simple 3-page structure (Home, Dictionary, Settings)
3. **Modal-only access**: Rejected - users expect persistent settings location

---

## 6. Consent State Management

### Decision
Store consent as boolean flag with timestamp in IndexedDB (`ConsentRecord` table), sync to D1 `UserConsent` table after authentication.

### Rationale
- **Offline-First**: User can browse app offline after initial consent (IndexedDB check)
- **Server Record**: D1 record for compliance documentation (GDPR audit requirement)
- **Simple State**: Boolean flag sufficient (no granular consent categories needed)
- **Sync Strategy**: Push to D1 on auth, pull on device change (via sync endpoint)

### IndexedDB Schema (Dexie)
```typescript
// In existing database schema
class LassDB extends Dexie {
  consent: Dexie.Table<ConsentRecord, string>;
  
  constructor() {
    super('LassDB');
    this.version(2).stores({
      // ... existing tables
      consent: 'userId, consentGiven, timestamp'
    });
  }
}

interface ConsentRecord {
  userId: string;        // 'anonymous' before auth, email after
  consentGiven: boolean;
  timestamp: number;     // Unix timestamp
  version: string;       // Privacy policy version (Git SHA)
}
```

### D1 Migration (Optional)
```sql
-- migrations/0003_add_privacy.sql
CREATE TABLE IF NOT EXISTS UserConsent (
  user_email VARCHAR(255) PRIMARY KEY,
  consent_given BOOLEAN NOT NULL,
  consent_timestamp INTEGER NOT NULL,
  policy_version VARCHAR(64),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Note**: D1 table is optional - IndexedDB sufficient for functionality, D1 adds compliance documentation.

### Alternatives Considered
1. **Cookie-only storage**: Rejected - no offline support, no sync across devices
2. **Separate consent categories**: Rejected - spec indicates single consent for service provision (no analytics/marketing)
3. **No server-side record**: Rejected - best practice for GDPR compliance is to keep server-side audit trail

---

## 7. Error Handling & Edge Cases

### Decision
Handle errors gracefully with user-friendly messages, allow retries, provide contact information on failures.

### Rationale
- **User Experience**: Technical errors shouldn't block GDPR rights (legal requirement)
- **Network Failures**: PWA may be used offline, operations should fail gracefully
- **Data Integrity**: Deletion must succeed or rollback (transaction safety)

### Error Scenarios & Handling

| Scenario | Handling Strategy |
|----------|------------------|
| Export API fails | Show error toast, retry button, "Contact us" link |
| Deletion API fails | Show error, DO NOT mark as deleted, offer retry |
| User offline during export | Disable button with tooltip "Requires connection" |
| Consent banner blocked by ad blocker | Fallback to inline banner, show on every page load until consented |
| Privacy policy fails to load | Cache static version in service worker, show cached |
| Email confirmation fails after deletion | Proceed with deletion (user confirmed in-app), log error |
| Export > 5MB (large wordbook) | Stream response, show progress indicator |

### Error Messages
```typescript
const ERROR_MESSAGES = {
  EXPORT_FAILED: "Failed to export your data. Please try again or contact support.",
  DELETE_FAILED: "Failed to delete your account. Your data is still intact. Please try again.",
  NETWORK_ERROR: "No internet connection. This action requires an active connection.",
  UNEXPECTED: "An unexpected error occurred. Please contact support with timestamp: {timestamp}"
};
```

---

## 8. Testing Strategy

### Decision
Write contract tests for APIs, integration tests for UI flows, unit tests for data transformations. Follow TDD (Red-Green-Refactor).

### Rationale
- **Constitution Requirement**: TDD is non-negotiable per constitution
- **Contract Tests**: Ensure API contracts match OpenAPI specs
- **Integration Tests**: Validate user stories from spec (consent flow, export, deletion)
- **Unit Tests**: Test JSON/CSV serialization, SQL queries

### Test Coverage Plan

**Phase 1: Contract Tests (Write First)**
```typescript
// tests/contract/privacy-api.test.ts
describe('POST /api/privacy/consent', () => {
  it('should return 201 with consent record', async () => {
    const response = await fetch('/api/privacy/consent', {
      method: 'POST',
      body: JSON.stringify({ consentGiven: true })
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchSchema(ConsentResponseSchema);
  });
});

describe('GET /api/privacy/export', () => {
  it('should return 200 with JSON data', async () => {
    const response = await fetch('/api/privacy/export');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchSchema(ExportDataSchema);
  });
});

describe('DELETE /api/privacy/account', () => {
  it('should return 200 and delete all user data', async () => {
    const response = await fetch('/api/privacy/account', { method: 'DELETE' });
    expect(response.status).toBe(200);
    // Verify data deleted (query D1)
  });
});
```

**Phase 2: Integration Tests**
```typescript
// tests/integration/gdpr-flow.test.ts
describe('GDPR User Flow', () => {
  it('should show consent banner on first visit', async () => {
    // Clear IndexedDB
    // Load app
    // Assert banner visible
  });

  it('should export user data as JSON', async () => {
    // Authenticate user
    // Navigate to settings
    // Click export
    // Verify download triggered
  });

  it('should delete account and all data', async () => {
    // Authenticate user
    // Navigate to settings
    // Click delete, confirm
    // Verify redirect to home
    // Verify D1 data deleted
  });
});
```

**Phase 3: Unit Tests**
```typescript
// tests/unit/export-service.test.ts
describe('DataExportService', () => {
  it('should serialize user data to JSON', () => {
    const data = { /* mock user data */ };
    const json = DataExportService.toJSON(data);
    expect(JSON.parse(json)).toEqual(data);
  });

  it('should serialize user data to CSV', () => {
    const data = { /* mock user data */ };
    const csv = DataExportService.toCSV(data);
    expect(csv).toContain('Email,Setting_AutoNewReview');
  });
});
```

### Test Execution Order (TDD)
1. Write contract tests → FAIL (no API implementation)
2. Implement API endpoints → PASS
3. Write integration tests → FAIL (no UI)
4. Implement UI components → PASS
5. Write unit tests → FAIL (no services)
6. Implement services → PASS

---

## 9. Performance Considerations

### Decision
Target <200ms for export, <1s for deletion, <100ms for consent checks. Use D1 prepared statements and indexes.

### Rationale
- **User Expectation**: Data rights actions should feel immediate
- **GDPR Requirement**: FR-007 and FR-011 specify immediate operations
- **D1 Performance**: SQLite is fast for small datasets (<1000 records typical)

### Optimization Strategies

**Export Performance**
- Single D1 query with JOIN (UserSettings + WordBookEntry)
- Stream JSON response (don't load all in memory)
- Use `LIMIT` for pagination if >10k entries (unlikely)
- Prepare statement: `SELECT * FROM WordBookEntry WHERE user_email = ?`

**Deletion Performance**
- Single transaction with 3 DELETE statements
- Indexes on `user_email` column (already exists per schema)
- No cascade triggers (manual DELETE in correct order)
- Prepare statement pool for high concurrency

**Consent Check Performance**
- IndexedDB lookup: O(1) with primary key (`userId`)
- No API call required for consent check (offline-first)
- Lazy sync to D1 (doesn't block UI)

### Monitoring (Future)
- Log export/deletion times to Cloudflare Analytics
- Alert if p95 > 500ms for export or > 2s for deletion
- Track consent banner acceptance rate

---

## 10. Accessibility & i18n

### Decision
Use shadcn/ui components (accessible by default), support English only initially, structure for future i18n.

### Rationale
- **Accessibility**: shadcn/ui built on Radix UI with full ARIA support
- **i18n**: English sufficient for MVP (Swedish users generally English-proficient), structure allows future localization
- **Screen Readers**: Consent banner has proper focus management, error messages announced

### Accessibility Checklist
- [ ] Consent banner keyboard navigable (Tab, Enter, Esc)
- [ ] Delete confirmation uses AlertDialog (focus trap)
- [ ] Error messages have `role="alert"` for screen readers
- [ ] Export button shows loading state (aria-busy)
- [ ] Privacy policy has proper heading hierarchy (h1, h2, h3)
- [ ] Color contrast meets WCAG AA (use TailwindCSS dark mode variants)

### i18n Structure (Future)
```typescript
// locales/en.json
{
  "privacy": {
    "consentBanner": {
      "title": "We respect your privacy",
      "description": "We collect your email and learning progress to provide sync and backup. See our {privacyPolicy} for details.",
      "accept": "Accept",
      "decline": "Decline"
    },
    "settingsPanel": {
      "title": "Privacy & Data",
      "viewData": "View My Data",
      "exportData": "Export My Data",
      "deleteAccount": "Delete My Account"
    }
  }
}
```

---

## Summary of Key Decisions

1. **Consent**: Modal banner with IndexedDB + D1 storage, shown on first visit
2. **Export**: JSON primary (CSV optional), generated from D1, immediate download
3. **Deletion**: Single D1 transaction, cascade deletes, immediate completion
4. **UI**: Extend Settings page with Accordion section, shadcn/ui components
5. **Storage**: IndexedDB-first for offline, D1 for server record
6. **Testing**: TDD with contract → integration → unit test progression
7. **Performance**: <200ms export, <1s deletion, indexed queries
8. **Accessibility**: WCAG AA compliant, keyboard navigable, screen reader friendly

**No unresolved NEEDS CLARIFICATION** - All technical decisions finalized.

---

**Research Complete** ✅  
**Ready for Phase 1: Design & Contracts**
