import type { Repository } from "@/app/domain/repository/word";
import type { Progress } from "@/app/presentation/atoms/dictionary/sync";
import type { DBWord, Lexeme, WordIndex } from "@/types";
import { assert } from "@/utils";

const BATCH_SIZE = 64;
async function syncTable<T>(
  table: string,
  versionPromise: Promise<number | undefined>,
  bulkPut: (data: T[]) => Promise<void>,
  setVersion: (version: number) => Promise<void>,
  now: number,
) {
  const version = await versionPromise;
  assert(version !== undefined);
  let offset = 0;
  while (true) {
    const params = new URLSearchParams({
      from: version!.toString(),
      to: now.toString(),
      offset: offset.toString(),
      limit: BATCH_SIZE.toString(),
    });
    const response = await fetch(`/api/sync/${table}?${params}`);
    const data: Array<T> = await response.json();
    await bulkPut(data);
    if (data.length < BATCH_SIZE) {
      break;
    }
    offset += BATCH_SIZE;
  }
  await setVersion(now);
}

export async function sync(
  repository: Repository,
  setProgress: (progress: Progress) => void,
) {
  setProgress("InProgress");
  const now = Date.now();
  const basicInfoTask = syncTable<DBWord>(
    "Word",
    repository.basicInfoVersion,
    (data) => repository.bulkPutBasicInfo(data),
    (version) => repository.setBasicInfoVersion(version),
    now,
  );
  const indexesTask = syncTable<WordIndex>(
    "WordIndex",
    repository.indexVersion,
    (data) => repository.bulkPutIndex(data),
    (version) => repository.setIndexVersion(version),
    now,
  );
  const lexemeTask = syncTable<Lexeme>(
    "Lexeme",
    repository.lexemeVersion,
    (data) => repository.bulkPutLexeme(data),
    (version) => repository.setLexemeVersion(version),
    now,
  );
  await Promise.all([basicInfoTask, indexesTask, lexemeTask]);
  setProgress({ last_check: now });
}
