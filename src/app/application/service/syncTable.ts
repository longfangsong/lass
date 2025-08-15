const BATCH_SIZE = 64;
export async function syncTable<T>(
  table: string,
  versionPromise: Promise<number | undefined>,
  bulkPut: (data: T[]) => Promise<void>,
  setVersion: (version: number) => Promise<void>,
  now: number,
) {
  const version = (await versionPromise) || 0;
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
