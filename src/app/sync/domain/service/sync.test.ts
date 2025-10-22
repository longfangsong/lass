import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SyncService } from "./sync";
import type {
  ApiClient,
  InitableTable,
  MetaTable,
  BatchSyncableTable,
  TwoWayBatchSyncableTable,
} from "../types";

// Mock implementations
class MockMetaTable implements MetaTable {
  private versions = new Map<string, number>();

  async getVersion(table: string): Promise<number | undefined> {
    return this.versions.get(table);
  }

  async setVersion(table: string, version: number): Promise<void> {
    this.versions.set(table, version);
  }

  clear() {
    this.versions.clear();
  }
}

class MockSyncableTable implements BatchSyncableTable<{ id: string; data: string }> {
  name: string;
  autoSyncInterval: number = 10000;
  batchSize: number = 100;
  private data: Array<{ id: string; data: string }> = [];

  constructor(name: string) {
    this.name = name;
  }

  async bulkPut(data: Array<{ id: string; data: string }>): Promise<void> {
    this.data.push(...data);
  }

  getData() {
    return [...this.data];
  }

  clear() {
    this.data = [];
  }
}

class MockTwoWaySyncableTable
  implements TwoWayBatchSyncableTable<{ id: string; data: string; sync_at: number | null }>
{
  name: string;
  autoSyncInterval: number = 15000;
  batchSize: number = 50;
  private data: Array<{ id: string; data: string; sync_at: number | null }> = [];

  constructor(name: string) {
    this.name = name;
  }

  async bulkPut(data: Array<{ id: string; data: string; sync_at: number | null }>): Promise<void> {
    // Simulate upsert behavior
    for (const item of data) {
      const existingIndex = this.data.findIndex(d => d.id === item.id);
      if (existingIndex >= 0) {
        this.data[existingIndex] = item;
      } else {
        this.data.push(item);
      }
    }
  }

  async updatedBetween(
    _sync_at: number,
    from: number,
    to: number,
    limit: number,
  ): Promise<Array<{ id: string; data: string; sync_at: number | null }>> {
    return this.data
      .filter(item => 
        (item.sync_at === null || item.sync_at > from) && 
        (item.sync_at === null || item.sync_at <= to)
      )
      .slice(0, limit);
  }

  getData() {
    return [...this.data];
  }

  clear() {
    this.data = [];
  }

  addLocalData(items: Array<{ id: string; data: string; sync_at: number | null }>) {
    this.data.push(...items);
  }
}

class MockInitableTable extends MockSyncableTable implements InitableTable<{ id: string; data: string }> {
  private afterInitCalled = false;

  async afterInit(): Promise<void> {
    this.afterInitCalled = true;
  }

  wasAfterInitCalled() {
    return this.afterInitCalled;
  }

  resetAfterInitFlag() {
    this.afterInitCalled = false;
  }
}

class MockApiClient implements ApiClient {
  private metaJson = { version: 1000, tables: [["table1", 2], ["table2", 3]] as Array<[string, number]> };
  private initFiles = new Map<string, Array<Array<unknown>>>();
  private oneWaySyncResponse: Array<unknown> = [];
  private twoWaySyncResponse: Array<unknown> = [];
  private singleItemSyncResponse: any = undefined;

  async fetchMetaJson() {
    return this.metaJson;
  }

  async fetchInitFile<T>(tableName: string, fileId: number): Promise<Array<T>> {
    const files = this.initFiles.get(tableName) || [];
    return (files[fileId] || []) as Array<T>;
  }

  async oneWaySync(
    _tableName: string,
    _from: number,
    _to: number,
    offset: number,
    limit: number,
  ): Promise<Array<unknown>> {
    const start = offset;
    const end = Math.min(offset + limit, this.oneWaySyncResponse.length);
    return this.oneWaySyncResponse.slice(start, end);
  }

  async twoWaySync<T>(
    _tableName: string,
    _from: number,
    _to: number,
    offset: number,
    limit: number,
    _localEntries: Array<T>,
  ): Promise<Array<unknown>> {
    const start = offset;
    const end = Math.min(offset + limit, this.twoWaySyncResponse.length);
    return this.twoWaySyncResponse.slice(start, end);
  }

