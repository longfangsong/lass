import { db } from "@/app/infrastructure/indexeddb";

export async function inited(): Promise<boolean> {
  const metas = await db.meta.bulkGet(["Word", "WordIndex", "Lexeme"]);
  const versions = metas.map((meta) => meta?.version);
  return versions.every((v) => v !== undefined);
}
