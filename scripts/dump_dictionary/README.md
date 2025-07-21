# Dump Dictionary

Export Word, WordIndex, Lexeme tables from a .sqlite database (usually your local development database in `.wrangler/state/v3/d1`, which is downloaded from production db) to JSON files (1MB per file).

## Usage

```sh
cd scripts/dump_words_to_json
pnpm install # or npm install
pnpm build   # or npm run build
pnpm start /path/to/your.db.sqlite
```

Output will be in `dump/Word/`, `dump/WordIndex/`, `dump/Lexeme/` under the current directory.
