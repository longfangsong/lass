# Data Model: GDPR Compliance

**Date**: 2025-10-21  
**Status**: Complete

## Overview

Data models for GDPR compliance feature, including consent tracking, user data export structure, and deletion records.

---

## Entities

### 1. Consent Tracking (Implicit via UserSettings)

**Approach**: No separate consent table needed. Consent is **implicit** - if a `UserSettings` record exists in D1, the user has already consented by logging in and using the service.

**Consent Banner**: Shows on first visit (before login) explaining:
- What data we collect (email, wordbook progress)
- How we use it (backup, sync)
- User must click "Accept" to proceed with login

**Server-Side Logic**:
```typescript
// Consent check: Does UserSettings exist?
const settings = await db.prepare(
  'SELECT user_email FROM UserSettings WHERE user_email = ?'
).bind(userEmail).first();

const hasConsented = settings !== null;
```

**Client-Side**: Show banner if user not logged in. Once logged in, presence of account implies consent.

**Note**: No `consent_timestamp` or `policy_version` tracking needed - simplicity over compliance theater. User consents by creating an account (OAuth + first use).

---

### 2. UserDataExport (Virtual Entity)

Not stored in database - generated on-demand from queries.

**Purpose**: Structure for JSON/CSV export of user data

**TypeScript Interface**:
```typescript
interface UserDataExport {
  exportMetadata: {
    exportDate: string;        // ISO 8601: "2025-10-21T14:30:00Z"
    exportVersion: string;     // API version: "1.0"
    userId: string;            // User email
  };
  
  user: {
    email: string;
    registeredAt: string;      // ISO 8601
  };
  
  settings: {
    autoNewReview: number;     // 0 = no, 1 = random, 2 = frequent, 3 = fifo
    dailyNewReviewCount: number;
    updatedAt: string;         // ISO 8601
  };
  
  wordbook: Array<{
    id: string;                // UUID
    wordId: string;            // Foreign key to Word table
    lemma: string;             // Denormalized for export convenience
    partOfSpeech: string | null;
    passiveReviewCount: number;
    nextPassiveReviewTime: string | null;  // ISO 8601 or null if -1
    activeReviewCount: number;
    nextActiveReviewTime: string | null;   // ISO 8601 or null if -1
    addedAt: string;           // ISO 8601 (from update_time)
  }>;
}
```

**SQL Query**:
```sql
-- Get user settings
SELECT 
  user_email,
  auto_new_review,
  daily_new_review_count,
  update_time
FROM UserSettings
WHERE user_email = ?;

-- Get wordbook with word details
SELECT 
  wbe.id,
  wbe.word_id,
  w.lemma,
  w.part_of_speech,
  wbe.passive_review_count,
  wbe.next_passive_review_time,
  wbe.active_review_count,
  wbe.next_active_review_time,
  wbe.update_time
FROM WordBookEntry wbe
JOIN Word w ON wbe.word_id = w.id
WHERE wbe.user_email = ? 
  AND wbe.deleted = FALSE
ORDER BY wbe.update_time DESC;
```

**CSV Export Format**:
```csv
Section,Field,Value
metadata,exportDate,2025-10-21T14:30:00Z
metadata,userId,user@example.com
user,email,user@example.com
user,registeredAt,2025-01-15T10:00:00Z
settings,autoNewReview,2
settings,dailyNewReviewCount,10
wordbook,id,abc-123
wordbook,lemma,hej
wordbook,partOfSpeech,interjection
wordbook,passiveReviewCount,5
...
```

Alternative flat CSV (one row per wordbook entry):
```csv
UserEmail,AutoNewReview,DailyCount,WordId,Lemma,POS,PassiveCount,NextPassive,ActiveCount,NextActive,AddedAt
user@example.com,2,10,word-123,hej,interjection,5,2025-11-01T00:00:00Z,3,2025-10-25T00:00:00Z,2025-01-20T12:00:00Z
```

---

### 3. DeletionLog (Optional - Not Implemented)

**Note**: Per research decision, we are NOT implementing audit logs. This entity is documented for reference only.

If compliance requires deletion audit trail (not currently needed for solo project):

```typescript
interface DeletionLog {
  id: string;                  // UUID
  userEmail: string;
  deletionRequestedAt: number; // Unix timestamp
  deletionCompletedAt: number; // Unix timestamp
  recordsDeleted: {
    userSettings: number;      // Count
    wordBookEntries: number;   // Count
    sessions: number;          // Count
  };
}
```

