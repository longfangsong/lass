import type { Article } from "@/types";
import type { Repository } from "../domain/repository";
import { syncTable } from "@/app/shared/application/syncTable";

export type Progress = "NeedCheck" | "InProgress" | { last_check: number };

export async function sync(
  repository: Repository,
  setProgress: (progress: Progress) => void,
) {
  setProgress("InProgress");
  const now = Date.now();
  await syncTable<Article>(
    "Article",
    repository.version,
    (data) => repository.bulkPut(data),
    (version) => repository.setVersion(version),
    now,
  );
  setProgress({ last_check: now });
}
