# Research: DeepL Free API Integration for Active Review

**Feature**: DeepL Free API Integration for Active Review  
**Date**: 7 oktober 2025  
**Status**: Complete

## Research Questions

### 1. DeepL API Integration for Cloudflare Workers Environment

**Decision**: Use DeepL REST API with native fetch() in Cloudflare Workers

**Rationale**: 
- DeepL Free API provides high-quality translations for Swedish → English
- REST API is simpler than SDK for serverless environment
- Cloudflare Workers have built-in fetch() with good performance
- No need for complex SDK overhead in serverless functions
- API key authentication is straightforward

**Alternatives considered**:
- DeepL Node.js SDK: Rejected due to potential bundle size and dependency issues in Workers
- Google Translate API: Rejected due to cost and billing complexity
- Local translation models: Rejected due to performance and accuracy concerns

**Implementation approach**:
```typescript
// Simple fetch-based integration
const response = await fetch('https://api-free.deepl.com/v2/translate', {
  method: 'POST',
  headers: {
    'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    text: swedishText,
    source_lang: 'SV',
    target_lang: 'EN'
  })
});
```

### 2. Translation Caching Strategies for D1/IndexedDB

**Decision**: Hash-based caching with dual storage (D1 + IndexedDB)

**Rationale**:
- Use SHA-256 hash of Swedish text as cache key for deterministic lookups
- Store in D1 for persistence and cross-user sharing
- Sync to IndexedDB for offline access and fast local retrieval
- Prevents duplicate translations across users
- Reduces API usage and costs

**Alternatives considered**:
- Full-text caching: Rejected due to potential storage inefficiency
- User-specific caching: Rejected to avoid duplicate translations
- Memory-only caching: Rejected due to serverless function limitations

**Schema design**:
```sql
CREATE TABLE TranslationCache (
    id CHAR(36) PRIMARY KEY,
    source_text_hash CHAR(64) UNIQUE NOT NULL,
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_lang CHAR(2) NOT NULL DEFAULT 'SV',
    target_lang CHAR(2) NOT NULL DEFAULT 'EN',
    character_count INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    update_time INTEGER NOT NULL
);
```

### 3. Graceful Degradation Patterns for External API Dependencies

**Decision**: Circuit breaker pattern with graceful fallback

**Rationale**:
- Maintain user experience when DeepL API is unavailable
- Prevent cascading failures in active review flow
- Allow users to continue with Swedish-only examples
- Log failures for monitoring without blocking functionality

**Alternatives considered**:
- Retry with exponential backoff: Rejected due to potential user experience delays
- Alternative translation services: Rejected to avoid complexity
- Blocking behavior: Rejected due to poor user experience

**Implementation pattern**:
```typescript
async function translateWithFallback(text: string): Promise<string | null> {
  try {
    return await translateText(text);
  } catch (error) {
    logTranslationFailure(error);
    return null; // Graceful fallback to Swedish-only
  }
}
```

### 4. Character Usage Tracking for API Quota Management

**Decision**: Monthly usage tracking with buffer management

**Rationale**:
- Track character consumption to stay within 500,000/month limit
- Implement 90% threshold warning (450,000 characters)
- Stop translations at 95% threshold (475,000 characters) to prevent overages
- Reset tracking on the 1st of each month
- Buffer prevents accidental quota violations

**Alternatives considered**:
- Real-time quota checking: Rejected due to API call overhead
- Daily limits: Rejected as monthly limit is more flexible
- No tracking: Rejected due to potential quota violations

**Tracking schema**:
```sql
CREATE TABLE UsageTracking (
    id CHAR(36) PRIMARY KEY,
    month_year CHAR(7) NOT NULL, -- Format: 2025-10
    character_count INTEGER NOT NULL DEFAULT 0,
    translation_count INTEGER NOT NULL DEFAULT 0,
    last_reset INTEGER NOT NULL,
    update_time INTEGER NOT NULL
);
```

## Technology Stack Decisions

### API Framework
- **Selected**: Extend existing Cloudflare Workers API structure
- **Rationale**: Consistent with existing architecture, serverless scaling

### Database Integration
- **Selected**: Extend existing D1 migration system
- **Rationale**: Leverages existing infrastructure, maintains consistency

### Frontend Integration
- **Selected**: Enhance existing SentenceConstructionCard component
- **Rationale**: Minimal UI changes, reuses existing patterns

### Testing Strategy
- **Selected**: Extend existing Vitest test suite
- **Rationale**: Consistent testing approach, TDD compliance

## Performance Considerations

### Response Time Targets
- **Cached translations**: <500ms (IndexedDB lookup)
- **New translations**: <5s (DeepL API + DB write)
- **Fallback scenarios**: <100ms (immediate return)

### Caching Strategy
- **L1 Cache**: IndexedDB (offline, fast local access)
- **L2 Cache**: D1 Database (persistent, cross-user sharing)
- **Cache invalidation**: Not needed (translations are immutable)

### Rate Limiting
- **DeepL API**: Built-in rate limiting by service
- **Character limits**: Application-level tracking and throttling
- **Request batching**: Not implemented initially (YAGNI)

## Security Considerations

### API Key Management
- **Storage**: Cloudflare Workers environment variables
- **Access**: Server-side only, never exposed to frontend
- **Rotation**: Manual process through Cloudflare dashboard

### Data Privacy
- **Translation storage**: Anonymized (no user association in cache)
- **Logging**: No sensitive data in logs
- **Retention**: Indefinite (translations are reusable)

## Integration Points

### Existing Codebase
1. **createSentenceProblem.ts**: Enhance to check for and use translations
2. **SentenceConstructionCard.tsx**: Display English meaning when available
3. **API Router**: Add new translation endpoints
4. **Database migrations**: Add translation cache table

### External Services
1. **DeepL Free API**: Primary translation service
2. **Cloudflare D1**: Translation cache storage
3. **IndexedDB**: Client-side cache storage

## Risk Mitigation

### API Quota Exhaustion
- **Mitigation**: Character usage tracking with 90% threshold
- **Fallback**: Graceful degradation to Swedish-only examples

### API Service Downtime
- **Mitigation**: Circuit breaker pattern with immediate fallback
- **Recovery**: Automatic retry on next translation request

### Translation Quality Issues
- **Mitigation**: Basic validation (character limits, language detection)
- **Monitoring**: Log translation requests and responses for quality review

## Conclusion

The research confirms that DeepL Free API integration is feasible within the existing Läss architecture. The solution leverages existing patterns and infrastructure while providing clear value to Swedish language learners. All technical decisions align with the constitutional principles of simplicity, performance, and local-first design.

**Ready for Phase 1**: Design & Contracts