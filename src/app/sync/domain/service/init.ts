import { isBefore, sub, type Duration } from "date-fns";
import {
  isProgress,
  type ApiClient,
  type InitableTable,
  type InitState,
  type MetaTable,
} from "../types";
import { assert, debugAssert, logger } from "@/utils";
import { clone } from "remeda";

const META_UPDATE_INTERVAL = { months: 1 } as Duration;

export class InitService extends EventTarget {
  private initState: InitState = "unknown";
  private cachedNeedInit: boolean | null = null;

  constructor(
    private meta: MetaTable,
    private tables: InitableTable<unknown>[],
    private apiClient: ApiClient,
  ) {
    super();
  }

  get state() {
    return this.initState;
  }

  private version: number = 0;
  private tableInitFileCount: Array<[string, number]> = [];

  private setProgress(to: InitState) {
    this.initState = to;
    const event = new CustomEvent("progress", { detail: clone(to) });
    logger.event("InitService progress event:", event.detail);
    this.dispatchEvent(event);
  }

  private loadMetaJson(data: {
    version: number;
    tables: Array<[string, number]>;
  }) {
    this.version = data.version;
    this.tableInitFileCount = data.tables;
  }

  private async loadMeta() {
    const jsonMeta = localStorage.getItem("init-meta");
    if (jsonMeta) {
      this.loadMetaJson(JSON.parse(jsonMeta));
    }
    if (isBefore(this.version, sub(new Date(), META_UPDATE_INTERVAL))) {
      const jsonMeta = await this.apiClient.fetchMetaJson();
      localStorage.setItem("init-meta", JSON.stringify(jsonMeta));
      this.loadMetaJson(jsonMeta);
    }
  }

  public async needInit(): Promise<boolean> {
    if (this.cachedNeedInit !== null) {
      return this.cachedNeedInit;
    }
    for (const table of this.tables) {
      const version = await this.meta.getVersion(table.name);
      if (!version || version === 0) {
        return true;
      }
    }
    this.cachedNeedInit = false;
    return false;
  }

  public async startInit(): Promise<void> {
    if (await this.needInit() && this.state === "unknown") {
      this.setProgress("load-meta");
      await this.loadMeta();
      this.setProgress({
        done: this.tableInitFileCount.map(([tableName, fileCount]) => ({
          name: tableName,
          all: fileCount,
          done: 0,
        })),
      });
      for (const [tableName, count] of this.tableInitFileCount) {
        const table = this.tables.find((table) => table.name === tableName);
        debugAssert(table !== undefined, `Table ${tableName} not found`);
        await this.initTable(table, count);
      }
      this.setProgress("idle");
    } else if (this.state === "unknown") {
      this.setProgress("idle");
    }
  }

  private async loadOneFile<T>(table: InitableTable<T>, fileId: number) {
    const data: Array<T> = await this.apiClient.fetchInitFile(table.name, fileId);
    await table.bulkPut(data);
  }

  private async initTable<T>(table: InitableTable<T>, fileCount: number) {
    debugAssert(isProgress(this.initState));
    assert(this.version !== 0);
    const progress = this.initState;
    const index = progress.done.findIndex((item) => item.name === table.name);
    // We do not parallize this, or it will consume all bandwidth
    // and preventing other tasks (eg. query word from API) from being executed
    for (let i = 0; i < fileCount; ++i) {
      await this.loadOneFile(table, i);
      progress.done[index].done = i + 1;
      this.setProgress(progress);
    }
    await Promise.all([
      table.afterInit(),
      this.meta.setVersion(table.name, this.version),
    ]);
  }
}