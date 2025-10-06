import { describe, expect, it, vi } from "vitest";
import { InitService } from "./init";
import { isProgress, type ApiClient, type InitableTable, type MetaTable } from "../types";
import { clone } from "remeda";
import { subDays } from "date-fns";

// Simple mock implementations
class SimpleMockMetaTable implements MetaTable {
  private versions = new Map<string, number>();

  async getVersion(table: string): Promise<number | undefined> {
    return this.versions.get(table);
  }

  async setVersion(table: string, version: number): Promise<void> {
    this.versions.set(table, version);
  }
}

class SimpleMockInitableTable implements InitableTable<{ id: string }> {
  name: string;
  autoSyncInterval: number = 10000;
  batchSize: number = 100;
  private data: Array<{ id: string }> = [];
  private afterInitCalled = false;

  constructor(name: string) {
    this.name = name;
  }

  async bulkPut(data: Array<{ id: string }>): Promise<void> {
    this.data.push(...data);
  }

  async afterInit(): Promise<void> {
    this.afterInitCalled = true;
  }

  getData() {
    return [...this.data];
  }

  wasAfterInitCalled() {
    return this.afterInitCalled;
  }
}

class SimpleMockApiClient implements ApiClient {
  private metaJson = { version: 1000, tables: [["table1", 2], ["table2", 3]] as Array<[string, number]> };
  private initFiles = new Map<string, Array<Array<unknown>>>();

  constructor() {
    // Set up default init files
    this.initFiles.set("table1", [
      [{ id: "file1-item1" }, { id: "file1-item2" }],
      [{ id: "file2-item1" }]
    ]);
    this.initFiles.set("table2", [
      [{ id: "table2-file1-item1" }],
      [{ id: "table2-file2-item1" }],
      [{ id: "table2-file3-item1" }]
    ]);
  }

  async fetchMetaJson() {
    return this.metaJson;
  }

  async fetchInitFile<T>(tableName: string, fileId: number): Promise<Array<T>> {
    const files = this.initFiles.get(tableName) || [];
    return (files[fileId] || []) as Array<T>;
  }

  async oneWaySync(): Promise<Array<unknown>> {
    return [];
  }

  async twoWaySync(): Promise<Array<unknown>> {
    return [];
  }

  setMetaJson(meta: { version: number; tables: Array<[string, number]> }) {
    this.metaJson = meta;
  }

