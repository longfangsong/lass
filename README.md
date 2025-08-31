# Läss - Swedish Learning Platform

Läss is a local-first Progressive Web App (PWA) for learning Swedish, built with React + TypeScript + Vite and deployed on Cloudflare Workers/Pages with D1 database. It includes a dictionary, articles, word review system, and spaced repetition learning.

## Features

- 📚 Swedish dictionary with 100k+ words
- 📰 Swedish news articles with word highlighting
- 🧠 Spaced repetition learning system
- 🔊 Audio pronunciation support
- 📱 Progressive Web App (PWA) - works offline
- 🌙 Dark/light theme support
- 🔐 OAuth authentication (GitHub, Google)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Cloudflare Workers (serverless functions)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Storage**: IndexedDB (via Dexie) for offline functionality
- **Deployment**: Cloudflare Pages + Workers
- **Testing**: Vitest

## Development

### Prerequisites

- Node.js 20+
- pnpm (required - npm/yarn will not work correctly)

### Setup

```bash
# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install

# Set up local database
npx wrangler d1 migrations apply DB --local

# Start development server
pnpm run dev
```

### Available Scripts

```bash
pnpm run dev          # Development server (localhost:5173)
pnpm run build        # Production build
pnpm run preview      # Preview production build
pnpm run test         # Run test suite
pnpm run lint         # Code linting
pnpm run deploy       # Deploy to Cloudflare
```

## Deployment

This project includes an automated CI/CD pipeline that deploys to Cloudflare on every push to the `main` branch.

### Quick Setup

1. Set up `CLOUDFLARE_API_TOKEN` in GitHub repository secrets
2. Configure required environment variables in Cloudflare dashboard
3. Push to `main` branch - deployment happens automatically!

For detailed setup instructions, see [CD Pipeline Documentation](.github/CD_PIPELINE.md).

### Manual Deployment

```bash
# Build and deploy to Cloudflare
pnpm run deploy

# Apply database migrations
npx wrangler d1 migrations apply DB --remote
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Architecture

The project is structured into a `src` directory containing both the frontend and backend code, organized by features.

```
src/
├── api/                  # Backend: Cloudflare Workers API (Hono)
│   ├── auth/             # Authentication routes (login, callback, session)
│   ├── lexemes/          # API endpoints for lexemes
│   ├── sync/             # Handles data synchronization with the client
│   ├── words/            # API endpoints for words and dictionary search
│   ├── router.ts         # Main backend API router
│   └── ...
├── app/                  # Frontend: React application (Vite)
│   ├── article/          # Feature: Article reading and interaction
│   ├── dictionary/       # Feature: Dictionary search and display
│   ├── wordbook/         # Feature: User's personal wordbook/flashcards
│   ├── shared/           # Shared components, hooks, and utilities for the frontend
│   ├── main.tsx          # Main React application entry point
│   └── ...
├── types/                # Shared TypeScript type definitions for the project
└── utils.ts              # General utility functions, shared across front/backend
```

Each feature module (e.g., `article`, `dictionary`) is further divided into layers:

- **application/**: Use cases and application-specific logic.
- **domain/**: Core business logic, models, and interfaces.
- **infrastructure/**: Implementation of external services (e.g., data fetching, local storage).
- **presentation/**: React components, pages, and hooks for the UI.