  async singleItemSync<T extends { update_time: number }>(
    _tableName: string,
    _localData: T | undefined
  ): Promise<T | undefined> {
    return this.singleItemSyncResponse as T | undefined;
  }

  setOneWaySyncResponse(data: Array<unknown>) {
    this.oneWaySyncResponse = data;
  }

  setTwoWaySyncResponse(data: Array<unknown>) {
    this.twoWaySyncResponse = data;
  }

  setSingleItemSyncResponse(data: any) {
    this.singleItemSyncResponse = data;
  }
}

describe("SyncService", () => {
  let metaTable: MockMetaTable;
  let oneWayTable: MockSyncableTable;
  let twoWayTable: MockTwoWaySyncableTable;
  let initableTable: MockInitableTable;
  let apiClient: MockApiClient;
  let syncService: SyncService;

  beforeEach(() => {
    metaTable = new MockMetaTable();
    oneWayTable = new MockSyncableTable("oneWayTable");
    twoWayTable = new MockTwoWaySyncableTable("twoWayTable");
    initableTable = new MockInitableTable("initableTable");
    apiClient = new MockApiClient();

    // Clear all data
    metaTable.clear();
    oneWayTable.clear();
    twoWayTable.clear();
    initableTable.clear();
    initableTable.resetAfterInitFlag();
  });

  describe("One-way sync", () => {
    beforeEach(() => {
      syncService = new SyncService(metaTable, [oneWayTable], apiClient);
    });

    it("should sync one-way table successfully", async () => {
      // Setup
      await metaTable.setVersion("oneWayTable", 500);
      const mockData = [
        { id: "1", data: "test1" },
        { id: "2", data: "test2" },
      ];
      apiClient.setOneWaySyncResponse(mockData);

      // Mock Date.now to return a fixed timestamp
      const now = 1000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // Execute
      await syncService.syncNow("oneWayTable");

      // Verify
      expect(oneWayTable.getData()).toEqual(mockData);
      expect(await metaTable.getVersion("oneWayTable")).toBe(now);
    });

    it("should throw error for non-existent table", async () => {
      await expect(syncService.syncNow("nonExistentTable")).rejects.toThrow(
        "Table nonExistentTable not found"
      );
    });
  });

  describe("Two-way sync", () => {
    beforeEach(() => {
      syncService = new SyncService(metaTable, [twoWayTable], apiClient);
    });

    it("should sync two-way table successfully", async () => {
      // Setup
      await metaTable.setVersion("twoWayTable", 500);
      
      // Add some local data that needs to be uploaded
      const localData = [
        { id: "local1", data: "localData1", sync_at: null },
        { id: "local2", data: "localData2", sync_at: null },
      ];
      twoWayTable.addLocalData(localData);

      // Remote data to be downloaded
      const remoteData = [
        { id: "remote1", data: "remoteData1" },
        { id: "remote2", data: "remoteData2" },
      ];
      apiClient.setTwoWaySyncResponse(remoteData);

      const now = 1000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // Execute
      await syncService.syncNow("twoWayTable");

      // Verify
      const finalData = twoWayTable.getData();
      
      // Should have both local and remote data, all with sync_at set to now
      expect(finalData).toHaveLength(4);
      expect(finalData.every(item => item.sync_at === now)).toBe(true);
      
      // Check specific data
      expect(finalData.some(item => item.id === "local1")).toBe(true);
      expect(finalData.some(item => item.id === "local2")).toBe(true);
      expect(finalData.some(item => item.id === "remote1")).toBe(true);
      expect(finalData.some(item => item.id === "remote2")).toBe(true);
      
      expect(await metaTable.getVersion("twoWayTable")).toBe(now);
    });
  });

  describe("Event handling", () => {
    beforeEach(() => {
      syncService = new SyncService(metaTable, [oneWayTable], apiClient);
    });

    it("should have unknown state initially", () => {
      expect(syncService.state).toBe("unknown");
    });

    it("should emit state change events during sync", async () => {
      // Setup
      await metaTable.setVersion("oneWayTable", 500);
      apiClient.setOneWaySyncResponse([{ id: "event1", data: "eventData1" }]);

      const stateChanges: any[] = [];

      syncService.addEventListener("progress", (event: any) => {
        stateChanges.push(event.detail);
      });

      // Execute
      await syncService.syncNow("oneWayTable");

      // Verify
      expect(stateChanges.length).toBeGreaterThan(0);
      
      // Should have at least a syncing and idle state
      const syncingStates = stateChanges.filter(state => 
        typeof state === "object" && state.syncing.length > 0
      );
      const idleStates = stateChanges.filter(state => state === "idle");
      
      expect(syncingStates.length).toBeGreaterThan(0);
      expect(idleStates.length).toBeGreaterThan(0);
      
      // Final state should be idle
      expect(syncService.state).toBe("idle");
    });

    it("should emit initing state when init service is active", async () => {
      // Create a service with an initable table
      const initableTable = new MockInitableTable("initTable");
      const serviceWithInit = new SyncService(metaTable, [initableTable], apiClient);
      
      const stateChanges: any[] = [];
      serviceWithInit.addEventListener("progress", (event: any) => {
        stateChanges.push(event.detail);
      });

      // The service should automatically listen to init events
      // Trigger an init state change by dispatching a mock init event
      const initService = (serviceWithInit as any).initService;
      initService.dispatchEvent(new CustomEvent("progress", { 
        detail: { detail: "load-meta" }
      }));

      // Verify
      expect(stateChanges.length).toBeGreaterThan(0);
      const initingStates = stateChanges.filter(state => 
        typeof state === "object" && state.initProgress && state.initProgress !== "idle"
      );
      expect(initingStates.length).toBeGreaterThan(0);
    });
  });

  describe("Auto sync restart functionality", () => {
    let clearIntervalSpy: any;
    let setIntervalSpy: any;

    beforeEach(() => {
      syncService = new SyncService(metaTable, [oneWayTable], apiClient);
      clearIntervalSpy = vi.spyOn(global, "clearInterval");
      setIntervalSpy = vi.spyOn(global, "setInterval").mockReturnValue(123 as any);
    });

    it("should restart auto sync interval for specific table after syncNow", async () => {
      // Setup - start auto sync first
      await syncService.startAutoSync();
      
      // Reset spies to start counting from fresh state
      clearIntervalSpy.mockClear();
      setIntervalSpy.mockClear();
      
      // Setup sync data
      await metaTable.setVersion("oneWayTable", 500);
      apiClient.setOneWaySyncResponse([{ id: "restart1", data: "restartData1" }]);

      // Execute - call syncNow which should restart the interval
      await syncService.syncNow("oneWayTable");

      // Verify interval was cleared and recreated
      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      
      // The new interval should be set with the same autoSyncInterval
      const lastCall = setIntervalSpy.mock.calls[setIntervalSpy.mock.calls.length - 1];
      expect(lastCall[1]).toBe(oneWayTable.autoSyncInterval);
    });

    it("should not crash when restarting auto sync for non-existent table", async () => {
      // Setup
      await metaTable.setVersion("nonExistentTable", 500);
      
      // Execute - this should not throw
      await expect(async () => {
        try {
          await syncService.syncNow("nonExistentTable");
        } catch (error) {
          // We expect the syncNow to throw for non-existent table
          // but the restart functionality should not cause additional errors
          expect((error as Error).message).toBe("Table nonExistentTable not found");
        }
      }).not.toThrow();
      
      // Verify no intervals were affected
      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });

    it("should restart interval even when no previous interval exists", async () => {
      // Setup - DON'T start auto sync first, so no interval exists
      await metaTable.setVersion("oneWayTable", 500);
      apiClient.setOneWaySyncResponse([{ id: "newInterval1", data: "newIntervalData1" }]);

      // Execute
      await syncService.syncNow("oneWayTable");

      // Verify - should create new interval even though none existed before
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), oneWayTable.autoSyncInterval);
      expect(clearIntervalSpy).not.toHaveBeenCalled(); // No previous interval to clear
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});