# Quickstart Guide: GDPR Compliance

**Date**: 2025-10-21  
**Feature**: GDPR Compliance (Privacy Panel & Consent Banner)  
**Status**: Complete

## Overview

This guide provides step-by-step validation of GDPR compliance features from a user's perspective. Each scenario maps to acceptance criteria in the specification.

---

## Prerequisites

- Local development environment running (`pnpm run dev`)
- D1 database migrated (`npx wrangler d1 migrations apply DB --local`)
- Test user account (GitHub/Google OAuth configured)
- IndexedDB cleared (for fresh consent testing): DevTools → Application → IndexedDB → Delete "LassDB"

---

## User Stories & Validation

### Story 1: First-Time User Sees Consent Banner

**As a**: New user visiting Läss for the first time  
**I want to**: Understand how my data is used before proceeding  
**So that**: I can make an informed decision about using the app

#### Test Steps

1. **Clear browser storage** (simulate new user):
   - Open DevTools → Application → Storage
   - Click "Clear site data"
   - Reload page (Cmd+R / Ctrl+R)

2. **Verify consent banner appears**:
   - ✅ Modal overlay visible (backdrop with opacity)
   - ✅ Title: "Privacy & Cookies Policy"
   - ✅ Policy text visible (summary of data usage)
   - ✅ Two buttons: "Accept" (primary) and "Decline" (secondary)
   - ✅ Cannot dismiss modal by clicking outside or pressing Escape

3. **Test "Decline" action**:
   - Click "Decline" button
   - ✅ Modal closes
   - ✅ Features requiring data storage are disabled (e.g., wordbook sync)
   - ✅ User remains on current page (not redirected)

4. **Test "Accept" action** (reload page first):
   - Clear storage again
   - Reload page → consent banner appears
   - Click "Accept" button
   - ✅ Modal closes
   - ✅ All features enabled (wordbook, settings sync)
   - ✅ User can proceed to use app normally

5. **Verify persistence**:
   - Reload page
   - ✅ Consent banner does NOT reappear
   - ✅ App functions normally (consent remembered)

6. **Verify IndexedDB storage**:
   - Open DevTools → Application → IndexedDB → LassDB → consent
   - ✅ Record exists with `userId: "anonymous"` (before login)
   - ✅ `consentGiven: true`
   - ✅ `timestamp` is recent Unix timestamp
   - ✅ `policyVersion` is valid Git SHA

**Expected Behavior**: Consent banner appears once, records choice, persists across sessions.

**Acceptance Criteria**: FR-001, FR-002, FR-003 (from spec.md)

---

### Story 2: Authenticated User Syncs Consent to Server

**As a**: User who accepted consent and then logged in  
**I want to**: My consent decision synchronized to the server  
**So that**: My choice is consistent across devices

#### Test Steps

1. **Accept consent as anonymous user** (follow Story 1 steps 1-4)

2. **Log in via OAuth**:
   - Click "Login" in navigation
   - Choose GitHub or Google
   - Complete OAuth flow
   - ✅ Redirected back to Läss

3. **Verify D1 database sync**:
   - Check D1 database (wrangler CLI or admin panel):
     ```bash
     npx wrangler d1 execute DB --local --command \
       "SELECT * FROM UserConsent WHERE user_email = 'your@email.com'"
     ```
   - ✅ Record exists with `user_email: "your@email.com"`
   - ✅ `consent_given: true` (matches IndexedDB)
   - ✅ `consent_timestamp` matches IndexedDB timestamp (within seconds)
   - ✅ `policy_version` matches

4. **Verify IndexedDB update**:
   - Open DevTools → Application → IndexedDB → LassDB → consent
   - ✅ `userId` updated from "anonymous" to email address

**Expected Behavior**: Anonymous consent record migrated to authenticated user's email upon login.

**Acceptance Criteria**: FR-003, FR-004

---

### Story 3: User Views Their Data in Settings

**As a**: Authenticated user with learning progress  
**I want to**: See what data is stored about me  
**So that**: I understand what will be exported/deleted

#### Test Steps

1. **Navigate to Settings page**:
   - Log in (if not already)
   - Click "Settings" in navigation
   - ✅ Settings page loads

2. **Locate Privacy section**:
   - Scroll to "Privacy & Data" accordion
   - Click to expand
   - ✅ Section expands smoothly

