import type { Progress } from "@app/presentation/atoms/wordbook/sync";
import type { WordBookEntry } from "@/types";
import { repository } from "@/app/infrastructure/indexeddb/wordbookEntryRepository";

const BATCH_SIZE = 64;

export async function sync(setProgress: (progress: Progress) => void) {
  setProgress("InProgress");
  const version = await repository.version;
  // also use as "sync_id"
  const now = Date.now();

  // First, upload local changes to server
  let uploadDone = false;
  let downloadDone = false;
  let downloadOffset = 0;
  while (!uploadDone || !downloadDone) {
    let localEntries: Array<WordBookEntry> = [];
    if (!uploadDone) {
      localEntries = await repository.updatedBetween(
        now,
        version || 0,
        now,
        BATCH_SIZE,
      );
      uploadDone = localEntries.length < BATCH_SIZE;
    }
    const params = new URLSearchParams({
      from: version?.toString() || "0",
      to: now.toString(),
      limit: BATCH_SIZE.toString(),
      offset: downloadOffset.toString(),
    });
    localEntries.forEach((it) => (it.sync_at = now));
    const updateLocal = repository.bulkUpdate(localEntries);
    const exchangeWithRemote = fetch(`/api/sync/WordBookEntry?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(localEntries),
    });
    const [response, _] = await Promise.all([exchangeWithRemote, updateLocal]);
    const data: Array<WordBookEntry> = await response.json();
    await Promise.all(
      data.map((it) =>
        repository.upsert({
          ...it,
          sync_at: now,
        }),
      ),
    );
    downloadOffset += data.length;
    downloadDone = data.length < BATCH_SIZE;
  }

  // // Update version after successful sync
  await repository.setVersion(now);
  setProgress({ last_check: now });
}
