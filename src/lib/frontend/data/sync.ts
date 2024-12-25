import { fetchWithSemaphore } from "@/lib/fetch";
import { DB, getDB } from "../db";
import { DBTypes } from "@/lib/types";
import { EntityTable } from "dexie";
import Semaphore from "semaphore-promise";

const PAGE_SIZE = 5000;
export const syncSemaphore = new Semaphore(1);

async function initOrPullUpdateReadonly<T>(
  table: EntityTable<T, keyof T>,
  tableName: keyof typeof INIT_TABLE_FILE_COUNT,
) {
  const db = table.db as DB;
  const release = await syncSemaphore.acquire();
  const meta = await db.meta.get(tableName);
  if (meta === undefined) {
    await initReadonlyTable<T>(table, tableName);
    release();
    await initOrPullUpdateReadonly(table, tableName);
  } else {
    const now = new Date();
    const lastUpdatedTime = meta.version;
    const isNewEnough = now.getTime() - lastUpdatedTime < 1000 * 60 * 60 * 24;
    if (isNewEnough) {
      release();
      return;
    }
    await pullUpdateReadonly(table, tableName, lastUpdatedTime);
    release();
  }
}

async function pullUpdateReadonly<T>(
  table: EntityTable<T, keyof T>,
  tableName: keyof typeof INIT_TABLE_FILE_COUNT,
  lastUpdatedTime: number,
) {
  const db = table.db as DB;
  const now = new Date();
  let currentOffset = 0;
  while (true) {
    const queryResult = await fetchWithSemaphore(
      `/api/sync?table=${tableName}&limit=${PAGE_SIZE}&offset=${currentOffset}&updated_after=${lastUpdatedTime}&updated_before=${now.getTime()}`,
    );
    const result: Array<T> = await queryResult.json();
    table.bulkPut(result);
    currentOffset += result.length;
    if (result.length < PAGE_SIZE) {
      break;
    }
  }
  await db.meta.put({ table_name: tableName, version: now.getTime() });
  console.log(
    `Sync ${tableName} with ${currentOffset} items in ${
      new Date().getTime() - now.getTime()
    }ms`,
  );
}

async function pushPullUpdateReadwrite<T>(
  table: EntityTable<T, keyof T>,
  tableName: string,
  lastUpdatedTime: number,
) {
  const db = table.db as DB;
  const now = new Date();
  let currentLocalOffset = 0;
  let currentRemoteOffset = 0;
  while (true) {
    const localNewData =
      lastUpdatedTime === 0
        ? await table
            .where("update_time")
            .between(lastUpdatedTime, now.getTime())
            .offset(currentLocalOffset)
            .limit(PAGE_SIZE)
            .toArray()
        : [];
    const remoteNewDataResponse = await fetchWithSemaphore(
      `/api/sync?table=${tableName}&limit=${PAGE_SIZE}&offset=${currentRemoteOffset}&updated_after=${lastUpdatedTime}&updated_before=${now.getTime()}`,
      {
        method: "POST",
        body: JSON.stringify(localNewData),
      },
    );
    const remoteNewData: Array<T> = await remoteNewDataResponse.json();
    table.bulkPut(remoteNewData);
    currentLocalOffset += localNewData.length;
    currentRemoteOffset += remoteNewData.length;
    if (remoteNewData.length < PAGE_SIZE && localNewData.length < PAGE_SIZE) {
      break;
    }
  }
  await db.meta.put({ table_name: tableName, version: now.getTime() });
  console.log(
    `Sync ${tableName}, upload ${currentLocalOffset} and download ${currentRemoteOffset} items in ${
      new Date().getTime() - now.getTime()
    }ms`,
  );
}

async function initOrPullUpdateReadwrite<T>(
  table: EntityTable<T, keyof T>,
  tableName: string,
) {
  const db = table.db as DB;
  const meta = await db.meta.get(tableName);
  await pushPullUpdateReadwrite(table, tableName, meta?.version || 0);
}

const INIT_TIME = 1734783524009;
const INIT_TABLE_FILE_COUNT = {
  Word: 1,
  WordIndex: 8,
  Lexeme: 2,
};
async function initReadonlyTable<T>(
  table: EntityTable<T, keyof T>,
  tableName: keyof typeof INIT_TABLE_FILE_COUNT,
) {
  const now = new Date();
  const db = table.db as DB;
  let resultLength = 0;
  const syncFetchSemaphore = new Semaphore(3);
  await Promise.all(
    [...Array(INIT_TABLE_FILE_COUNT[tableName]).keys()].map(async (i) => {
      const syncRelease = await syncFetchSemaphore.acquire();
      const initData = await fetch(`/dictionary-init/${tableName}/${i}.json`);
      const result: Array<T> = await initData.json();
      table.bulkPut(result);
      syncRelease();
      resultLength += result.length;
    }),
  );
  await db.meta.put({ table_name: tableName, version: INIT_TIME });
  console.log(
    `Init ${tableName} with ${resultLength} items in ${
      new Date().getTime() - now.getTime()
    }ms`,
  );
}

export async function syncWord() {
  const db = await getDB();
  await initOrPullUpdateReadonly(
    db.word as EntityTable<DBTypes.Word, keyof DBTypes.Word>,
    "Word",
  );
}

export async function syncWordIndex() {
  const db = await getDB();
  await initOrPullUpdateReadonly(
    db.wordIndex as EntityTable<DBTypes.WordIndex, keyof DBTypes.WordIndex>,
    "WordIndex",
  );
}

export async function syncLexeme() {
  const db = await getDB();
  await initOrPullUpdateReadonly(
    db.lexeme as EntityTable<DBTypes.Lexeme, keyof DBTypes.Lexeme>,
    "Lexeme",
  );
}

export async function syncReviewProgress() {
  const db = await getDB();
  await initOrPullUpdateReadwrite(
    db.reviewProgress as EntityTable<
      DBTypes.ReviewProgress,
      keyof DBTypes.ReviewProgress
    >,
    "ReviewProgress",
  );
}
