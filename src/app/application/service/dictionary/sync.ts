import type { Repository } from "@/app/domain/repository/word";
import type { Progress } from "@/app/presentation/atoms/dictionary/sync";
import type { DBWord, Lexeme, WordIndex } from "@/types";
import { syncTable } from "../syncTable";

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
