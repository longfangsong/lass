# Läss - Swedish Learning Platform

Läss is a local first Progressive Web App (PWA) for learning Swedish, built with React + TypeScript + Vite, deployed on Cloudflare Workers/Pages with D1 database. It includes a dictionary, articles, word review system, and spaced repetition learning.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository
- Install pnpm globally: `npm install -g pnpm`
- Install dependencies: `pnpm install` -- takes 30 seconds. NEVER CANCEL.
- Build the project: `pnpm run build` -- takes 20 seconds.
- Run tests: `pnpm run test` -- takes 5 seconds.
- Lint code: `pnpm run lint` -- takes 5 seconds.

### Database Setup (Local Development)
- Apply migrations: `npx wrangler d1 migrations apply DB --local` -- creates local database
- Set up DeepL API key: Create `.dev.vars` file with `DEEPL_API_KEY=your-key-here`

### Development and Preview
- Development server: `pnpm run dev` -- starts on http://localhost:5173. NEVER CANCEL. Cloudflare connectivity warnings are expected locally.
- Production preview: `pnpm run preview` -- builds then serves on http://localhost:4173. Takes 30+ seconds total.
- Generate PWA assets: `pnpm run generate-pwa-assets`
- Generate Cloudflare types: `pnpm run cf-typegen`

### Deployment Commands
- Deploy to Cloudflare: `pnpm run deploy` -- builds and deploys with wrangler. NEVER CANCEL.

## Validation

### ⚠️ IMPORTANT: Do NOT run tests or builds automatically
- **NEVER** run `pnpm run build`, `pnpm run test`, `pnpm run lint`, or `pnpm run dev` unless the user explicitly asks
- **NEVER** start the development server automatically
- Only suggest validation steps to the user - let them decide when to run commands
- Focus on making code changes and explaining what validation the user should perform

### Validation steps (to suggest to user, not to run automatically):
1. **Build Validation**: User should run `pnpm run build` after code changes
2. **Test Suite**: User should run `pnpm run test` to ensure 31+ tests pass
3. **Development Server**: User should start `pnpm run dev` and verify it loads on localhost:5173
4. **UI Navigation**: User should test all main pages:
   - Home page: http://localhost:5173/
   - Dictionary: http://localhost:5173/dictionary (should show download progress)
   - Articles: http://localhost:5173/articles (should show pagination)
   - Auth pages work but require external providers
5. **Code Quality**: User should run `pnpm run lint` before committing

### Manual Testing Requirements (for user to perform)
- Test the complete user flow after making changes
- Verify the PWA loads and navigates correctly
- Test dictionary search functionality (may require network access)
- Ensure dark/light theme toggle works
- Verify responsive design on different screen sizes

## Common Tasks

### Development Workflow
- Always run `pnpm run lint` and `pnpm run build` before committing changes
- The app uses IndexedDB (Dexie) for local storage and syncs with Cloudflare D1

### Key Directories and Files

```
├── src/
│   ├── api/                    # Cloudflare Workers API routes
│   ├── app/
│   │   └── .../                   # A speicific bounded context
│   │       ├── domain/            # Business logic and models
│   │       ├── application/       # Application services
│   │       ├── infrastructure/    # Database and external services
│   │       └── presentation/      # React components and pages
│   └── types.ts               # TypeScript type definitions
├── migrations/                # D1 database migrations
├── data/dictionary.sql        # Dictionary data (large file ~15MB)
├── scripts/
│   ├── fetch_meanings/       # Dictionary data scraping (reference only)
│   └── dump_dictionary/      # Database export utilities
├── wrangler.toml             # Cloudflare Workers configuration
├── vite.config.ts            # Vite build configuration
└── package.json              # Dependencies and scripts
```

### File Structure Output (Repository Root)
```
.git/
.github/
.gitignore
README.md
components.json
cron/
data/
eslint.config.js
index.html
migrations/
package.json
pnpm-lock.yaml
public/
pwa-assets.config.ts
scripts/
src/
tsconfig.*.json
vite.config.ts
worker-configuration.d.ts
wrangler.toml
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",                    // Development server
    "build": "tsc -b && vite build", // Production build
    "lint": "eslint .",               // Code linting
    "preview": "pnpm run build && vite preview", // Preview build
    "deploy": "pnpm run build && wrangler deploy", // Deploy to Cloudflare
    "cf-typegen": "wrangler types",   // Generate Cloudflare types
    "generate-pwa-assets": "pwa-assets-generator", // Generate PWA icons
    "test": "vitest"                  // Run test suite
  }
}
```

