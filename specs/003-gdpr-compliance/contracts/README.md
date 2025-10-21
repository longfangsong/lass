# API Contracts: GDPR Privacy API

**Date**: 2025-10-21  
**Status**: Complete

## Overview

This directory contains OpenAPI 3.0 specifications for the GDPR Privacy API endpoints.

---

## Files

- **privacy-api.yaml**: OpenAPI specification for GDPR-compliant data operations
  - GET /api/settings?format=json|csv - Retrieve or export settings
  - DELETE /api/settings - Delete user settings (account deletion)
  - GET /api/word_book_entry?format=json|csv - Retrieve or export wordbook entries  
  - DELETE /api/word_book_entry - Delete all wordbook entries

**Note**: Uses existing REST resources with optional `format` parameter for exports.  
**Note**: No separate `/api/privacy` namespace - extends existing endpoints.

---

## Usage

### Viewing the Specification

1. **Swagger Editor**: 
   ```bash
   # Visit https://editor.swagger.io/
   # Copy-paste privacy-api.yaml content
   ```

2. **Redoc** (better UI):
   ```bash
   npx @redocly/cli preview-docs specs/003-gdpr-compliance/contracts/privacy-api.yaml
   ```

3. **VS Code Extension**:
   Install "OpenAPI (Swagger) Editor" extension and open privacy-api.yaml

---

## Contract Testing

Contract tests will be generated from this specification in Phase 3.

**Test File**: `tests/contract/privacy-api.test.ts`

**Test Strategy**:
1. **Schema Validation**: Validate all request/response schemas using JSON Schema
2. **Status Codes**: Assert correct HTTP status codes for each scenario
3. **Headers**: Verify Content-Disposition, Content-Type headers
4. **Error Handling**: Test all error responses (400, 401, 500)
5. **Authentication**: Test with/without auth cookies
6. **Edge Cases**: Empty wordbook, large exports (>1000 entries)

---

## Implementation Notes

### Authentication
- **Cookie-based**: JWT token in `auth_token` httpOnly cookie
- **No CORS**: Same-origin requests only (app and API same domain)
- **Consent implicit**: Having an account (UserSettings record) = consented

### Response Format
All responses follow consistent structure:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { /* ... */ }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error",
    "details": { /* optional */ }
  }
}
```

### Performance Targets
- **GET /settings?format=json** - <50ms (single row query)
- **GET /word_book_entry?format=csv** - <200ms for typical users (<1000 entries)
- **DELETE /settings** - <100ms (single DELETE statement)
- **DELETE /word_book_entry** - <500ms (bulk DELETE with WHERE clause)
- **GET /settings/data-summary** - <100ms (lightweight COUNT queries)

### Security Considerations
1. **CSRF Protection**: Not needed (cookie-based auth + same-origin)
2. **Rate Limiting**: Consider adding for export endpoint (prevent abuse)
3. **Input Validation**: All request bodies validated against schemas
4. **SQL Injection**: Prevented by D1 prepared statements
5. **XSS**: JSON responses only, no HTML rendering

---

## Examples

### Consent Banner (Client-Side Only)
```tsx
// User sees banner before login
<ConsentBanner>
  <p>We collect your email and learning progress to provide sync.</p>
  <Button onClick={() => window.location.href = '/api/auth/login'}>
    Accept & Login
  </Button>
</ConsentBanner>
```

**Note**: No API call needed. Consent = creating account via OAuth.

### Export User Settings (JSON)
```bash
curl -X GET "http://localhost:8787/api/settings?format=json" \
  -H "Cookie: auth_token=<jwt-token>"
```

Response:
```json
{
  "email": "user@example.com",
  "autoNewReview": 2,
  "dailyNewReviewCount": 10,
  "registeredAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-10-20T08:00:00Z"
}
```

### Export Word Book Entries (CSV)
```bash
curl -X GET "http://localhost:8787/api/word_book_entry?format=csv" \
  -H "Cookie: auth_token=<jwt-token>"
```

Response:
```csv
id,wordId,lemma,partOfSpeech,passiveReviewCount,nextPassiveReviewTime,activeReviewCount,nextActiveReviewTime,addedAt
abc-123,word-456,hej,interjection,5,2025-11-01T00:00:00Z,3,2025-10-25T00:00:00Z,2025-01-20T12:00:00Z
```

### Delete User Settings (Account)
```bash
curl -X DELETE http://localhost:8787/api/settings \
  -H "Cookie: auth_token=<jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmationPhrase": "delete my account"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Settings deleted",
  "data": {
    "deletedAt": "2025-10-21T14:35:00Z",
    "recordsDeleted": 1
  }
}
```

### Delete All Word Book Entries
```bash
curl -X DELETE http://localhost:8787/api/word_book_entry \
  -H "Cookie: auth_token=<jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmationPhrase": "delete my account"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Word book entries deleted",
  "data": {
    "deletedAt": "2025-10-21T14:35:00Z",
    "recordsDeleted": 127
  }
}
```

### View Data Summary
```bash
curl -X GET http://localhost:8787/api/settings/data-summary \
  -H "Cookie: auth_token=<jwt-token>"
```

Response:
```json
{
  "success": true,
  "message": "Data summary retrieved",
  "data": {
    "email": "user@example.com",
    "registeredAt": "2025-01-15T10:00:00Z",
    "wordBookCount": 127,
    "lastActivityAt": "2025-10-20T18:30:00Z",
    "dataSize": {
      "wordbook": "15.2 KB",
      "settings": "0.3 KB",
      "total": "15.5 KB"
    }
  }
}
```

---

## Related Documents

- [Data Model](../data-model.md) - Entity schemas and database structure
- [Feature Specification](../spec.md) - Functional requirements
- [Research](../research.md) - Technical decisions and alternatives
- [Quickstart Guide](../quickstart.md) - User story validation steps

---

**Contracts Complete** ✅  
**Ready for Phase 1: Quickstart Guide**
