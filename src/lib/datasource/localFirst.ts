import {
  ClientReviewProgressAtSnapshotWithWord,
  Word,
  WordSearchResult,
} from "../types";
import { DataSource } from "./datasource";
import { fetchWithSemaphore } from "../fetch";
import { getDB } from "../frontend/db";
import { syncLexeme, syncReviewProgress } from "../frontend/data/sync";
import { syncWordIndex } from "../frontend/data/sync";
import { syncWord } from "../frontend/data/sync";
import { remoteDataSource } from "./remote";
import { localDataSource } from "./local";
import { EventEmitter } from "events";

export class LocalFirstDataSource extends EventEmitter implements DataSource {
  private localDictionaryNewEnough: Promise<boolean> = Promise.resolve(false);
  private reviewProgressNewEnough: Promise<boolean> = Promise.resolve(false);
  private _online: Promise<boolean> = this.checkOnline();

  get online() {
    return this._online;
  }

  constructor(
    private readonly remote: DataSource,
    private readonly local: DataSource,
  ) {
    super();
    (async () => {
      const online = await this.checkOnline();
      this._online = Promise.resolve(online);
      window.addEventListener("online", async () => {
        const originalOnline = await this._online;
        const online = await this.checkOnline();
        this._online = Promise.resolve(online);
        if (originalOnline !== online) {
          this.emit("online-changed", online);
        }
      });
      window.addEventListener("offline", async () => {
        const originalOnline = await this._online;
        this._online = Promise.resolve(false);
        if (originalOnline !== false) {
          this.emit("online-changed", false);
        }
      });
      setInterval(async () => {
        const online = await this.checkOnline();
        const originalOnline = await this._online;
        this._online = Promise.resolve(online);
        if (online !== originalOnline) {
          this.emit("online-changed", online);
        }
      }, 1000 * 60);

      const durationToNextDictionarySync =
        await this.durationToDictionaryNextSync();
      if (durationToNextDictionarySync > 0) {
        this.localDictionaryNewEnough = Promise.resolve(true);
        this.emit("dictionary-sync-finished");
      } else {
        this.localDictionaryNewEnough = Promise.resolve(false);
      }
      setTimeout(async () => {
        this.emit("dictionary-sync-started");
        const success = await this.syncDictionary();
        this.localDictionaryNewEnough = Promise.resolve(success);
        this.emit("dictionary-sync-finished");
        setInterval(
          async () => {
            this.emit("dictionary-sync-started");
            const success = await this.syncDictionary();
            this.localDictionaryNewEnough = Promise.resolve(success);
            this.emit("dictionary-sync-finished");
          },
          1000 * 60 * 60 * 24,
        );
      }, durationToNextDictionarySync);

      this.emit("review-sync-started");
      this.syncReviewProgress().then((success) => {
        this.reviewProgressNewEnough = Promise.resolve(success);
        this.emit("review-sync-finished");
      });
      setTimeout(
        async () => {
          this.emit("review-sync-started");
          const success = await this.syncReviewProgress();
          this.reviewProgressNewEnough = Promise.resolve(success);
          this.emit("review-sync-finished");
        },
        1000 * 60 * 60,
      );
    })();
  }

  async getWord(id: string): Promise<Word | null> {
    if (!(await this.online) || (await this.localDictionaryNewEnough)) {
      return await this.local.getWord(id);
    } else {
      return await this.remote.getWord(id);
    }
  }

  async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
    if (!(await this.online) || (await this.localDictionaryNewEnough)) {
      return await this.local.getWordsByIndexSpell(spell);
    } else {
      return await this.remote.getWordsByIndexSpell(spell);
    }
  }

  async searchWord(spell: string): Promise<Array<WordSearchResult>> {
    if (!(await this.online) || (await this.localDictionaryNewEnough)) {
      return await this.local.searchWord(spell);
    } else {
      return await this.remote.searchWord(spell);
    }
  }

  async getReviewProgressCount(): Promise<number> {
    if (!(await this.online) || (await this.reviewProgressNewEnough)) {
      return this.local.getReviewProgressCount();
    } else {
      return this.remote.getReviewProgressCount();
    }
  }

  async getReviewProgressAtSnapshotWithWord(
    snapshot: number,
    offset: number,
    limit: number,
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>> {
    // fixme: actually we should merge local and remote data even if we are in syncing progress
    if (!(await this.online) || (await this.reviewProgressNewEnough)) {
      return this.local.getReviewProgressAtSnapshotWithWord(
        snapshot,
        offset,
        limit,
      );
    } else {
      return this.remote.getReviewProgressAtSnapshotWithWord(
        snapshot,
        offset,
        limit,
      );
    }
  }

  private async checkOnline(): Promise<boolean> {
    const response = await fetchWithSemaphore(
      process.env.CF_PAGES_URL || "" + "/api/ping",
    );
    return response.status === 200;
  }

  private async durationToDictionaryNextSync(): Promise<number> {
    const db = await getDB();
    const [word, wordIndex, lexeme] = await Promise.all([
      db.meta.get("Word"),
      db.meta.get("WordIndex"),
      db.meta.get("Lexeme"),
    ]);
    if (
      word?.version === undefined ||
      wordIndex?.version === undefined ||
      lexeme?.version === undefined
    ) {
      return 0;
    }
    const tolerance = 1000 * 60 * 60 * 24;
    const lastSyncTime = Math.min(
      word.version,
      wordIndex.version,
      lexeme.version,
    );
    const now = new Date();
    const durationToNextSync = now.getTime() - (lastSyncTime + tolerance);
    return durationToNextSync > 0 ? durationToNextSync : 0;
  }

  private async syncDictionary() {
    try {
      await Promise.all([syncWord(), syncWordIndex(), syncLexeme()]);
      return true;
    } catch (e) {
      return false;
    }
  }

  private async syncReviewProgress() {
    try {
      await syncReviewProgress();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const localFirstDataSource = new LocalFirstDataSource(
  remoteDataSource,
  localDataSource,
);
