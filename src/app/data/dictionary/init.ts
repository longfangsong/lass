import type { Table } from "dexie";
import { DB, db } from "../db";
import type { Progress, Tasks } from "@app/atoms/dictionary/init";

async function dictionaryInited(): Promise<boolean> {
  const metas = await db.meta.bulkGet(["Word", "WordIndex", "Lexeme"]);
  const versions = metas.map((meta) => meta?.version);
  return versions.every((v) => v !== undefined);
}

async function loadMeta(): Promise<Tasks> {
  const metaFile = await fetch(`/init/meta.json`);
  return await metaFile.json();
}

async function loadOneFile<T>(table: Table<T, keyof T>, file_id: number) {
  const initFile = await fetch(`/init/${table.name}/${file_id}.json`);
  const data: Array<T> = await initFile.json();
  await table.bulkPut(data);
}

function createInitProgress(tableTasks: Array<[string, number]>) {
  return tableTasks.map(([key]): [string, number] => [key, 0]);
}

export async function initTable<T>(
  table: Table<T, keyof T>,
  fileCount: number,
  version: number,
  setProgress: (done: number) => void,
) {
  const db = table.db as DB;
  for (let i = 0; i < fileCount; ++i) {
    await loadOneFile(table, i);
    setProgress(i + 1);
  }
  await db.meta.put({ table_name: table.name, version });
}

async function init(
  setTasks: (tasks: Tasks) => void,
  setProgress: (progress: Progress) => void,
) {
  const tasks = await loadMeta();
  setTasks(tasks);
  const initProgress = createInitProgress(tasks.tables);
  setProgress(initProgress);
  for (let tableId = 0; tableId < tasks.tables.length; ++tableId) {
    const [key, count] = tasks.tables[tableId];
    await initTable(db.table(key), count, tasks.version, (done) => {
      initProgress[tableId][1] = done;
      setProgress(initProgress);
    });
  }
  setProgress("Done");
}

export async function initIfNeeded(
  setTasks: (tasks: Tasks) => void,
  setProgress: (progress: Progress) => void,
) {
  if (await dictionaryInited()) {
    setProgress("Done");
  } else {
    await init(setTasks, setProgress);
  }
}
