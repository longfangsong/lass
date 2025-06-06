import {
  ClientReviewProgressAtSnapshotWithWord,
  ClientSideDBReviewProgress,
  DBTypes,
  Word,
  WordSearchResult,
} from "../../types";
import { DataSource } from "./datasource";
import { RemoteDataSource } from "./remote";
import { LocalDataSource } from "./local";
import { EventEmitter } from "events";
import { hoursToMilliseconds, minutesToMilliseconds } from "date-fns";
import { millisecondsInDay, millisecondsInWeek } from "date-fns/constants";

export class LocalFirstDataSource extends EventEmitter implements DataSource {
  private _localDictionaryNewEnough: Promise<boolean> = Promise.resolve(false);
  private _reviewProgressNewEnough: Promise<boolean> = Promise.resolve(false);
  private _online: Promise<boolean> = Promise.resolve(false);

  get online() {
    return this._online;
  }

  get localDictionaryNewEnough() {
    return this._localDictionaryNewEnough;
  }

  get reviewProgressNewEnough() {
    return this._reviewProgressNewEnough;
  }

  constructor(
    private readonly remote: RemoteDataSource,
    private readonly local: LocalDataSource,
  ) {
    super();
    this._online = this.checkOnline();
    (async () => {
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
        this._localDictionaryNewEnough = Promise.resolve(true);
        this.emit("dictionary-sync-finished", true);
      } else {
        this._localDictionaryNewEnough = Promise.resolve(false);
        this.emit("dictionary-sync-finished", false);
      }
      setTimeout(async () => {
        const success = await this.syncDictionary();
        this._localDictionaryNewEnough = Promise.resolve(success);
        setInterval(async () => {
          const success = await this.syncDictionary();
          this._localDictionaryNewEnough = Promise.resolve(success);
        }, hoursToMilliseconds(24));
      }, durationToNextDictionarySync);

      const last_review_sync_time =
        await this.local.db.meta.get("ReviewProgress");
      if (
        last_review_sync_time?.version &&
        new Date().getTime() - last_review_sync_time.version <
          minutesToMilliseconds(1)
      ) {
        this._reviewProgressNewEnough = Promise.resolve(true);
      }
      this.syncReviewProgress().then((success) => {
        this._reviewProgressNewEnough = Promise.resolve(success);
      });
      setTimeout(async () => {
        const success = await this.syncReviewProgress();
        this._reviewProgressNewEnough = Promise.resolve(success);
      }, hoursToMilliseconds(1));

      this.syncArticles().then(() => {
        setInterval(async () => {
          await this.syncArticles();
        }, millisecondsInDay);
      });
    })();
  }

  async getArticle(id: string): Promise<DBTypes.Article | null> {
    if (await this.online) {
      return this.remote.getArticle(id);
    } else {
      return this.local.getArticle(id);
    }
  }

  async getArticlesAndCount(
    offset: number,
    limit: number,
  ): Promise<{ articles: Array<DBTypes.ArticleMeta>; count: number }> {
    if (await this.online) {
      return this.remote.getArticlesAndCount(offset, limit);
    } else {
      return this.local.getArticlesAndCount(offset, limit);
    }
  }

  async createOrUpdateWordReview(word_id: string) {
    await this.local.createOrUpdateWordReview(word_id);
    this.syncReviewProgress();
  }

  async updateReviewProgress(reviewProgress: ClientSideDBReviewProgress) {
    await this.local.updateReviewProgress(reviewProgress);
    this.syncReviewProgress();
  }

  async getWord(id: string): Promise<Word | null> {
    if (!(await this.online) || (await this.localDictionaryNewEnough)) {
      return await this.local.getWord(id);
    } else {
      return await this.remote.getWord(id);
    }
  }

  async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
    if (!(await this.online)) {
      // not online, we can only use local
      return await this.local.getWordsByIndexSpell(spell);
    } else {
      // online, we use local first
      const localResult = await this.local.getWordsByIndexSpell(spell);
      if (localResult.length !== 0) {
        return localResult;
      } else if (await this.online) {
        // local not found, but online, try to use remote
        const remoteResult = await this.remote.getWordsByIndexSpell(spell);
        // now server state contains the word, so we need to sync the dictionary
        this.syncDictionary(true);
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
    const [online, reviewProgressNewEnough, dictionaryNewEnough] =
      await Promise.all([
        this.online,
        (async () => {
          const reviewProgress = await this.local.db.meta.get("ReviewProgress");
          const durationSinceLastSync =
            new Date().getTime() - (reviewProgress?.version || 0);
          return durationSinceLastSync < hoursToMilliseconds(1);
        })(),
        (async () => {
          const dictionaryLastSyncTime = await this.dictionaryLastSyncTime();
          const durationSinceLastSync =
            new Date().getTime() - dictionaryLastSyncTime;
          return durationSinceLastSync < millisecondsInWeek;
        })(),
      ]);
    if (online && (!reviewProgressNewEnough || !dictionaryNewEnough)) {
      return await this.remote.getReviewProgressAtSnapshotWithWord(
        snapshot,
        offset,
        limit,
      );
    } else {
      return await this.local.getReviewProgressAtSnapshotWithWord(
        snapshot,
        offset,
        limit,
      );
    }
  }

  private async checkOnline(): Promise<boolean> {
    const online = await this.remote.checkOnline();
    return online;
  }

  async dictionaryLastSyncTime(): Promise<number> {
    const db = this.local.db;
    const [word, wordIndex, lexeme] = await Promise.all([
      db.meta.get("Word"),
      db.meta.get("WordIndex"),
      db.meta.get("Lexeme"),
    ]);
    return Math.min(
      word?.version || 0,
      wordIndex?.version || 0,
      lexeme?.version || 0,
    );
  }

  private async durationToDictionaryNextSync(): Promise<number> {
    // | last sync time
    //               | nextSyncTime = last sync time + tolerance
    //        | now here: new enough, no need to sync
    //        |------| : nextSyncTime - now <= 0
    //                          | now here: need to sync
    //               |++++++++++| : nextSyncTime - now > 0
    const lastSyncTime = await this.dictionaryLastSyncTime();
    const tolerance = hoursToMilliseconds(24);
    const nextSyncTime = lastSyncTime + tolerance;
    const now = new Date();
    const durationToNextSync = nextSyncTime - now.getTime();
    return durationToNextSync > 0 ? durationToNextSync : 0;
  }

  private async syncDictionary(force: boolean = false) {
    try {
      this.emit("dictionary-sync-started");
      await Promise.all([
        this.local.syncWord(force),
        this.local.syncWordIndex(force),
        this.local.syncLexeme(force),
      ]);
      this.emit("dictionary-sync-finished", true);
      return true;
    } catch {
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
    } catch {
      this.emit("review-progress-sync-finished", false);
      return false;
    }
  }

  private async syncArticles() {
    try {
      this.emit("articles-sync-started");
      await this.local.syncArticles();
      this.emit("articles-sync-finished", true);
      return true;
    } catch {
      this.emit("articles-sync-finished", false);
      return false;
    }
  }

  async clearReviewProgress() {
    console.log("clear review progress");
    await this.local.db.transaction(
      "rw",
      this.local.db.reviewProgress,
      this.local.db.meta,
      async () => {
        await this.local.db.reviewProgress.clear();
        await this.local.db.meta.delete("ReviewProgress");
      },
    );
  }
}

export const localFirstDataSource = new LocalFirstDataSource(
  new RemoteDataSource(),
  new LocalDataSource(),
);