## Known Issues and Limitations

### Dependencies
- Uses pnpm for package management (required - npm/yarn will not work correctly)
- Node.js 20+ required
- TypeScript strict mode enabled
- React 19 with Vite for HMR

## Architecture Notes

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Cloudflare Workers (serverless functions)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Storage**: IndexedDB (via Dexie) for offline functionality
- **Deployment**: Cloudflare Pages + Workers
- **Testing**: Vitest
- **PWA**: Service Worker + Web App Manifest

### Key Features
- Offline-first dictionary with 100k+ Swedish words
- Spaced repetition wordbook system
- Audio pronunciation support
- Swedish news articles with word highlighting
- OAuth authentication (GitHub, Google)
- Responsive PWA design
- Dark/light theme support
- **NEW**: DeepL Free API integration for Swedish→English translation in active review

### Recent Changes (Last 3 Features)
1. **GDPR Compliance** (Oct 2025): Privacy consent banner, user data export (JSON/CSV), and account deletion. Global compliance (not EU-only) with immediate operations. Includes consent tracking in IndexedDB+D1, Privacy API endpoints, and Settings panel UI. Located in `src/api/privacy/`, `src/app/settings/` with UserConsent table.

2. **DeepL Translation Integration** (Oct 2025): Automatic Swedish→English translation for active review exercises using DeepL Free API. Includes translation caching, usage quota tracking, and graceful degradation. Located in `src/api/translate/` and extends wordbook domain.

3. Previous features...

### GDPR Compliance Context
- **Purpose**: Provide users with transparency, data portability, and erasure rights per GDPR
- **Scope**: Global (all users get GDPR protections, not just EU)
- **Consent**: Banner shown before login (client-side only). Creating account = consent implicit. No separate consent API/table!
- **Data Export**: Add `?format=json|csv` parameter to existing GET endpoints for data export
- **Data Deletion**: Use existing DELETE endpoints with confirmation phrase for GDPR compliance
- **Privacy API Endpoints** (extends existing resources):
  - GET /api/settings?format=json|csv - Export user settings
  - DELETE /api/settings - Delete user settings (account deletion, requires confirmation)
  - GET /api/word_book_entry?format=csv - Export wordbook entries
  - DELETE /api/word_book_entry - Delete all wordbook entries (requires confirmation)
  - GET /api/settings/data-summary - View data summary for settings panel
- **Key files**:
  - `src/api/settings/` - Settings API (extended with export format param and DELETE)
  - `src/api/word_book_entry/` - Wordbook API (extended with export format param and DELETE)
  - `src/app/settings/presentation/` - Privacy panel UI (Accordion in Settings page)
  - `src/app/shared/presentation/ConsentBanner.tsx` - Pre-login consent banner (client-side, no API)
- **Note**: RESTful design - no `/api/privacy` namespace, just extend existing resource endpoints!

### Translation Feature Context
- **Purpose**: Translate Swedish example sentences to English during active review when only Swedish examples are available
- **API**: DeepL Free API (500k chars/month limit) with hash-based caching
- **Storage**: TranslationCache and UsageTracking tables in D1, synced to IndexedDB
- **Integration**: Extends `createSentenceProblem.ts` and `SentenceConstructionCard.tsx`
- **Graceful degradation**: Falls back to Swedish-only display if API fails
- **Key files**: 
  - `src/api/translate/` - Translation API endpoints
  - `src/app/wordbook/domain/` - Translation models and services
  - `migrations/0002_add_translation_cache.sql` - Database schema

## Troubleshooting

### Build Failures
- Ensure TypeScript files pass type checking with `tsc -b`
- Verify all dependencies are installed with `pnpm install`

### Development Server Issues
- Port 5173 conflicts: Kill existing processes or use `--port` flag
- Cloudflare Workers integration warnings are expected in development
- Database queries may fail without proper local D1 setup

### Database Issues
- Use `npx wrangler d1 migrations apply DB --local` to set up local database
- Skip large dictionary import locally - app will download data as needed
- For remote database access, ensure wrangler.toml has correct D1 database configuration
