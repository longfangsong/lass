# Läss Constitution

## Core Principles

### Local-First Architecture

Every feature prioritizes offline functionality; IndexedDB (via Dexie) is used for local storage and syncs with Cloudflare D1; App must work without network access for core features like dictionary search and wordbook reviews.

### PWA-First Design

Built as a Progressive Web App with service workers for offline caching; Responsive design with dark/light theme support; Must pass PWA installation and offline tests.

### Test-Driven Development (NON-NEGOTIABLE)

All code changes require tests using Vitest; Tests must pass before commits; Integration tests for API routes and database interactions; Red-Green-Refactor cycle enforced.

### Simplicity and Performance

Start simple with YAGNI principles; Optimize for fast builds (Vite) and deployments (Cloudflare); Avoid unnecessary complexity; Prefer plain functions and interfaces to classes; Use efficient data structures for 100k+ dictionary entries.

### Domain-Driven Design (DDD) & Bounded Contexts

Adopt DDD principles for both backend and frontend; Organize frontend code by bounded contexts (e.g., dictionary, articles, wordbook) using clear separation of domain, application, infrastructure, and presentation layers; Each context should be independently understandable and maintainable.

## Tech Stack and Constraints

- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Cloudflare Workers (serverless functions)
- Database: Cloudflare D1 (SQLite-compatible)
- Storage: IndexedDB (via Dexie) for offline functionality
- Deployment: Cloudflare Pages + Workers
- Testing: Vitest
- PWA: Service Worker + Web App Manifest
- Package Manager: pnpm


## Development Workflow

1. Setup: Install pnpm, run `pnpm install`, apply D1 migrations with `npx wrangler d1 migrations apply DB --local`
2. Development: Use pnpm run dev for localhost:5173; Validate with `pnpm run build` and `pnpm run test` after changes
3. Validation: Always run build, test, and lint before commits; Test PWA on different screen sizes; Verify offline functionality
4. Deployment: Automated CI/CD on main branch push; Manual deploy with pnpm run deploy
5. Code Quality: ESLint for linting; Feature modules structured as application/doma

## Governance

Constitution supersedes all other practices; Amendments require documentation, approval, and migration plan; All PRs must verify compliance with principles; Complexity must be justified; Use `copilot-instructions.md` for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-09-18 | **Last Amended**: 2025-09-18