3. **Verify data summary display**:
   - ✅ Email address displayed: "your@email.com"
   - ✅ Registration date shown (e.g., "Joined Jan 15, 2025")
   - ✅ Wordbook count displayed (e.g., "127 words")
   - ✅ Last activity timestamp (e.g., "Last active Oct 20, 2025")
   - ✅ Data size estimates:
     - Wordbook: "X KB"
     - Settings: "X KB"
     - Total: "X KB"

4. **Verify buttons present**:
   - ✅ "Export My Data" button (primary style)
   - ✅ "Delete My Account" button (destructive red style)

**Expected Behavior**: User can see summary of stored data before taking actions.

**Acceptance Criteria**: FR-005, FR-006

---

### Story 4: User Exports Their Data (JSON)

**As a**: User concerned about data portability  
**I want to**: Download all my data in machine-readable format  
**So that**: I can keep a backup or migrate to another service

#### Test Steps

1. **Navigate to Settings → Privacy**:
   - Log in and go to Settings page
   - Expand "Privacy & Data" accordion

2. **Initiate export (JSON)**:
   - Click "Export My Data" button
   - ✅ Modal appears: "Export Your Data"
   - ✅ Format dropdown visible (default: JSON)
   - Select "JSON" format (if not default)
   - Click "Download" button

3. **Verify export generation**:
   - ✅ Loading indicator appears (< 1 second)
   - ✅ File download starts automatically
   - ✅ Filename format: `lass-data-export-YYYY-MM-DD.json`

4. **Verify JSON structure**:
   - Open downloaded file in text editor
   - ✅ Valid JSON (no parse errors)
   - ✅ `exportMetadata` section present:
     - `exportDate` (ISO 8601 format)
     - `exportVersion: "1.0"`
     - `userId: "your@email.com"`
   - ✅ `user` section present:
     - `email`
     - `registeredAt` (ISO 8601)
   - ✅ `settings` section present:
     - `autoNewReview` (0-3)
     - `dailyNewReviewCount` (integer)
     - `updatedAt` (ISO 8601)
   - ✅ `wordbook` array present:
     - Each entry has: `id`, `wordId`, `lemma`, `partOfSpeech`, review counts, timestamps
     - Array length matches count shown in settings

5. **Verify performance**:
   - Check browser Network tab (DevTools)
   - ✅ Export request completes in <200ms (for <1000 wordbook entries)
   - ✅ Response size reasonable (< 1MB for typical user)

**Expected Behavior**: JSON export downloads immediately with complete user data.

**Acceptance Criteria**: FR-007, FR-008

---

### Story 5: User Exports Their Data (CSV)

**As a**: User preferring spreadsheet tools  
**I want to**: Download data in CSV format  
**So that**: I can analyze it in Excel/Google Sheets

#### Test Steps

1. **Navigate to Settings → Privacy** (as in Story 4)

2. **Initiate export (CSV)**:
   - Click "Export My Data" button
   - ✅ Modal appears
   - Select "CSV" format from dropdown
   - Click "Download" button

3. **Verify CSV download**:
   - ✅ File download starts
   - ✅ Filename format: `lass-data-export-YYYY-MM-DD.csv`

4. **Verify CSV structure**:
   - Open in text editor or spreadsheet app
   - ✅ Three columns: `Section`, `Field`, `Value`
   - ✅ Rows grouped by section:
     - `metadata,exportDate,<ISO-8601>`
     - `metadata,userId,<email>`
     - `user,email,<email>`
     - `user,registeredAt,<ISO-8601>`
     - `settings,autoNewReview,<0-3>`
     - `wordbook,id,<uuid>`
     - `wordbook,lemma,<swedish-word>`
     - ... (repeated for each wordbook entry)
   - ✅ All data present (matches JSON export)

5. **Open in Excel/Sheets**:
   - Import CSV file
   - ✅ Columns properly separated
   - ✅ No encoding issues (Swedish characters display correctly: å, ä, ö)

**Expected Behavior**: CSV export contains same data as JSON in spreadsheet-friendly format.

**Acceptance Criteria**: FR-007, FR-008

---

### Story 6: User Deletes Their Account

**As a**: User wanting to stop using Läss  
**I want to**: Permanently delete all my data  
**So that**: No trace of my usage remains on the server

#### Test Steps

1. **Navigate to Settings → Privacy**:
   - Log in and go to Settings page
   - Expand "Privacy & Data" accordion

