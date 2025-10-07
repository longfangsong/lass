# Quickstart: DeepL Free API Integration for Active Review

**Feature**: DeepL Free API Integration for Active Review  
**Date**: 7 oktober 2025  
**Purpose**: Validate the complete translation feature through end-to-end scenarios

## Prerequisites

### Environment Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Apply database migrations
npx wrangler d1 migrations apply DB --local

# 3. Set up DeepL API key (create .dev.vars file)
echo "DEEPL_API_KEY=your-deepl-api-key-here" > .dev.vars

# 4. Start development server
pnpm run dev
```

### Test Data Setup
```bash
# Add Swedish-only lexeme entries for testing
# This will be automated in the test setup
```

## Validation Scenarios

### Scenario 1: Fill Missing Example Meanings for a Word

**Goal**: Verify that lexemes with Swedish examples get English translations

**Steps**:
1. Start development server: `pnpm run dev`
2. Find a lexeme that has `example` but no `example_meaning`
3. Call the PATCH endpoint with `fill_example_meaning=1` parameter
4. Verify that the `example_meaning` field is populated
5. Test with lexemes that already have `example_meaning` (should not change)

**Expected Results**:
- ✅ All lexemes with missing `example_meaning` are processed
- ✅ Swedish examples are translated to English
- ✅ Database is updated with new `example_meaning` values
**Expected Results**:
- ✅ Lexeme with missing `example_meaning` is processed
- ✅ Swedish example is translated to English
- ✅ Database is updated with new `example_meaning` value
- ✅ API returns updated lexeme with all fields
- ✅ No errors in response
- ✅ Character usage is tracked accurately

**Test Commands**:
```bash
# Find a lexeme with missing example meaning (replace with actual lexeme_id)
LEXEME_ID="your-lexeme-id-here"

# Trigger translation for that lexeme
curl -X PATCH "http://localhost:8787/api/lexemes/$LEXEME_ID?fill_example_meaning=1" \
  -H "Content-Type: application/json"

# Verify the lexeme now has example_meaning
curl "http://localhost:8787/api/lexemes/$LEXEME_ID"
```

### Scenario 2: API Failure Graceful Degradation

**Goal**: Verify system handles DeepL API failures gracefully

**Steps**:
1. Temporarily set invalid API key: `DEEPL_API_KEY=invalid-key`
2. Restart development server
3. Navigate to active review with Swedish-only example
4. Verify the exercise still works without translation
5. Check that Swedish text is still displayed
6. Restore valid API key and verify recovery

**Expected Results**:
- ✅ Exercise continues to function normally
- ✅ Swedish text displayed without English translation
- ✅ No error messages shown to user
- ✅ User can complete sentence construction
- ✅ System recovers when API key is restored
- ✅ Error logged for monitoring

**Test Commands**:
```bash
# Test with invalid key - individual lexeme
LEXEME_ID="test-lexeme-id"
DEEPL_API_KEY=invalid curl -X PATCH "http://localhost:8787/api/lexemes/$LEXEME_ID?fill_example_meaning=1" \
  -H "Content-Type: application/json"

# Should return the lexeme unchanged with graceful failure
```

### Scenario 3: Quota Management

**Goal**: Verify character quota tracking and throttling

**Steps**:
1. Check current usage: `curl http://localhost:8787/api/translate/usage`
2. Make several translation requests to increase usage
3. Verify character counts increment correctly
4. Test approaching quota thresholds (90%, 95%)
5. Verify throttling behavior at quota limit

**Expected Results**:
- ✅ Usage statistics accurate and up-to-date
- ✅ Character counts match request sizes
- ✅ Throttling activates at 95% quota usage
- ✅ Throttled requests return null with error message
- ✅ User experience remains smooth during throttling

**Test Commands**:
```bash
# Check usage before
curl http://localhost:8787/api/translate/usage

# Make multiple lexeme update requests
for i in {1..5}; do
  LEXEME_ID="test-lexeme-$i"
  curl -X PATCH "http://localhost:8787/api/lexemes/$LEXEME_ID?fill_example_meaning=1" \
    -H "Content-Type: application/json"
done

# Check usage after
curl http://localhost:8787/api/translate/usage
```

### Scenario 4: Offline Functionality

**Goal**: Verify cached translations work offline

**Steps**:
1. Complete Scenario 1 to populate lexeme with translations
2. Disconnect network/stop development server
3. Open browser DevTools → Application → Storage
4. Verify lexeme data exists in IndexedDB
5. Navigate to active review exercise using cached lexeme
6. Verify translation appears from cached data
7. Reconnect network and verify sync works

**Expected Results**:
- ✅ Cached lexeme data available in IndexedDB
- ✅ Offline active review works with cached lexeme translations
- ✅ No network errors affect user experience
- ✅ Sync resumes when network restored
- ✅ New lexeme updates saved when back online

**Test Commands**:
```bash
# Check IndexedDB in browser console
// Open DevTools → Console
const db = new Dexie('LassDatabase');
await db.open();
const lexemes = await db.lexemes.toArray();
const lexemesWithTranslations = lexemes.filter(l => l.example && l.example_meaning);
console.log('Lexemes with translations:', lexemesWithTranslations);
```

