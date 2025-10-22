import { isObjectType } from "remeda";

export interface MetaTable {
  getVersion(table: string): Promise<number | undefined>;
  setVersion(table: string, version: number): Promise<void>;
}

export interface SyncableTable {
  name: string;
  autoSyncInterval: number; // in milliseconds
}

export interface SingleItemSyncableTable<T> extends SyncableTable {
  get(id: string): Promise<T | undefined>;
  put(data: T): Promise<void>;
}

export interface BatchSyncableTable<T> extends SyncableTable {
  batchSize: number;
  bulkPut(data: T[]): Promise<void>;
}

export interface TwoWayBatchSyncableTable<T extends { sync_at: number | null }>
  extends BatchSyncableTable<T> {
  updatedBetween(
    sync_at: number,
    from: number,
    to: number,
    limit: number,
  ): Promise<Array<T>>;
}

export interface InitableTable<T> extends BatchSyncableTable<T> {
  afterInit(): Promise<void>;
}

export function isSingleItemSyncableTable<T>(table: SyncableTable): table is SingleItemSyncableTable<T> {
  return "get" in table && "put" in table;
}

export function isBatchSyncableTable<T>(table: SyncableTable): table is BatchSyncableTable<T> {
  return "bulkPut" in table && "batchSize" in table;
}

export function isTwoWaySyncableTable<T>(table: SyncableTable): table is TwoWayBatchSyncableTable<
  T extends { sync_at: number | null } ? T : never
> {
  return "updatedBetween" in table;
}

export function isInitableTable<T>(table: SyncableTable): table is InitableTable<T> {
  return "afterInit" in table;
}

export interface Progress {
  done: Array<{ name: string; all: number; done: number }>;
}

export type InitState = "unknown" | "idle" | "load-meta" | Progress;

export function isProgress(state: InitState): state is Progress {
  return isObjectType(state);
}

export function isTableInitializing(tableName: string, initProgress: InitState): boolean {
  return isProgress(initProgress) &&
    initProgress.done.some(item => item.name === tableName);
}

export function isDownloading(syncState: SyncState): boolean {
  return typeof syncState === "object" &&
    syncState.initProgress !== undefined &&
    syncState.initProgress !== "idle";
}

export function isSyncing(syncState: SyncState): boolean {
  return typeof syncState === "object" &&
    (syncState.initProgress === undefined || syncState.initProgress === "idle") &&
    syncState.syncing.length > 0;
}

export function isIdle(syncState: SyncState): boolean {
  return syncState === "idle";
}

export function isUnknown(syncState: SyncState): boolean {
  return syncState === "unknown";
}

export type SyncState =
  | "unknown"
  | "idle"
  | {
    syncing: Array<string>;     // tables currently being synced
    initProgress?: InitState;   // current initialization progress (contains table names)
  };

export interface ApiClient {
  fetchMetaJson(): Promise<{ version: number; tables: Array<[string, number]> }>;

  fetchInitFile<T>(tableName: string, fileId: number): Promise<Array<T>>;

  oneWaySync(
    tableName: string,
    from: number,
    to: number,
    offset: number,
    limit: number
  ): Promise<Array<unknown>>;

  twoWaySync<T>(
    tableName: string,
    from: number,
    to: number,
    offset: number,
    limit: number,
    localEntries: Array<T>
  ): Promise<Array<unknown>>;
}
