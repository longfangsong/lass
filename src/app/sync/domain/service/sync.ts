import { assert, logger } from "@/utils";
import {
  isInitableTable,
  isTwoWaySyncableTable,
  isTableInitializing,
  type ApiClient,
  type InitState,
  type MetaTable,
  type BatchSyncableTable,
  type SyncState,
  type TwoWayBatchSyncableTable,
  type SyncableTable,
  isBatchSyncableTable,
  isSingleItemSyncableTable,
} from "../types";
import { InitService } from "./init";
import { clone } from "remeda";

export class SyncService extends EventTarget {
  private initService: InitService;
  private intervalIds: Array<ReturnType<typeof setInterval> | null>;
  private isStartingAutoSync = false;
  private currentState: SyncState = "unknown";

  constructor(
    private meta: MetaTable,
    private tables: SyncableTable[],
    private apiClient: ApiClient,
  ) {
    super();
    this.initService = new InitService(
      meta,
      tables.filter((it) => isInitableTable(it)),
      this.apiClient,
    );
    this.intervalIds = tables.map((_) => null);

    // Listen to init service events to update our state
    this.initService.addEventListener("progress", ((
      e: CustomEvent<InitState>,
    ) => {
      this.setInitProgress(e.detail);
    }) as unknown as EventListener);
  }

  private emitStateChange() {
    const event = new CustomEvent("progress", {
      detail: clone(this.currentState),
    });
    logger.event("SyncService progress event: ", event.detail);
    this.dispatchEvent(event);
  }

  private setState(newState: SyncState) {
    this.currentState = newState;
    logger.state("SyncService state changed:", newState);
    this.emitStateChange();
  }

  private setInitProgress(initProgress: InitState) {
    if (this.currentState === "unknown" || this.currentState === "idle") {
      if (initProgress === "idle") {
        this.setState("idle");
      } else {
        this.setState({ syncing: [], initProgress });
      }
    } else if (typeof this.currentState === "object") {
      if (this.currentState.syncing.length === 0 && initProgress === "idle") {
        this.setState("idle");
      } else {
        this.setState({ syncing: this.currentState.syncing, initProgress });
      }
    }
  }

  public get state(): SyncState {
    return this.currentState;
  }

  private addSyncingTable(tableName: string) {
    // Check if table is currently being initialized
    if (typeof this.currentState === "object" && this.currentState.initProgress &&
      isTableInitializing(tableName, this.currentState.initProgress)) {
      console.log(`Table ${tableName} is currently being initialized. Cannot sync.`);
      return false;
    }

    if (this.currentState === "unknown" || this.currentState === "idle") {
      this.setState({ syncing: [tableName] });
    } else if (typeof this.currentState === "object") {
      if (this.currentState.syncing.includes(tableName)) {
        console.log(`Table ${tableName} is already syncing. Skipping this sync.`);
        return false;
      }
      const newState = {
        syncing: [...this.currentState.syncing, tableName],
        initProgress: this.currentState.initProgress
      };
      // If initProgress is "idle", we can omit it to keep state clean
      if (newState.initProgress === "idle") {
        this.setState({ syncing: newState.syncing });
      } else {
        this.setState(newState);
      }
    }
    return true;
  }

  private removeSyncingTable(tableName: string) {
    if (typeof this.currentState === "object") {
      const updatedSyncing = this.currentState.syncing.filter((name: string) => name !== tableName);

      // If no tables are syncing and init is idle (or undefined), simplify to "idle"
      if (updatedSyncing.length === 0 && (!this.currentState.initProgress || this.currentState.initProgress === "idle")) {
        this.setState("idle");
      } else if (updatedSyncing.length === 0) {
        // Only init is active, no syncing
        this.setState({
          syncing: [],
          initProgress: this.currentState.initProgress
        });
      } else {
        // Still have syncing tables
        const newState = {
          syncing: updatedSyncing,
          initProgress: this.currentState.initProgress
        };
        // If initProgress is "idle", we can omit it to keep state clean
        if (newState.initProgress === "idle") {
          this.setState({ syncing: newState.syncing });
        } else {
          this.setState(newState);
        }
      }
    }
  }

