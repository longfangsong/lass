import {
  ClientReviewProgressAtSnapshotWithWord,
  ClientSideDBReviewProgress,
  Word,
  WordSearchResult,
} from "../../types";
import { DataSource } from "./datasource";
import { fetchWithSemaphore } from "../../fetch";
import { RemoteDataSource, remoteDataSource } from "./remote";
import { LocalDataSource, localDataSource } from "./local";
import { EventEmitter } from "events";
import { hoursToMilliseconds, minutesToMilliseconds } from "date-fns";

export class LocalFirstDataSource extends EventEmitter implements DataSource {
  private localDictionaryNewEnough: Promise<boolean> = Promise.resolve(false);
  private reviewProgressNewEnough: Promise<boolean> = Promise.resolve(false);
  private _online: Promise<boolean> = this.checkOnline();

  get online() {
    return this._online;
  }

  constructor(
    private readonly remote: RemoteDataSource,
    private readonly local: LocalDataSource,
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
      }, minutesToMilliseconds(1));

      const durationToNextDictionarySync =
        await this.durationToDictionaryNextSync();
      if (durationToNextDictionarySync > 0) {
        this.localDictionaryNewEnough = Promise.resolve(true);
      } else {
        this.localDictionaryNewEnough = Promise.resolve(false);
      }
      setTimeout(async () => {
        const success = await this.syncDictionary();
        this.localDictionaryNewEnough = Promise.resolve(success);
        setInterval(
          async () => {
            const success = await this.syncDictionary();
            this.localDictionaryNewEnough = Promise.resolve(success);
          },
          hoursToMilliseconds(24),
        );
      }, durationToNextDictionarySync);

      this.syncReviewProgress().then((success) => {
        this.reviewProgressNewEnough = Promise.resolve(success);
      });
      setTimeout(
        async () => {
          const success = await this.syncReviewProgress();
          this.reviewProgressNewEnough = Promise.resolve(success);
        },
        hoursToMilliseconds(1),
      );
    })();
  }

  async updateReviewProgress(reviewProgress: ClientSideDBReviewProgress) {
    await Promise.any([
      this.local.updateReviewProgress(reviewProgress),
      this.remote.updateReviewProgress(reviewProgress),
    ]);
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
      const localResult = await this.remote.getWordsByIndexSpell(spell);
      if (localResult.length !== 0) {
        return localResult;
      } else if (await this.online) {
        const remoteResult = await this.remote.getWordsByIndexSpell(spell);
        this.syncDictionary();
        return remoteResult;
      } else {
        return [];
      }
    }
  }

  async searchWord(spell: string): Promise<Array<WordSearchResult>> {
    const online = await this.online;
    const localDictionaryNewEnough = await this.localDictionaryNewEnough;
    if (!online || localDictionaryNewEnough) {
      return await this.local.searchWord(spell);
    } else {
      return await this.remote.searchWord(spell);
    }
  }

  async getReviewProgressCount(): Promise<number> {
    if (!(await this.online) || (await this.reviewProgressNewEnough)) {
      return await this.local.getReviewProgressCount();
    } else {
      return await this.remote.getReviewProgressCount();
    }
  }

  async getReviewProgressAtSnapshotWithWord(
    snapshot: number,
    offset: number,
    limit: number,
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>> {
    // const db = this.local.db;
    // if ((await db.reviewProgress.count()) === 0) {
    //   console.log("fetch review progress from remote");
      return await this.remote.getReviewProgressAtSnapshotWithWord(
        snapshot,
        offset,
        limit,
      );
    // } else {
    //   console.log("fetch review progress from local");
    //   return await this.local.getReviewProgressAtSnapshotWithWord(
    //     snapshot,
    //     offset,
    //     limit,
    //   );
    // }
  }

  private async checkOnline(): Promise<boolean> {
    try {
      const response = await fetchWithSemaphore(
        process.env.CF_PAGES_URL || "" + "/api/ping",
      );
      return response.status === 200;
    } catch (e) {
      return false;
    }
  }

  private async durationToDictionaryNextSync(): Promise<number> {
    const db = this.local.db;
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
    const tolerance = hoursToMilliseconds(24);
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
      this.emit("dictionary-sync-started");
      await Promise.all([this.local.syncWord(), this.local.syncWordIndex(), this.local.syncLexeme()]);
      this.emit("dictionary-sync-finished", true);
      return true;
    } catch (e) {
      this.emit("dictionary-sync-finished", false);
      return false;
    }
  }

  private async syncReviewProgress() {
    try {
      this.emit("review-progress-sync-started");
      await this.local.syncReviewProgress();
      this.emit("review-progress-sync-finished", true);
      return true;
    } catch (e) {
      this.emit("review-progress-sync-finished", false);
      return false;
    }
  }
}

export const localFirstDataSource = new LocalFirstDataSource(
  remoteDataSource,
  localDataSource,
);