### Scenario 5: End-to-End Active Review Flow

**Goal**: Complete user journey with enhanced lexeme data

**Steps**:
1. Use PATCH endpoint to fill translations for lexemes used in active review
2. Log in to Läss application  
3. Navigate to Wordbook → Review
4. Start active review session
5. Find exercise that previously had Swedish-only examples
6. Verify English translations now appear automatically
7. Complete sentence construction exercise
8. Verify learning experience is improved

**Expected Results**:
- ✅ Previously Swedish-only examples now have English meanings
- ✅ Sentence construction exercises are easier to understand
- ✅ Review scoring unaffected by translation enhancement
- ✅ Feature enhances learning experience without breaking existing flow
- ✅ Performance impact minimal (translations pre-computed)

## Performance Validation

### Response Time Targets
- **Cached translations**: <500ms (measured in browser DevTools)
- **New translations**: <5 seconds (measured from request to display)
- **Usage statistics**: <200ms (API response time)
- **Database operations**: <100ms (local operations)

### Load Testing (Optional)
```bash
# Stress test translation API with multiple lexemes
for i in {1..20}; do
  LEXEME_ID="stress-test-lexeme-$i"
  curl -X PATCH "http://localhost:8787/api/lexemes/$LEXEME_ID?fill_example_meaning=1" \
    -H "Content-Type: application/json" &
done
wait

# Check all completed successfully
curl http://localhost:8787/api/translate/usage
```

## Data Validation

### Database Integrity
```sql
-- Check lexemes with translations
SELECT COUNT(*) as total_lexemes FROM Lexeme;
SELECT COUNT(*) as lexemes_with_examples FROM Lexeme WHERE example IS NOT NULL;
SELECT COUNT(*) as lexemes_with_translations FROM Lexeme WHERE example_meaning IS NOT NULL;

-- Check usage tracking
SELECT * FROM UsageTracking ORDER BY month_year DESC LIMIT 3;
```

### IndexedDB Sync Validation
```javascript
// Browser console validation
const db = new Dexie('LassDatabase');
await db.open();

// Check sync status
const localLexemes = await db.lexemes.where('example_meaning').above('').count();
const remoteUsage = await fetch('/api/translate/usage').then(r => r.json());
console.log('Local lexemes with translations:', localLexemes, 'Remote usage:', remoteUsage.translation_count);
```

## Troubleshooting

### Common Issues

**Translation not appearing**:
1. Check console for errors
2. Verify DeepL API key in `.dev.vars`
3. Check network connectivity
4. Verify Swedish text contains valid characters

**Slow responses**:
1. Check DeepL API status
2. Verify database connections
3. Clear IndexedDB cache if corrupted
4. Restart development server

**Cache misses**:
1. Verify hash generation consistency
2. Check database migration applied
3. Ensure IndexedDB permissions granted
4. Check browser storage limits

### Debug Commands
```bash
# Check API status
curl http://localhost:8787/api/ping

# Verify database schema
npx wrangler d1 execute DB --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check translation enhancement on lexemes
npx wrangler d1 execute DB --local --command="SELECT COUNT(*) FROM Lexeme WHERE example_meaning IS NOT NULL;"

# View recent lexeme updates
npx wrangler d1 execute DB --local --command="SELECT id, example, example_meaning, update_time FROM Lexeme WHERE example_meaning IS NOT NULL ORDER BY update_time DESC LIMIT 5;"
```

## Success Criteria

All scenarios must pass with the following criteria:

### Functional Requirements Validation
- ✅ **FR-001**: System detects Swedish-only examples ✓
- ✅ **FR-002**: Automatic translation requests ✓  
- ✅ **FR-003**: Translations stored permanently ✓
- ✅ **FR-004**: Cached translations served quickly ✓
- ✅ **FR-005**: Graceful degradation when API unavailable ✓
- ✅ **FR-006**: Translations within 5 seconds ✓
- ✅ **FR-007**: Usage tracking functional ✓
- ✅ **FR-008**: Quota management working ✓
- ✅ **FR-009**: Active reviews work with/without translations ✓
- ✅ **FR-010**: Translation validation (500 char limit) ✓

### Performance Requirements
- ✅ Response times meet targets
- ✅ Offline functionality works
- ✅ Database sync reliable
- ✅ No user experience degradation

### Integration Requirements  
- ✅ Works with existing active review flow
- ✅ Constitutional principles maintained
- ✅ PWA functionality preserved
- ✅ Testing coverage complete

## Post-Validation Steps

After successful validation:
1. Commit all changes to feature branch
2. Create pull request for code review
3. Deploy to staging environment
4. Run full test suite: `pnpm run test`
5. Validate production deployment
6. Monitor usage and performance metrics
7. Document lessons learned

## Monitoring & Maintenance

### Key Metrics to Track
- Translation request volume
- Cache hit ratio
- API response times  
- Character usage trends
- Error rates and types
- User adoption metrics

### Monthly Maintenance
- Review usage statistics
- Check quota consumption trends
- Validate cache performance
- Update translation quality if needed
- Monitor DeepL API changes

This quickstart guide ensures the translation feature is properly validated before production deployment and provides clear success criteria for all stakeholders.