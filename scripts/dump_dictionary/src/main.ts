import fs from "fs/promises";
import path from "path";
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";

const TABLES = ["Word", "WordIndex", "Lexeme"];
const CHUNK_SIZE = 1024 * 1024;
const PAGE_SIZE = 1000;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function* fetchTableRows(db: Database, table: string) {
  let offset = 0;
  while (true) {
    const rows: unknown[] = await db.all(
      `SELECT * FROM ${table} LIMIT ? OFFSET ?`,
      [PAGE_SIZE, offset],
    );
    if (rows.length === 0) break;
    for (const row of rows) {
      yield row;
    }
    offset += PAGE_SIZE;
  }
}

async function dumpTable(
  db: Database,
  table: string,
  outDir: string,
): Promise<number> {
  await ensureDir(outDir);
  let chunk: unknown[] = [];
  let chunkSize = 0;
  let fileIndex = 0;

  for await (const row of fetchTableRows(db, table)) {
    const rowStr = JSON.stringify(row);
    chunk.push(row);
    chunkSize += Buffer.byteLength(rowStr, "utf8");
    if (chunkSize >= CHUNK_SIZE) {
      const filePath = path.join(outDir, `${fileIndex}.json`);
      await fs.writeFile(filePath, JSON.stringify(chunk), "utf8");
      fileIndex++;
      chunk = [];
      chunkSize = 0;
    }
  }
  if (chunk.length > 0) {
    const filePath = path.join(outDir, `${fileIndex}.json`);
    await fs.writeFile(filePath, JSON.stringify(chunk), "utf8");
    fileIndex++;
  }
  return fileIndex;
}

async function main() {
  const dbPath = process.argv[2];
  if (!dbPath || !dbPath.endsWith(".sqlite")) {
    console.error("Usage: node dist/dump_words_to_json.js /path/to/db.sqlite");
    process.exit(1);
  }
  const outRoot = path.resolve("dump");
  await ensureDir(outRoot);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  const tables: [string, number][] = [];
  for (const table of TABLES) {
    const outDir = path.join(outRoot, table);
    console.log(`Dumping table ${table} to ${outDir}`);
    const fileCount = await dumpTable(db, table, outDir);
    tables.push([table, fileCount]);
  }
  await db.close();
  // Write meta.json with version and tables array
  const meta = {
    version: Date.now(),
    tables,
  };
  await fs.writeFile(
    path.join(outRoot, "meta.json"),
    JSON.stringify(meta),
    "utf8",
  );
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