  setInitFiles(tableName: string, files: Array<Array<unknown>>) {
    this.initFiles.set(tableName, files);
  }
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

// Mock window.localStorage
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe("InitService", () => {
  it("should detect when initialization is needed", async () => {
    const metaTable = new SimpleMockMetaTable();
    const table = new SimpleMockInitableTable("table1");
    const apiClient = new SimpleMockApiClient();
    
    const initService = new InitService(metaTable, [table], apiClient);
    
    const needInit = await initService.needInit();
    expect(needInit).toBe(true);
  });

  it("should detect when initialization is not needed", async () => {
    const metaTable = new SimpleMockMetaTable();
    const table = new SimpleMockInitableTable("table1");
    const apiClient = new SimpleMockApiClient();
    
    // Set version to indicate table is already initialized
    await metaTable.setVersion("table1", 100);
    
    const initService = new InitService(metaTable, [table], apiClient);
    
    const needInit = await initService.needInit();
    expect(needInit).toBe(false);
  });

  it("should start with unknown state", () => {
    const metaTable = new SimpleMockMetaTable();
    const table = new SimpleMockInitableTable("table1");
    const apiClient = new SimpleMockApiClient();
    
    const initService = new InitService(metaTable, [table], apiClient);
    
    expect(initService.state).toBe("unknown");
  });

  it("should perform all state transitions and emitted events during initialization", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const metaTable = new SimpleMockMetaTable();
    const table1 = new SimpleMockInitableTable("table1");
    const table2 = new SimpleMockInitableTable("table2");
    const apiClient = new SimpleMockApiClient();
    
    const initService = new InitService(metaTable, [table1, table2], apiClient);
    
    // Track all state changes and events
    const stateChanges: Array<any> = [];
    const progressEvents: Array<any> = [];
    
    initService.addEventListener("progress", (event: any) => {
      progressEvents.push({
        timestamp: Date.now(),
        state: event.detail,
        serviceState: clone(initService.state)
      });
    });

    // Initial state should be unknown
    expect(initService.state).toBe("unknown");
    stateChanges.push({ step: "initial", state: initService.state });

    // Start initialization process
    await initService.startInit();

    // Final state should be idle
    expect(initService.state).toBe("idle");
    stateChanges.push({ step: "final", state: initService.state });

    // Verify all expected events were emitted
    expect(progressEvents.length).toBeGreaterThan(0);

    // start from load-meta
    expect(progressEvents[0].state).toBe("load-meta");
    // end with idle
    expect(progressEvents[progressEvents.length - 1].state).toBe("idle");
    // Should have progress events (object with done property)
    const progressUpdates = progressEvents.filter(e => isProgress(e.state) );
    
    // Verify progress tracking for each table
    const finalProgress = progressUpdates[progressUpdates.length - 1];
    expect(finalProgress.state.done).toEqual([
      { name: "table1", all: 2, done: 2 }, // 2 files
      { name: "table2", all: 3, done: 3 }  // 3 files
    ]);

    // Verify afterInit was called
    expect(table1.wasAfterInitCalled()).toBe(true);
    expect(table2.wasAfterInitCalled()).toBe(true);
    
    // Verify versions were set
    expect(await metaTable.getVersion("table1")).toBe(1000);
    expect(await metaTable.getVersion("table2")).toBe(1000);
  });

  it("should emit state transitions correctly when skipping initialization", async () => {
    const metaTable = new SimpleMockMetaTable();
    const table = new SimpleMockInitableTable("table1");
    const apiClient = new SimpleMockApiClient();
    
    // Set version to indicate already initialized
    await metaTable.setVersion("table1", 500);
    
    const initService = new InitService(metaTable, [table], apiClient);
    
    // Track events
    const progressEvents: Array<any> = [];
    initService.addEventListener("progress", (event: any) => {
      progressEvents.push(event.detail);
    });

    await initService.startInit();
    
    // Should only emit idle event (skip initialization)
    expect(progressEvents).toEqual(["idle"]);
    
    // Should not have initialized
    expect(table.getData()).toHaveLength(0);
    expect(table.wasAfterInitCalled()).toBe(false);
    
    // Should be in idle state
    expect(initService.state).toBe("idle");
  });

  it("should track incremental progress events during file loading", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const metaTable = new SimpleMockMetaTable();
    const table = new SimpleMockInitableTable("table1");
    const apiClient = new SimpleMockApiClient();
    
    // Set up multiple files for detailed progress tracking
    apiClient.setInitFiles("table1", [
      [{ id: "file1-item1" }],
      [{ id: "file2-item1" }],
      [{ id: "file3-item1" }],
      [{ id: "file4-item1" }]
    ]);
    apiClient.setMetaJson({ version: 2000, tables: [["table1", 4]] });
    
    const initService = new InitService(metaTable, [table], apiClient);
    
    // Track detailed progress
    const progressUpdates: Array<any> = [];
    initService.addEventListener("progress", (event: any) => {
      if (isProgress(event.detail)) {
        progressUpdates.push(clone(event.detail.done));
      }
    });

    await initService.startInit();
    
    // Should have multiple progress updates showing incremental file loading
    expect(progressUpdates.length).toBe(5); // Initial 0 + 4 incremental updates
    // Check progress sequence for table1
    const table1Progress = progressUpdates.map(update => 
      update.find((entry: { name: string; all: number; done: number }) => entry.name === "table1")?.done || 0
    );
    
    // Should show incremental progress: 0, 1, 2, 3, 4
    expect(table1Progress).toEqual([0, 1, 2, 3, 4]);
    
    // Final verification
    expect(table.getData()).toHaveLength(4);
    expect(await metaTable.getVersion("table1")).toBe(2000);
  });