2. **Initiate deletion**:
   - Click "Delete My Account" button (red/destructive style)
   - ✅ Confirmation modal appears:
     - Title: "Delete Your Account"
     - Warning text (irreversible action)
     - Text input for confirmation phrase
     - "Cancel" and "Delete Forever" buttons

3. **Test invalid confirmation**:
   - Type wrong phrase (e.g., "delete account")
   - Click "Delete Forever"
   - ✅ Error message appears: "Confirmation phrase does not match"
   - ✅ Modal remains open
   - ✅ No deletion occurs

4. **Test valid confirmation**:
   - Clear text input
   - Type exact phrase: "delete my account"
   - Click "Delete Forever"
   - ✅ Loading indicator appears
   - ✅ Deletion completes in <1 second
   - ✅ Success toast: "Account deleted successfully"
   - ✅ User automatically logged out
   - ✅ Redirected to home page

5. **Verify server-side deletion**:
   - Check D1 database:
     ```bash
     npx wrangler d1 execute DB --local --command \
       "SELECT * FROM UserSettings WHERE user_email = 'your@email.com'"
     # Expected: No results
     
     npx wrangler d1 execute DB --local --command \
       "SELECT * FROM WordBookEntry WHERE user_email = 'your@email.com'"
     # Expected: No results
     
     npx wrangler d1 execute DB --local --command \
       "SELECT * FROM UserConsent WHERE user_email = 'your@email.com'"
     # Expected: No results
     ```
   - ✅ All records deleted

6. **Verify client-side persistence**:
   - Open DevTools → Application → IndexedDB → LassDB
   - ✅ Client data (wordBookEntries, userSettings) STILL EXISTS
   - ✅ Consent record remains (cannot prevent user from revisiting)
   - **Note**: This is expected behavior (offline-first architecture)

7. **Verify login attempt fails**:
   - Try to log in again with same account
   - ✅ Login succeeds (OAuth still works)
   - ✅ But NO user data retrieved (fresh account)
   - ✅ Treated as new user

**Expected Behavior**: Server-side data completely deleted. Client data persists but disconnected from server.

**Acceptance Criteria**: FR-010, FR-011, FR-012

---

### Story 7: User Revisits Privacy Policy

**As a**: User who wants to review the privacy policy  
**I want to**: Access the full policy text at any time  
**So that**: I can understand my rights

#### Test Steps

1. **From consent banner** (before accepting):
   - Clear storage to show banner
   - ✅ "Read Full Policy" link visible
   - Click link
   - ✅ Opens `/privacy-policy` page in new tab
   - ✅ Full policy text displayed

2. **From footer** (after accepting):
   - Scroll to page footer
   - ✅ "Privacy Policy" link visible
   - Click link
   - ✅ Opens `/privacy-policy` page
   - ✅ Same content as banner link

3. **From Settings page**:
   - Navigate to Settings → Privacy
   - ✅ "View Privacy Policy" button/link visible
   - Click link
   - ✅ Opens `/privacy-policy` page

4. **Verify policy content**:
   - ✅ Title: "Privacy & Data Processing Policy"
   - ✅ Last updated date displayed
   - ✅ Sections present:
     - What data we collect (email, wordbook progress)
     - How we use data (backup, sync)
     - Third parties (OAuth providers, Cloudflare)
     - Your rights (export, delete)
     - Contact information
   - ✅ Policy version (Git SHA) displayed in footer

**Expected Behavior**: Privacy policy accessible from multiple locations, always up-to-date.

**Acceptance Criteria**: FR-002, FR-005

---

### Story 8: User Changes Consent Decision

**As a**: User who declined consent initially  
**I want to**: Accept consent later to use sync features  
**So that**: I can access cross-device functionality

#### Test Steps

1. **Decline consent initially**:
   - Clear storage
   - Load page → consent banner appears
   - Click "Decline"
   - ✅ Features disabled (wordbook sync unavailable)

2. **Access consent settings**:
   - Navigate to Settings → Privacy
   - ✅ Message displayed: "You declined data processing"
   - ✅ Button: "Change Consent Preference"

3. **Change consent**:
   - Click "Change Consent Preference"
   - ✅ Consent banner reappears (or inline form)
   - Click "Accept"
   - ✅ Features enabled
   - ✅ Success message: "Consent updated"

4. **Verify persistence**:
   - Reload page
   - ✅ Consent banner does NOT reappear
   - ✅ Features remain enabled

