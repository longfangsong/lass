# Läss - Swedish Learning Platform

Läss is a Progressive Web App (PWA) for learning Swedish, built with React + TypeScript + Vite, deployed on Cloudflare Workers/Pages with D1 database. It includes a dictionary, articles, word review system, and spaced repetition learning.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository
- Install pnpm globally: `npm install -g pnpm`
- Install dependencies: `pnpm install` -- takes 30 seconds. NEVER CANCEL.
- **IMPORTANT**: The initial build may fail due to import case sensitivity issues. Fix these imports:
  - `src/app/presentation/components/navBar.tsx`: Change `"./modeToggle"` to `"./ModeToggle"`
  - `src/app/presentation/pages/article/article.tsx`: Change `"../../components/word/wordDetail"` to `"../../components/word/WordDetail"` and `"../../components/word/saveToWordBook"` to `"../../components/word/SaveToWordBook"`
  - `src/app/presentation/pages/dictionary.tsx`: Change `"@app/presentation/components/word/wordDetail"` to `"@app/presentation/components/word/WordDetail"` and `"@app/presentation/components/word/saveToWordBook"` to `"@app/presentation/components/word/SaveToWordBook"`
- Build the project: `pnpm run build` -- takes 20 seconds. NEVER CANCEL. Set timeout to 60+ minutes for safety.
- Run tests: `pnpm run test` -- takes 5 seconds. NEVER CANCEL. Set timeout to 30+ minutes.
- Lint code: `pnpm run lint` -- takes 5 seconds. Some UI component warnings are expected and non-blocking.

### Database Setup (Local Development)
- Apply migrations: `npx wrangler d1 migrations apply DB --local` -- creates local database
- **IMPORTANT**: Dictionary import (`npx wrangler d1 execute DB --local --file ./data/dictionary.sql`) fails due to workerd limitations with large SQL files. The app downloads dictionary data dynamically instead.

### Development and Preview
- Development server: `pnpm run dev` -- starts on http://localhost:5173. NEVER CANCEL. Cloudflare connectivity warnings are expected locally.
- Production preview: `pnpm run preview` -- builds then serves on http://localhost:4173. Takes 30+ seconds total.
- Generate PWA assets: `pnpm run generate-pwa-assets`
- Generate Cloudflare types: `pnpm run cf-typegen`

### Deployment Commands
- Deploy to Cloudflare: `pnpm run deploy` -- builds and deploys with wrangler. NEVER CANCEL.

## Validation

### ALWAYS validate changes with these scenarios:
1. **Build Validation**: Always run `pnpm run build` after code changes
2. **Test Suite**: Always run `pnpm run test` to ensure 31+ tests pass
3. **Development Server**: Start `pnpm run dev` and verify it loads on localhost:5173
4. **UI Navigation**: Test all main pages:
   - Home page: http://localhost:5173/
   - Dictionary: http://localhost:5173/dictionary (should show download progress)
   - Articles: http://localhost:5173/articles (should show pagination)
   - Auth pages work but require external providers
5. **Code Quality**: Run `pnpm run lint` before committing (expect some UI component warnings)

### Manual Testing Requirements
- ALWAYS test the complete user flow after making changes
- Verify the PWA loads and navigates correctly
- Test dictionary search functionality (may require network access)
- Ensure dark/light theme toggle works
- Verify responsive design on different screen sizes

## Common Tasks

### Development Workflow
- Always run `pnpm run lint` and `pnpm run build` before committing changes
- File case sensitivity matters: use exact case when importing components (e.g., `ModeToggle.tsx`, not `modeToggle.tsx`)
- The app uses IndexedDB (Dexie) for local storage and syncs with Cloudflare D1

### Key Directories and Files

```
├── src/
│   ├── api/                    # Cloudflare Workers API routes
│   ├── app/
│   │   ├── domain/            # Business logic and models
│   │   ├── application/       # Application services
│   │   ├── infrastructure/    # Database and external services
│   │   └── presentation/      # React components and pages
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

### Import Case Sensitivity Issues (Fresh Clone)
- Initial build fails with "Cannot find module" errors for UI components
- This is due to case-sensitive filesystem imports vs. file naming
- **ALWAYS** fix these imports first before building:
  - Use exact case: `ModeToggle.tsx`, `WordDetail.tsx`, `SaveToWordBook.tsx` 
  - Check all import statements match file case exactly

### Database Import Limitation
- Local dictionary import fails with large SQL files due to workerd internal errors
- Workaround: The application downloads dictionary data dynamically from the server
- For production: Import dictionary.sql directly to remote D1 database via Cloudflare dashboard

### Expected Warnings
- Cloudflare connectivity warnings in development are normal (getaddrinfo ENOTFOUND workers.cloudflare.com)
- ESLint react-refresh warnings on UI components are non-blocking
- PWA service worker is disabled in development mode (use preview for PWA testing)

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

## Troubleshooting

### Build Failures
- Check import case sensitivity (common issue on case-sensitive filesystems)
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