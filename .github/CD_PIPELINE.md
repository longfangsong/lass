# Continuous Deployment (CD) Pipeline

This repository includes an automated CD pipeline that deploys the application to Cloudflare Pages/Workers on every push to the `main` branch.

## Pipeline Overview

The pipeline consists of two jobs:

1. **Test Job** - Runs on all pushes and pull requests:
   - Installs dependencies
   - Runs linting checks
   - Executes test suite
   - Builds the project

2. **Deploy Job** - Runs only on pushes to `main` branch:
   - Builds the application
   - Deploys to Cloudflare Pages/Workers

## Required Secrets

### CLOUDFLARE_API_TOKEN

You need to create a Cloudflare API token with the following permissions:

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit zone DNS" template or create custom token with these permissions:
   - **Zone:Zone:Read** (for the zone containing your domain)
   - **Zone:Page Rules:Edit** (if using page rules)
   - **Account:Cloudflare Pages:Edit** (for Pages deployment)
   - **Account:D1:Edit** (for database operations)
   - **User:User Details:Read** (for account info)

4. Add the token to your repository secrets:
   - Go to your repository on GitHub
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Your API token

### Alternative: Account ID and Global API Key (Less Secure)

If you prefer using the global API key (not recommended):

1. Get your Account ID from the Cloudflare dashboard
2. Get your Global API Key from your Cloudflare profile
3. Add these secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_KEY`

## Required Cloudflare Environment Variables/Secrets

The application requires several environment variables to be configured in Cloudflare. These should be set up in your Cloudflare dashboard under Workers & Pages > Your App > Settings > Variables:

### Required Secrets (via Cloudflare Dashboard):
- `GEMINI_API_KEY` - Google Gemini AI API key
- `AUTH_GITHUB_ID` - GitHub OAuth app client ID
- `AUTH_GITHUB_SECRET` - GitHub OAuth app client secret
- `AUTH_GOOGLE_ID` - Google OAuth app client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth app client secret
- `AUTH_SECRET` - Secret key for authentication (generate a secure random string)
- `APP_URL` - Your application's URL (e.g., https://your-app.pages.dev)

### Variables Already Configured:
- `CF_PAGES_URL` - Already set in wrangler.toml
- `DB` - Database binding already configured in wrangler.toml

## Configuration

The pipeline uses the existing `wrangler.toml` configuration file for deployment settings. Make sure your wrangler.toml is properly configured with:

- Correct app name
- D1 database binding
- Any required environment variables
- Correct assets configuration

<!--## Database Migrations

The pipeline automatically applies database migrations before deployment using:
```bash
npx wrangler d1 migrations apply DB --remote
```

This ensures your database schema is always up-to-date with your deployment.-->

## Manual Deployment

You can still deploy manually using:
```bash
pnpm run deploy
```

Make sure you have the `CLOUDFLARE_API_TOKEN` environment variable set locally.

## Troubleshooting

### Authentication Issues
- Verify your `CLOUDFLARE_API_TOKEN` secret is set correctly
- Ensure the token has all required permissions
- Check that the token hasn't expired

### Build Issues
- The pipeline runs the same build process as local development
- Check that `pnpm run build` works locally
- Verify all dependencies are properly declared in package.json
- Note: There may be some existing ESLint issues in UI components (react-refresh/only-export-components), but these don't prevent deployment
