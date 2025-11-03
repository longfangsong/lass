# Dump Dictionary

Export Word, WordIndex, Lexeme tables from a .sqlite database (usually your local development database in `.wrangler/state/v3/d1`, which is downloaded from production db) to JSON files (1MB per file).

## Usage

```sh
cd scripts/dump_dictionary
pnpm install # or npm install
pnpm build   # or npm run build
pnpm start /path/to/your.db.sqlite
```

Output will be in `dump/Word/`, `dump/WordIndex/`, `dump/Lexeme/` under the current directory.

## Hint

If you want to download and import remote database to local, use the following command:

```sh
npx wrangler d1 export DB --no-schema --remote --output=./lass.sql
npx wrangler d1 execute --file ./lass.sql DB
```

And delete the insert statements for `d1_migrations` table.