  private async syncOneDirectionNow(table: BatchSyncableTable<unknown>) {
    // Table-specific blocking is handled in addSyncingTable

    if (!this.addSyncingTable(table.name)) {
      return;
    }

    const version = await this.meta.getVersion(table.name);
    const now = Date.now();
    let offset = 0;
    while (true) {
      const data = await this.apiClient.oneWaySync(
        table.name,
        version || 0,
        now,
        offset,
        table.batchSize,
      );
      await table.bulkPut(data);
      if (data.length < table.batchSize) {
        break;
      }
      offset += table.batchSize;
    }
    await this.meta.setVersion(table.name, now);
    this.removeSyncingTable(table.name);
  }

  private async syncTwoWayNow(
    table: TwoWayBatchSyncableTable<{ sync_at: number | null }>,
  ) {
    // Table-specific blocking is handled in addSyncingTable
    if (!this.addSyncingTable(table.name)) {
      console.log(`Sync for table ${table.name} skipped due to ongoing operation.`);
      return;
    }

    const version = await this.meta.getVersion(table.name);
    const now = Date.now();
    try {
      let uploadDone = false;
      let downloadDone = false;
      let downloadOffset = 0;
      while (!uploadDone || !downloadDone) {
        let localEntries: Array<{ sync_at: number | null }> = [];
        if (!uploadDone) {
          localEntries = await table.updatedBetween(
            now,
            version || 0,
            now,
            table.batchSize,
          );
          uploadDone = localEntries.length < table.batchSize;
        }

        localEntries.forEach((it) => (it.sync_at = now));
        const updateLocal = table.bulkPut(localEntries);
        const exchangeWithRemote = this.apiClient.twoWaySync(
          table.name,
          version || 0,
          now,
          downloadOffset,
          table.batchSize,
          localEntries,
        );

        const [data, _] = await Promise.all([
          exchangeWithRemote,
          updateLocal,
        ]);

        const dataWithSyncAt: Array<unknown & { sync_at: number | null }> =
          data.map((it) => {
            assert(it !== null && typeof it === "object");
            return {
              ...it,
              sync_at: now,
            };
          });
        await table.bulkPut(dataWithSyncAt);
        downloadOffset += data.length;
        downloadDone = data.length < table.batchSize;
      }
    } catch (error) {
      console.error(`Two-way sync failed for table ${table.name}:`, error);
      this.removeSyncingTable(table.name);
      return;
    }

    await this.meta.setVersion(table.name, now);
    this.removeSyncingTable(table.name);
  }

  public async syncNow(tableName: string) {
    const table = this.tables.find((it) => it.name === tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }
    if (isInitableTable(table) && await this.initService.needInit()) {
      console.log(`Starting init for table: ${table.name}`);
      this.initService.startInit();
      await new Promise<void>((resolve) => {
        this.initService.addEventListener("progress", ((
          e: CustomEvent<{ detail: InitState }>,
        ) => {
          if (e.detail.detail === "idle") {
            resolve();
          }
        }) as unknown as EventListener);

        if (this.initService.state === "idle") {
          resolve();
        }
      });
    }
    if (isTwoWaySyncableTable(table)) {
      await this.syncTwoWayNow(table);
    } else if (isBatchSyncableTable(table))  {
      await this.syncOneDirectionNow(table);
    } else if (isSingleItemSyncableTable(table)) {
      await this.syncOneItemNow(table);
    }

    // Restart auto sync interval for this specific table (but not during initial setup)
    if (!this.isStartingAutoSync) {
      this.restartAutoSyncForTable(tableName);
    }
  }

  private restartAutoSyncForTable(tableName: string) {
    const tableIndex = this.tables.findIndex((table) => table.name === tableName);
    if (tableIndex === -1) {
      return; // Table not found, nothing to restart
    }

    // Clear existing interval for this table
    if (this.intervalIds[tableIndex] !== null) {
      clearInterval(this.intervalIds[tableIndex]!);
    }

    // Start new interval for this table
    const table = this.tables[tableIndex];
    const intervalId = setInterval(async () => {
      await this.syncNow(table.name);
    }, table.autoSyncInterval);
    this.intervalIds[tableIndex] = intervalId;
  }

  public async startAutoSync() {
    this.isStartingAutoSync = true;

    for (let i = 0; i < this.tables.length; i++) {
      const intervalId = setInterval(async () => {
        await this.syncNow(this.tables[i].name);
      }, this.tables[i].autoSyncInterval);
      this.intervalIds[i] = intervalId;
    }

    // Trigger initial sync for all tables
    const initialSyncs = this.tables.map((table) => this.syncNow(table.name));
    await Promise.all(initialSyncs);
    console.log("Initial sync completed for all tables.");
    this.isStartingAutoSync = false;
    this.setState("idle");
  }
}
