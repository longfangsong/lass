# Data Model: DeepL Free API Integration for Active Review

**Feature**: DeepL Free API Integration for Active Review  
**Date**: 7 oktober 2025  
**Status**: Complete

## Entity Overview

This feature enhances the existing Lexeme table by filling missing `example_meaning` fields using DeepL Free API. No new database tables are required - we simply populate empty fields in the existing schema.

## Core Entities

### 1. Lexeme (Existing Table - Enhanced)

**Purpose**: Existing table that stores word definitions and examples. We enhance it by populating missing `example_meaning` fields.

**Existing Fields** (from 0001_init.sql):
- `id`: CHAR(36) - UUID primary key
- `word_id`: CHAR(36) - References Word(id)
- `definition`: TEXT - Word definition
- `example`: TEXT - Swedish example sentence (may exist)
- `example_meaning`: TEXT - English translation (may be missing)
- `source`: VARCHAR(16) - Source system (lexin-swe, folkets-lexikon, AI)
- `update_time`: INTEGER - Unix timestamp for sync

**Enhancement Target**:
- Populate `example_meaning` when `example` exists but `example_meaning` is NULL/empty
- Use DeepL Free API to translate Swedish `example` to English `example_meaning`
- Update `update_time` when translation is added

**Validation Rules**:
- `example_meaning`: Maximum 500 characters after translation
- Only translate when `example` exists and `example_meaning` is missing
- Preserve existing `example_meaning` values (don't overwrite)

### 2. TranslationRequest (Runtime Entity - Not Persisted)

**Purpose**: Temporary entity for handling translation requests within API calls.

**Fields**:
- `lexeme_id`: string - ID of lexeme being translated
- `example_text`: string - Swedish text to translate
- `target_lang`: string - Target language (default: 'EN')
- `timestamp`: number - Request timestamp

**Validation Rules**:
- `example_text`: Non-empty, maximum 500 characters
- Response within 5 seconds per API call

### 3. UsageTracking (In-Memory - Optional Persistence)

**Purpose**: Track DeepL API usage to stay within monthly limits. Can be implemented as simple counters.

**Fields**:
- `current_month`: string - Current month (YYYY-MM)
- `character_count`: number - Characters used this month
- `translation_count`: number - Translations made this month
- `last_reset`: number - When counters were last reset

**Implementation Options**:
1. **In-memory only**: Reset on server restart (simple)
2. **Environment variable**: Store in Cloudflare Workers KV (persistent)
3. **Simple table**: Minimal table if persistence needed

## Database Schema (No Changes Required)

```sql
-- No migration needed! 
-- We use the existing Lexeme table from 0001_init.sql

-- Query to find lexemes needing translation:
SELECT id, example FROM Lexeme 
WHERE example IS NOT NULL 
AND example != '' 
AND (example_meaning IS NULL OR example_meaning = '');

-- Update query after translation:
UPDATE Lexeme 
SET example_meaning = ?, update_time = ? 
WHERE id = ?;
```

## TypeScript Type Definitions

```typescript
// Extend existing Lexeme interface (no DB changes)
interface Lexeme {
  id: string;
  word_id: string;
  definition: string;
  example?: string;
  example_meaning?: string;  // This is what we'll populate
  source: string;
  update_time: number;
}

// Translation request/response types (runtime only)
interface TranslationRequest {
  lexeme_id: string;
  example_text: string;
  target_lang?: string;
}

interface TranslationResponse {
  lexeme_id: string;
  original_text: string;
  translated_text: string | null;
  success: boolean;
  character_count: number;
  error?: string;
}

// DeepL API response format
interface DeepLResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

// Simple usage tracking (can be in-memory)
interface UsageStats {
  current_month: string;
  character_count: number;
  translation_count: number;
  quota_remaining: number;
  throttled: boolean;
}
```

## Data Flow

### Translation Process
1. **Find candidates**: Query Lexeme table for records with `example` but no `example_meaning`
2. **Translate**: Call DeepL API for each Swedish example
3. **Update**: Set `example_meaning` field with English translation
4. **Track usage**: Increment character count for quota management

### API Endpoints
- `POST /api/lexemes/{word_id}/translate` - Translate missing meanings for one word
- `POST /api/translate/batch` - Batch process multiple lexemes  
- `GET /api/translate/usage` - Get current usage statistics

## Simplification Benefits

### No Additional Storage
- ✅ Uses existing Lexeme table
- ✅ No database migration required
- ✅ No IndexedDB changes needed
- ✅ Minimal infrastructure impact

### Reduced Complexity
- ✅ No caching infrastructure (DeepL quota is per-month, not per-request)
- ✅ No hash-based cache keys
- ✅ No cache invalidation logic
- ✅ Simple in-memory usage tracking

### Operational Simplicity
- ✅ Direct database updates
- ✅ Idempotent operations (won't overwrite existing translations)
- ✅ Easy to monitor and debug
- ✅ Minimal failure modes

## Usage Quota Management (Simplified)

### In-Memory Tracking
```typescript
// Simple global counter (resets on deploy)
let monthlyUsage = {
  month: new Date().toISOString().slice(0, 7), // "2025-10"
  characters: 0,
  translations: 0
};

function trackUsage(characterCount: number) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (monthlyUsage.month !== currentMonth) {
    monthlyUsage = { month: currentMonth, characters: 0, translations: 0 };
  }
  monthlyUsage.characters += characterCount;
  monthlyUsage.translations += 1;
}

function isQuotaExceeded(): boolean {
  return monthlyUsage.characters > 475000; // 95% of 500k limit
}
```

## Error Handling

### Translation Failures
- DeepL API unavailable → Log error, continue with next lexeme
- Invalid response → Log error, skip translation
- Character limit exceeded → Stop processing, return usage info

### Database Failures  
- Update failure → Log error, continue with next lexeme
- Connection issues → Retry with exponential backoff

## Testing Strategy

### Unit Tests
- Translation service functionality
- Usage quota calculations
- Error handling scenarios
- Input validation

### Integration Tests
- Lexeme table updates
- DeepL API integration
- Batch processing logic
- API endpoint responses

### Contract Tests
- DeepL API request/response validation
- Database update operations
- API endpoint schemas

This simplified data model removes unnecessary complexity while still achieving the core goal of filling missing `example_meaning` fields in the existing Lexeme table.