  it("should handle mixed initialization states (some tables in metadata, some not)", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const metaTable = new SimpleMockMetaTable();
    const table1 = new SimpleMockInitableTable("table1"); // In metadata, needs init
    const table3 = new SimpleMockInitableTable("table3"); // Not in metadata, should be skipped
    const apiClient = new SimpleMockApiClient();
    
    // Only table1 is in the metadata
    apiClient.setMetaJson({ version: 1000, tables: [["table1", 2]] });
    
    const initService = new InitService(metaTable, [table1, table3], apiClient);
    
    const progressEvents: Array<any> = [];
    initService.addEventListener("progress", (event: any) => {
      progressEvents.push(event.detail);
    });

    await initService.startInit();
    
    // Should go through initialization process for table1 only
    const progressUpdates = progressEvents.filter(isProgress);
    expect(progressUpdates.length).toBeGreaterThan(0);
    
    // Only table1 should have been initialized
    expect(table1.getData()).toHaveLength(3); // 2 + 1 items from default setup
    expect(table1.wasAfterInitCalled()).toBe(true);
    
    // table3 should not have been touched (not in metadata)
    expect(table3.getData()).toHaveLength(0);
    expect(table3.wasAfterInitCalled()).toBe(false);
    
    // Only table1 should have a version set
    expect(await metaTable.getVersion("table1")).toBe(1000);
    expect(await metaTable.getVersion("table3")).toBeUndefined();
    
    // Progress should only track table1
    const finalProgress = progressUpdates[progressUpdates.length - 1];
    expect(finalProgress.done).toEqual([{ name: "table1", all: 2, done: 2 }]);
  });

  it("should handle complete state lifecycle with localStorage caching", async () => {
    // Simulate cached metadata with a recent timestamp (within last month)
    const recentTimestamp = subDays(Date.now(), 7).getTime();
    const cachedMeta = { version: recentTimestamp, tables: [["cachedTable", 1]] };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedMeta));
    
    const metaTable = new SimpleMockMetaTable();
    const table = new SimpleMockInitableTable("cachedTable");
    const apiClient = new SimpleMockApiClient();
    
    // Set up API client for cached table
    apiClient.setInitFiles("cachedTable", [[{ id: "cached-data" }]]);
    apiClient.setMetaJson({ version: recentTimestamp, tables: [["cachedTable", 1]] });
    
    // Spy on fetchMetaJson to verify it's not called when using recent cache
    const fetchMetaJsonSpy = vi.spyOn(apiClient, 'fetchMetaJson');
    
    const initService = new InitService(metaTable, [table], apiClient);
    
    // Track all events and state changes
    const allEvents: Array<{ event: string; state: any; serviceState: any }> = [];
    
    initService.addEventListener("progress", (event: any) => {
      allEvents.push({
        event: "progress",
        state: event.detail,
        serviceState: clone(initService.state)
      });
    });

    // Initial state
    expect(initService.state).toBe("unknown");
    
    await initService.startInit();
    
    // Final state
    expect(initService.state).toBe("idle");
    
    // Verify complete event sequence
    expect(allEvents.length).toBeGreaterThan(0);
    
    // Should have load-meta event
    const hasLoadMeta = allEvents.some(e => e.state === "load-meta");
    expect(hasLoadMeta).toBe(true);
    
    // Should end with idle
    expect(allEvents[allEvents.length - 1].state).toBe("idle");

    // Should have progress events
    const progressEvents = allEvents.filter(e => isProgress(e.state));
    expect(progressEvents.length).toBeGreaterThan(0);
    
    // Should use cached metadata (localStorage.getItem called, fetchMetaJson not called)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("init-meta");
    expect(fetchMetaJsonSpy).not.toHaveBeenCalled();

   // Verify final results
    expect(table.getData()).toHaveLength(1);
    expect(table.getData()[0]).toEqual({ id: "cached-data" });
    expect(table.wasAfterInitCalled()).toBe(true);
    expect(await metaTable.getVersion("cachedTable")).toBe(recentTimestamp);
  });

  it("should refresh cached metadata when it's stale", async () => {
    // Simulate stale cached metadata (older than 1 month)
    const staleTimestamp = subDays(Date.now(), 40);
    const staleCachedMeta = { version: staleTimestamp, tables: [["staleTable", 1]] };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(staleCachedMeta));
    
    const metaTable = new SimpleMockMetaTable();
    const table = new SimpleMockInitableTable("freshTable");
    const apiClient = new SimpleMockApiClient();
    
    // Set up fresh metadata from API
    const freshTimestamp = Date.now();
    const freshMeta = { version: freshTimestamp, tables: [["freshTable", 2]] as Array<[string, number]> };
    apiClient.setMetaJson(freshMeta);
    apiClient.setInitFiles("freshTable", [
      [{ id: "fresh-data-1" }],
      [{ id: "fresh-data-2" }]
    ]);
    
    // Spy on both localStorage and API calls
    const fetchMetaJsonSpy = vi.spyOn(apiClient, 'fetchMetaJson');
    
    const initService = new InitService(metaTable, [table], apiClient);
    
    await initService.startInit();
    
    // Should have called API to get fresh metadata because cached was stale
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("init-meta");
    expect(fetchMetaJsonSpy).toHaveBeenCalledOnce();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "init-meta", 
      JSON.stringify(freshMeta)
    );
    
    // Should use fresh metadata (2 files instead of 1)
    expect(table.getData()).toHaveLength(2);
    expect(await metaTable.getVersion("freshTable")).toBe(freshTimestamp);
  });
});
