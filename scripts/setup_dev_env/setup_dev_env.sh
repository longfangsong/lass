pnpm i
npx wrangler d1 migrations apply DB
npx wrangler d1 execute DB --local --file=./scripts/setup_dev_env/Article.sql
npx wrangler d1 execute DB --local --file=./scripts/setup_dev_env/Word.sql
npx wrangler d1 execute DB --local --file=./scripts/setup_dev_env/WordIndex.sql
npx wrangler d1 execute DB --local --file=./scripts/setup_dev_env/Lexeme.sql
echo 'CF_PAGES_URL="https://localhost:8443"' >> .dev.vars
echo "AUTH_SECRET=\"$(npx auth secret --raw)\"" >> .dev.vars
echo "The following auth related things are optional, you can leave them empty, \
      use them if and only if you want to work with auth itself, \
      we support login with password \"developer-password\" and arbitary email in development."
echo "You can create a GitHub oauth client follow the document here: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app"
echo "This client is for local development only."
echo "Please set callback URL to: https://localhost/api/auth/callback/github"
read -p "Enter your AUTH_GITHUB_ID: " github_id
read -p "Enter your AUTH_GITHUB_SECRET: " github_secret
echo "AUTH_GITHUB_ID=\"$github_id\"" >> .dev.vars
echo "AUTH_GITHUB_SECRET=\"$github_secret\"" >> .dev.vars
echo "Please create a Google OAuth client follow the document here: https://support.google.com/cloud/answer/6158849"
echo "This client is for local development only."
echo "Please set callback URL to: https://localhost/api/auth/callback/google"
read -p "Enter your AUTH_GOOGLE_ID: " google_id
read -p "Enter your AUTH_GOOGLE_SECRET: " google_secret
echo "AUTH_GOOGLE_ID=\"$google_id\"" >> .dev.vars
echo "AUTH_GOOGLE_SECRET=\"$google_secret\"" >> .dev.vars
ln -s .dev.vars .env.local
pnpm exec playwright install