**Current Decision**: User account deletion is immediate and final. No server-side log kept (GDPR doesn't require audit logs for deletions, only that deletions are executed).

---

## Relationships

```
UserSettings (D1) ← user_email → WordBookEntry (D1) → word_id → Word (D1)

[User Deletion Flow - Simple!]
DELETE UserSettings WHERE user_email = ?    -- Consent removal (implicit)
DELETE WordBookEntry WHERE user_email = ?   -- User data removal
(Sessions deleted if tracked in DB)
```

**Note**: Consent is implicit via UserSettings existence. No separate consent table = simpler design.

---

## Data Operations

### Check Consent (Implicit)
```typescript
// Client-side: Show banner if not logged in
if (!userEmail) {
  // Show consent banner before login
}

// Server-side: Check if user has account (= consented)
const settings = await db.prepare(
  'SELECT user_email FROM UserSettings WHERE user_email = ?'
).bind(userEmail).first();

if (!settings) {
  // User hasn't consented yet (no account)
  // This should never happen if auth works correctly
}
```

### Export User Data
```typescript
// Server-side (D1)
const settings = await db.prepare(
  'SELECT * FROM UserSettings WHERE user_email = ?'
).bind(userEmail).first();

const wordbook = await db.prepare(`
  SELECT wbe.*, w.lemma, w.part_of_speech
  FROM WordBookEntry wbe
  JOIN Word w ON wbe.word_id = w.id
  WHERE wbe.user_email = ? AND wbe.deleted = FALSE
`).bind(userEmail).all();

return {
  exportMetadata: { /* ... */ },
  user: { email: userEmail, registeredAt: /* ... */ },
  settings: { /* ... */ },
  wordbook: wordbook.results.map(/* transform */)
};
```

### Delete User Data
```typescript
// Server-side (D1 transaction) - Simple!
await db.batch([
  db.prepare('DELETE FROM WordBookEntry WHERE user_email = ?').bind(userEmail),
  db.prepare('DELETE FROM UserSettings WHERE user_email = ?').bind(userEmail),
  // Sessions deleted if applicable
]);
// No separate consent table to delete!
```

---

## Migration Plan

### No Migration Needed! 🎉

**Reason**: Consent is implicit via existing `UserSettings` table. No new tables required.

**Existing Schema** (already sufficient):
```sql
-- From migrations/0001_init.sql
CREATE TABLE UserSettings (
    user_email VARCHAR(255) PRIMARY KEY,
    auto_new_review INTEGER NOT NULL DEFAULT 2,
    daily_new_review_count INTEGER NOT NULL DEFAULT 10,
    update_time INTEGER NOT NULL
);
```

**Consent Logic**:
- User sees banner before login → clicks "Accept" → proceeds to OAuth
- OAuth completes → backend creates `UserSettings` record → consent implicit
- Deletion: Remove `UserSettings` = remove consent + all data

---

## Validation & Constraints

### Export Data Validation
```typescript
function validateExportData(data: UserDataExport): string[] {
  const errors: string[] = [];
  
  if (!data.user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.user.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.settings.autoNewReview < 0 || data.settings.autoNewReview > 3) {
    errors.push('autoNewReview must be 0-3');
  }
  
  if (data.settings.dailyNewReviewCount < 0) {
    errors.push('dailyNewReviewCount must be non-negative');
  }
  
  data.wordbook.forEach((entry, index) => {
    if (!entry.id || !entry.wordId) {
      errors.push(`Wordbook entry ${index} missing required IDs`);
    }
  });
  
  return errors;
}
```

---

## Performance Considerations

### Index Strategy
- `UserSettings.user_email`: Primary key (automatic index) - doubles as consent check
- `WordBookEntry.user_email`: Already indexed (existing schema)

### Query Optimization
- **Export**: Single JOIN query (WordBookEntry + Word) vs N+1 queries - uses existing indexes
- **Deletion**: Batch 2 DELETE statements in transaction - uses primary key lookups (no separate consent table!)
- **Consent Check**: Client-side auth check (O(1)) - logged in = consented

### Estimated Query Times (D1)
- Consent check (auth state): <1ms (no DB query)
- Export (100 wordbook entries): ~50-100ms
- Export (1000 entries): ~150-200ms
- Deletion (all user data): ~50-100ms (2 DELETE statements vs 3)

---

## Test Data

### Sample UserDataExport (JSON)
```json
{
  "exportMetadata": {
    "exportDate": "2025-10-21T14:30:00Z",
    "exportVersion": "1.0",
    "userId": "user@example.com"
  },
  "user": {
    "email": "user@example.com",
    "registeredAt": "2025-01-15T10:00:00Z"
  },
  "settings": {
    "autoNewReview": 2,
    "dailyNewReviewCount": 10,
    "updatedAt": "2025-10-20T08:00:00Z"
  },
  "wordbook": [
    {
      "id": "abc-123",
      "wordId": "word-456",
      "lemma": "hej",
      "partOfSpeech": "interjection",
      "passiveReviewCount": 5,
      "nextPassiveReviewTime": "2025-11-01T00:00:00Z",
      "activeReviewCount": 3,
      "nextActiveReviewTime": "2025-10-25T00:00:00Z",
      "addedAt": "2025-01-20T12:00:00Z"
    }
  ]
}
```

---

**Data Model Complete** ✅  
**Ready for Phase 1: Contracts**