5. **Verify IndexedDB update**:
   - DevTools → IndexedDB → consent
   - ✅ `consentGiven: true` (updated from false)
   - ✅ `timestamp` updated to new timestamp

**Expected Behavior**: Users can change consent decision; features update accordingly.

**Acceptance Criteria**: FR-003 (implied consent management)

---

## Performance Benchmarks

Test with varying data sizes:

| Wordbook Size | Export (JSON) | Export (CSV) | Delete Account |
|---------------|---------------|--------------|----------------|
| 10 words      | < 50ms        | < 50ms       | < 100ms        |
| 100 words     | < 100ms       | < 100ms      | < 200ms        |
| 1000 words    | < 200ms       | < 250ms      | < 1000ms       |
| 5000 words    | < 500ms       | < 600ms      | < 2000ms       |

**Targets**:
- ✅ <200ms export for typical users (<1000 words)
- ✅ <1s deletion for typical users

---

## Edge Cases to Test

### 1. Empty Wordbook
- User with no saved words
- Export should succeed (empty `wordbook: []` array)
- Deletion should succeed (0 WordBookEntry records)

### 2. Large Wordbook
- User with >5000 words
- Export may take >500ms (acceptable)
- Progress indicator should appear

### 3. Network Failure
- Disconnect network during export
- ✅ Error toast: "Export failed. Please try again."
- ✅ No file downloaded
- ✅ User can retry

### 4. Concurrent Operations
- User clicks "Export" then "Delete" before export completes
- ✅ Delete operation waits for export (or cancels export)
- ✅ No partial state

### 5. Policy Version Update
- User consented to old policy version
- App deploys new policy version
- ✅ Consent banner reappears on next visit
- ✅ User must re-consent to new version

---

## Accessibility Testing

### Keyboard Navigation
1. Tab through consent banner:
   - ✅ Focus moves: Policy text → "Decline" → "Accept" → "Read Full Policy"
   - ✅ Enter/Space activates buttons
   - ✅ Cannot Tab outside modal (focus trapped)

2. Tab through Settings → Privacy:
   - ✅ Accordion expandable via keyboard
   - ✅ "Export" and "Delete" buttons focusable
   - ✅ Enter activates buttons

### Screen Reader
1. Consent banner:
   - ✅ Modal announced: "Privacy & Cookies Policy dialog"
   - ✅ Policy text read aloud
   - ✅ Button labels clear: "Accept", "Decline"

2. Settings Privacy panel:
   - ✅ Data summary announced (email, wordbook count)
   - ✅ Button purposes clear ("Export your data", "Delete your account permanently")

### Color Contrast
- ✅ All text meets WCAG AA (4.5:1 contrast)
- ✅ Destructive buttons visually distinct (red)
- ✅ Focus indicators visible (2px outline)

---

## Internationalization (i18n)

Test with Swedish locale (if implemented):

1. **Consent Banner**:
   - ✅ Title: "Integritetspolicy & Cookies"
   - ✅ Buttons: "Acceptera", "Avvisa"

2. **Settings Privacy**:
   - ✅ Section title: "Integritet & Data"
   - ✅ Buttons: "Exportera Min Data", "Ta Bort Mitt Konto"

3. **Date Formatting**:
   - ✅ Timestamps use Swedish format: "21 oktober 2025"

4. **CSV Export**:
   - ✅ Column headers in Swedish: "Sektion", "Fält", "Värde"

---

## Troubleshooting

### Consent banner not appearing
- Check IndexedDB: `consent` table should be empty
- Clear site data: DevTools → Application → Clear site data
- Check browser console for errors

### Export failing with 401 Unauthorized
- Verify auth cookie present: DevTools → Application → Cookies
- Try logging out and back in
- Check JWT expiration

### Delete operation times out
- Check D1 database size: Large datasets may exceed 1s target
- Check wrangler logs: `wrangler tail`
- Verify database indexes: `user_email` should be indexed

### CSV export garbled characters
- Ensure UTF-8 encoding: File should start with BOM (optional)
- Open with UTF-8 support: Excel → "Import from CSV" → UTF-8

---

## Next Steps

After validating these user stories:

1. **Generate Tasks**: Run `/tasks` to create implementation task list
2. **Write Tests First**: Start with failing contract tests (TDD)
3. **Implement Features**: Follow task order (tests → models → services → API → UI)
4. **Validate Again**: Re-run this quickstart guide with implemented features

---

**Quickstart Guide Complete** ✅  
**Ready for Phase 1: Agent Context Update**
