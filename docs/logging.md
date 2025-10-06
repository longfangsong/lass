# Logging System Documentation

The Läss logging system provides module-based logging with environment variable configuration. It supports different runtime environments including Node.js, Cloudflare Workers, and browser/Vite.

## Quick Start

```typescript
import { createLogger, log } from '@/utils/log';

// Use pre-configured loggers
log.auth.info('User authenticated');
log.dictionary.debug('Word lookup', { word: 'hej' });

// Create custom module logger
const emailLog = createLogger('email');
emailLog.warn('Rate limit approaching');
```

## Environment Variables

### Global Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Minimum log level to output | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | Output format | `text` | `text`, `json` |
| `LOG_TIMESTAMP` | Include timestamps | `true` | `true`, `false` |

### Module Filtering

| Variable | Description | Example |
|----------|-------------|---------|
| `LOG_MODULES` | Comma-separated list of modules to enable | `auth,dictionary,sync` |
| `LOG_DISABLE_MODULES` | Comma-separated list of modules to disable | `ui,analytics` |

### Environment-Specific Variables

#### Development (Vite)
Use `VITE_` prefix for browser environment:
```bash
VITE_LOG_LEVEL=debug
VITE_LOG_MODULES=auth,dictionary
VITE_LOG_FORMAT=text
```

#### Production (Cloudflare Workers)
Set in `wrangler.toml` or Cloudflare dashboard:
```toml
[env.production.vars]
LOG_LEVEL = "warn"
LOG_FORMAT = "json"
LOG_DISABLE_MODULES = "ui,debug"
```

#### Node.js Scripts
Standard environment variables:
```bash
export LOG_LEVEL=debug
export LOG_MODULES=dictionary,sync
npm run build
```

## Usage Patterns

### Basic Logging

```typescript
import { createLogger } from '@/utils/log';

const log = createLogger('mymodule');

log.debug('Detailed information', { userId: '123' });
log.info('General information');
log.warn('Warning message');
log.error('Error occurred', new Error('Something failed'));
```

### Child Loggers

```typescript
const syncLog = createLogger('sync');
const wordsSync = syncLog.child('words');
const articlesSync = syncLog.child('articles');

syncLog.info('Starting sync');
wordsSync.debug('Words synced', { count: 100 });
articlesSync.warn('Some articles failed to sync');
```

### Conditional Logging

```typescript
import { isLogEnabled } from '@/utils/log';

const log = createLogger('performance');

if (isLogEnabled('performance', 'debug')) {
  const expensiveData = calculateMetrics();
  log.debug('Performance metrics', expensiveData);
}
```

### Cloudflare Workers

```typescript
// In your worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Configure logging with worker environment
    updateLogConfig(env);
    
    const log = createLogger('api');
    log.info('Request received', { url: request.url });
    
    // ... handle request
  }
};
```

## Pre-configured Loggers

The system provides pre-configured loggers for common modules:

```typescript
import { log } from '@/utils/log';

log.auth      // Authentication & authorization
log.dictionary // Dictionary operations
log.sync      // Data synchronization
log.api       // API requests/responses
log.db        // Database operations
log.article   // Article processing
log.wordbook  // Wordbook/learning features
log.pwa       // PWA/service worker
log.ui        // User interface events
```

## Log Levels

| Level | Numeric | Usage |
|-------|---------|-------|
| `debug` | 0 | Detailed diagnostic information |
| `info` | 1 | General application flow |
| `warn` | 2 | Potentially harmful situations |
| `error` | 3 | Error events |

## Output Formats

### Text Format (Default)
```
[2024-01-15T10:30:45.123Z] [INFO] [auth] User login successful {"userId": "123"}
```

### JSON Format
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "module": "auth",
  "message": "User login successful",
  "data": {"userId": "123"}
}
```

## Configuration Examples

### Development Setup
```bash
# .env.development
VITE_LOG_LEVEL=debug
VITE_LOG_MODULES=auth,dictionary,sync
VITE_LOG_FORMAT=text
VITE_LOG_TIMESTAMP=true
```

### Production Setup
```bash
# Environment variables
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_TIMESTAMP=true
LOG_DISABLE_MODULES=ui,debug,analytics
```

### Testing Setup
```bash
# Minimal logging for tests
LOG_LEVEL=error
LOG_FORMAT=text
LOG_TIMESTAMP=false
```

## Integration with Application Modules

### Dictionary Module
```typescript
// src/app/dictionary/application/DictionaryService.ts
import { log } from '@/utils/log';

export class DictionaryService {
  async searchWord(query: string) {
    log.dictionary.debug('Word search initiated', { query });
    
    try {
      const results = await this.performSearch(query);
      log.dictionary.info('Search completed', { 
        query, 
        resultCount: results.length 
      });
      return results;
    } catch (error) {
      log.dictionary.error('Search failed', error as Error, { query });
      throw error;
    }
  }
}
```

### Auth Module
```typescript
// src/api/auth/session.ts
import { log } from '@/utils/log';

export async function validateSession(token: string) {
  const sessionLog = log.auth.child('session');
  
  sessionLog.debug('Validating session token');
  
  try {
    const session = await verifyToken(token);
    sessionLog.info('Session validated', { userId: session.userId });
    return session;
  } catch (error) {
    sessionLog.warn('Invalid session token', { error: error.message });
    return null;
  }
}
```

## Best Practices

1. **Use appropriate log levels**: Debug for detailed info, info for flow, warn for issues, error for failures
2. **Include context**: Add relevant data objects to help with debugging
3. **Use child loggers**: Create sub-modules for better organization
4. **Check log level**: Use `isLogEnabled()` for expensive operations
5. **Structured data**: Pass objects rather than concatenating strings
6. **Error objects**: Always pass Error instances to `error()` method
7. **Module naming**: Use descriptive, hierarchical module names

## Troubleshooting

### Logs not appearing
1. Check `LOG_LEVEL` is appropriate for your messages
2. Verify module is not in `LOG_DISABLE_MODULES`
3. If using `LOG_MODULES`, ensure your module is included

### Environment variables not working
1. Browser: Use `VITE_LOG_*` prefix
2. Workers: Ensure variables are in `wrangler.toml` or dashboard
3. Node.js: Check environment variables are exported

### Performance issues
1. Use `isLogEnabled()` for expensive debug operations
2. Consider disabling debug logs in production
3. Use appropriate log levels to reduce noise