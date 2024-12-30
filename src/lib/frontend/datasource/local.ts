import { DataSource } from "./datasource";
import {
  ClientReviewProgressAtSnapshotWithWord,
  ClientSideDBReviewProgress,
  ClientSideReviewProgressAtSnapshot,
  DBTypes,
  Word,
  WordSearchResult,
} from "../../types";
import { type Dexie as TDexie, type EntityTable, Dexie } from "dexie";
import Semaphore from "semaphore-promise";
import { fetchWithSemaphore } from "@/lib/fetch";
import { hoursToMilliseconds } from "date-fns";
import { millisecondsInDay } from "date-fns/constants";
import assert from "assert";

const maxDate = 8640000000000000;

export type DB = TDexie & {
  meta: EntityTable<
    {
      table_name: string;
      version: number;
    },
    "table_name"
  >;
  word: EntityTable<DBTypes.Word, "id">;
  wordIndex: EntityTable<DBTypes.WordIndex, "id">;
  lexeme: EntityTable<DBTypes.Lexeme, "id">;
  reviewProgress: EntityTable<ClientSideDBReviewProgress, "id">;
};

const REVIEW_GAP_DAYS = [0, 1, 3, 7, 15, 30];
const PAGE_SIZE = 5000;

export class LocalDataSource implements DataSource {
  private INIT_TIME = 1734783524009;
  private INIT_TABLE_FILE_COUNT = {
    Word: 1,
    WordIndex: 8,
    Lexeme: 2,
  };
  private syncSemaphore = new Semaphore(1);
  public db: DB;

  constructor() {
    this.db = new Dexie("lass") as TDexie & DB;
    this.db.version(1).stores({
      meta: "table_name",
      word: "id, lemma, update_time",
      wordIndex: "id, word_id, spell, update_time",
      lexeme: "id, word_id, update_time",
      reviewProgress: "id, word_id, update_time",
    });
  }

  async createOrUpdateWordReview(word_id: string) {
    const reviewProgress = await this.db.reviewProgress
      .where("word_id")
      .equals(word_id)
      .first();
    if (reviewProgress) {
      reviewProgress.query_count += 1;
      await this.db.reviewProgress.put(reviewProgress);
    } else {
      const now = new Date().getTime();
      const newProgress = {
        id: crypto.randomUUID(),
        word_id,
        query_count: 1,
        review_count: 0,
        last_last_review_time: null,
        last_review_time: now,
        update_time: now,
      };
      await this.db.reviewProgress.add(newProgress);
    }
  }

  async getReviewProgressAtSnapshotWithWord(
    snapshotTime: number,
    offset: number,
    limit: number
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>> {
    const localValue = localStorage.getItem(`review-${snapshotTime}`);
    if (localValue) {
      const ids: Array<string> = JSON.parse(localValue);
      console.log("snapshot served from cache");
      const reviewProgresses = (await this.db.reviewProgress.bulkGet(
        ids
      )) as Array<ClientSideDBReviewProgress>;
      let reviewProgressesAtSnapshot: Array<ClientSideReviewProgressAtSnapshot> =
        this.toSnapshot(reviewProgresses, snapshotTime);
      return await Promise.all(
        reviewProgressesAtSnapshot
          .slice(offset, offset + limit)
          .map(async (progress) => {
            const word = await this.getWord(progress.word_id);
            return { ...progress, ...word! };
          })
      );
    } else {
      const reviewProgresses = await this.db.reviewProgress.toArray();
      let reviewProgressesAtSnapshot: Array<ClientSideReviewProgressAtSnapshot> =
        this.toSnapshot(reviewProgresses, snapshotTime);
      reviewProgressesAtSnapshot = reviewProgressesAtSnapshot
        .sort((a, b) => {
          return (
            a.snapshot_next_reviewable_time! - b.snapshot_next_reviewable_time!
          );
        })
        .map((it) => ({
          ...it,
          snapshot_next_reviewable_time:
            it.snapshot_next_reviewable_time! === maxDate
              ? null
              : it.snapshot_next_reviewable_time!,
          next_reviewable_time:
            it.next_reviewable_time! === maxDate
              ? null
              : it.next_reviewable_time!,
        }));
      (async () => {
        Object.keys(localStorage)
          .filter((key) => key.startsWith("review-"))
          .forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(
          `review-${snapshotTime}`,
          JSON.stringify(reviewProgressesAtSnapshot.map((it) => it.id))
        );
      })();
      return await Promise.all(
        reviewProgressesAtSnapshot
          .slice(offset, offset + limit)
          .map(async (progress) => {
            const word = await this.getWord(progress.word_id);
            return { ...word!, ...progress };
          })
      );
    }
  }

  private toSnapshot(
    reviewProgresses: ClientSideDBReviewProgress[],
    snapshotTime: number
  ): ClientSideReviewProgressAtSnapshot[] {
    return reviewProgresses.map((progress) => {
      let next_reviewable_time;
      let snapshot_next_reviewable_time;
      if (progress.last_review_time === null) {
        // not reviewed yet
        assert(
          progress.last_last_review_time === null,
          "last_review_time is null but last_last_review_time is not null"
        );
        assert(
          progress.review_count === 0,
          "last_review_time is null but review_count is not 0"
        );
        next_reviewable_time = 0;
        snapshot_next_reviewable_time = 0;
      } else if (REVIEW_GAP_DAYS[progress.review_count] === undefined) {
        // done all reviews
        next_reviewable_time = Number.MAX_SAFE_INTEGER;
        if (
          progress.last_last_review_time &&
          snapshotTime < progress.last_review_time
        ) {
          // snapshot is before last review time
          // snapshot_next_reviewable_time is based on (progress.review_count - 1)th review and last_last_review_time
          snapshot_next_reviewable_time =
            progress.last_last_review_time +
            millisecondsInDay * REVIEW_GAP_DAYS[progress.review_count - 1];
        } else {
          snapshot_next_reviewable_time = next_reviewable_time;
        }
      } else if (snapshotTime < progress.last_review_time) {
        // snapshot is before last review time
        // snapshot_next_reviewable_time is based on (progress.review_count - 1)th review and last_last_review_time
        if (progress.last_last_review_time === null) {
          assert(
            progress.review_count === 0,
            "last_last_review_time is null but review_count is not 0"
          );
          snapshot_next_reviewable_time =
            progress.last_review_time +
            millisecondsInDay * REVIEW_GAP_DAYS[progress.review_count - 1];
        } else {
          snapshot_next_reviewable_time =
            progress.last_last_review_time +
            millisecondsInDay * REVIEW_GAP_DAYS[progress.review_count - 1];
        }
        // next_reviewable_time is calculated normally based on last_review_time
        next_reviewable_time =
          progress.last_review_time +
          millisecondsInDay * REVIEW_GAP_DAYS[progress.review_count];
      } else {
        next_reviewable_time =
          progress.last_review_time +
          millisecondsInDay * REVIEW_GAP_DAYS[progress.review_count];
        snapshot_next_reviewable_time = next_reviewable_time;
      }
      return {
        ...progress,
        snapshot_next_reviewable_time: Math.min(
          snapshot_next_reviewable_time,
          maxDate
        ),
        next_reviewable_time: Math.min(next_reviewable_time, maxDate),
      };
    });
  }

  async getReviewProgressCount(): Promise<number> {
    return await this.db.reviewProgress.count();
  }

  async getWord(id: string): Promise<Word | null> {
    const word = await this.db.word.get(id);
    if (word === undefined) {
      return null;
    }
    const indexes = await this.db.wordIndex
      .where("word_id")
      .equals(id)
      .toArray();
    const lexemes = await this.db.lexeme
      .where("word_id")
      .equals(word.id)
      .toArray();
    return { ...word, indexes, lexemes };
  }

  async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
    const directMatch = await this.db.word
      .where("lemma")
      .equals(spell)
      .toArray();
    const formMatch = await this.db.wordIndex
      .where("spell")
      .equals(spell)
      .toArray()
      .then((indexes) =>
        indexes.filter((it) => it.form !== null).map((it) => it.word_id)
      )
      .then((ids) => this.db.word.where("id").anyOf(ids).toArray())
      .then((result) => result.sort((a, b) => a.lemma.length - b.lemma.length));
    const found = new Set();
    let resultWords: Array<DBTypes.Word> = [];
    for (const word of directMatch) {
      if (!found.has(word.id)) {
        found.add(word.id);
        resultWords.push(word);
      }
    }
    for (const word of formMatch) {
      if (!found.has(word.id)) {
        found.add(word.id);
        resultWords.push(word);
      }
    }
    if (resultWords.length === 0) {
      resultWords = await this.db.wordIndex
        .where("spell")
        .equals(spell)
        .toArray()
        .then((indexes) => indexes.map((it) => it.word_id))
        .then((ids) => this.db.word.where("id").anyOf(ids).toArray())
        .then((result) =>
          result.sort(
            (a, b) =>
              Math.abs(a.lemma.length - spell.length) -
              Math.abs(b.lemma.length - spell.length)
          )
        );
    }
    if (resultWords.length === 0 && spell[0].toLocaleUpperCase() === spell[0]) {
      return await this.getWordsByIndexSpell(spell.toLowerCase());
    }
    const result = await Promise.all(
      resultWords.map(async (word) => {
        const [indexes, lexemes] = await Promise.all([
          this.db.wordIndex.where("word_id").equals(word.id).toArray(),
          this.db.lexeme.where("word_id").equals(word.id).toArray(),
        ]);
        return { ...word, indexes, lexemes };
      })
    );
    return result;
  }

  async searchWord(spell: string): Promise<Array<WordSearchResult>> {
    const startTime = new Date();
    // words which `lemma` is "spell"
    const directMatchTask = this.db.word
      .where("lemma")
      .equals(spell)
      .toArray()
      .then((words) => {
        console.log(
          `Direct match ${spell}, found ${words.length} in local, took ${
            new Date().getTime() - startTime.getTime()
          }ms`
        );
        return words;
      });

    // words which is a form of the word "spell"
    const formMatchTask = this.db.wordIndex
      .where("spell")
      .equals(spell)
      .filter((index) => index.form !== null)
      .toArray()
      .then((indexes) =>
        Promise.all(indexes.map((index) => this.db.word.get(index.word_id)))
      )
      .then((words) => {
        console.log(
          `Form match ${spell}, found ${words.length} in local, took ${
            new Date().getTime() - startTime.getTime()
          }ms`
        );
        return words;
      });

    // words which `lemma` start with "spell"
    const likeMatchTask = this.db.word
      .where("lemma")
      .startsWith(spell)
      .toArray()
      .then((words) => {
        console.log(
          `Like match ${spell}, found ${words.length} in local, took ${
            new Date().getTime() - startTime.getTime()
          }ms`
        );
        return words;
      });

    // words which has an index which starts in "spell"
    const likeFormMatchIndexesTask = this.db.wordIndex
      .where("spell")
      .startsWith(spell)
      .toArray()
      .then((indexes) => {
        const resultSet = new Set<string>();
        indexes.forEach((index) => resultSet.add(index.word_id));
        return Array.from(resultSet);
      });
    const likeFormMatchTask = (async () => {
      const word_ids = await likeFormMatchIndexesTask;
      const words = await this.db.word.bulkGet(word_ids);
      console.log(
        `Like form match ${spell}, found ${words.length} in local, took ${
          new Date().getTime() - startTime.getTime()
        }ms`
      );
      return words;
    })();

    const [directMatch, formMatch, likeMatch, likeFormMatch] =
      await Promise.all([
        directMatchTask,
        formMatchTask,
        likeMatchTask,
        likeFormMatchTask,
      ]);
    let words = [...directMatch, ...formMatch, ...likeMatch, ...likeFormMatch];
    const seen = new Set<string>();
    words = words.filter((word) => {
      if (!word || seen.has(word.id)) {
        return false;
      }
      seen.add(word.id);
      return true;
    });
    const result = await Promise.all(
      words.map(async (word) => {
        const lexemes = await this.db.lexeme
          .where("word_id")
          .equals(word!.id)
          .toArray();
        return {
          id: word!.id,
          lemma: word!.lemma,
          definitions: lexemes.map((lexeme) => lexeme.definition),
        };
      })
    );
    if (result.length === 0 && spell[0].toLocaleUpperCase() === spell[0]) {
      console.log(
        `${spell} not found in local, search ${spell.toLowerCase()} instead.`
      );
      return await this.searchWord(spell.toLowerCase());
    }
    const endTime = new Date();
    console.log(
      `Search word ${spell} in local took ${
        endTime.getTime() - startTime.getTime()
      }ms`
    );
    return result;
  }

  async updateReviewProgress(
    reviewProgress: ClientSideDBReviewProgress
  ): Promise<void> {
    await this.db.reviewProgress.put(reviewProgress);
  }

  private async initReadonlyTable<T>(
    table: EntityTable<T, keyof T>,
    tableName: keyof typeof this.INIT_TABLE_FILE_COUNT
  ) {
    const now = new Date();
    const db = table.db as DB;
    let resultLength = 0;
    const syncFetchSemaphore = new Semaphore(3);
    await Promise.all(
      [...Array(this.INIT_TABLE_FILE_COUNT[tableName]).keys()].map(
        async (i) => {
          const syncRelease = await syncFetchSemaphore.acquire();
          const initData = await fetch(
            `/dictionary-init/${tableName}/${i}.json`
          );
          if (!initData.ok) {
            throw new Error(initData.statusText);
          }
          const result: Array<T> = await initData.json();
          table.bulkPut(result);
          syncRelease();
          resultLength += result.length;
        }
      )
    );
    await db.meta.put({ table_name: tableName, version: this.INIT_TIME });
    console.log(
      `Init ${tableName} with ${resultLength} items in ${
        new Date().getTime() - now.getTime()
      }ms`
    );
  }

  private async pullUpdateReadonly<T>(
    table: EntityTable<T, keyof T>,
    tableName: keyof typeof this.INIT_TABLE_FILE_COUNT,
    lastUpdatedTime: number
  ) {
    const db = table.db as DB;
    const now = new Date();
    let currentOffset = 0;
    while (true) {
      const response = await fetchWithSemaphore(
        `/api/sync?table=${tableName}&limit=${PAGE_SIZE}&offset=${currentOffset}&updated_after=${lastUpdatedTime}&updated_before=${now.getTime()}`
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const result: Array<T> = await response.json();
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
      }ms`
    );
  }

  private async initOrPullUpdateReadonly<T>(
    table: EntityTable<T, keyof T>,
    tableName: keyof typeof this.INIT_TABLE_FILE_COUNT
  ) {
    const release = await this.syncSemaphore.acquire();
    const meta = await this.db.meta.get(tableName);
    if (meta === undefined) {
      await this.initReadonlyTable<T>(table, tableName);
      release();
      await this.initOrPullUpdateReadonly(table, tableName);
    } else {
      const now = new Date();
      const lastUpdatedTime = meta.version;
      const isNewEnough =
        now.getTime() - lastUpdatedTime < hoursToMilliseconds(24);
      if (isNewEnough) {
        release();
        return;
      } else {
        await this.pullUpdateReadonly(table, tableName, lastUpdatedTime);
        release();
      }
    }
  }

  async syncWord() {
    console.log("syncing word");
    await this.initOrPullUpdateReadonly(
      this.db.word as EntityTable<DBTypes.Word, keyof DBTypes.Word>,
      "Word"
    );
    console.log("synced word");
  }

  async syncWordIndex() {
    console.log("syncing word index");
    await this.initOrPullUpdateReadonly(
      this.db.wordIndex as EntityTable<
        DBTypes.WordIndex,
        keyof DBTypes.WordIndex
      >,
      "WordIndex"
    );
    console.log("synced word index");
  }

  async syncLexeme() {
    console.log("syncing lexeme");
    await this.initOrPullUpdateReadonly(
      this.db.lexeme as EntityTable<DBTypes.Lexeme, keyof DBTypes.Lexeme>,
      "Lexeme"
    );
    console.log("synced lexeme");
  }

  private async pushPullUpdateReadwrite<T>(
    table: EntityTable<T, keyof T>,
    tableName: string,
    lastUpdatedTime: number
  ) {
    const now = new Date();
    let currentLocalOffset = 0;
    let currentRemoteOffset = 0;
    const release = await this.syncSemaphore.acquire();
    while (true) {
      const localNewData =
        lastUpdatedTime === 0
          ? []
          : await table
              .where("update_time")
              .between(lastUpdatedTime, now.getTime())
              .offset(currentLocalOffset)
              .limit(PAGE_SIZE)
              .toArray();
      const remoteNewDataResponse = await fetchWithSemaphore(
        `/api/sync?table=${tableName}&limit=${PAGE_SIZE}&offset=${currentRemoteOffset}&updated_after=${lastUpdatedTime}&updated_before=${now.getTime()}`,
        {
          method: "POST",
          body: JSON.stringify(localNewData),
        }
      );
      if (!remoteNewDataResponse.ok) {
        throw new Error(remoteNewDataResponse.statusText);
      }
      const remoteNewData: Array<T> = await remoteNewDataResponse.json();
      table.bulkPut(remoteNewData);
      currentLocalOffset += localNewData.length;
      currentRemoteOffset += remoteNewData.length;
      if (remoteNewData.length < PAGE_SIZE && localNewData.length < PAGE_SIZE) {
        break;
      }
    }
    release();
    await this.db.meta.put({ table_name: tableName, version: now.getTime() });
    console.log(
      `Sync ${tableName}, upload ${currentLocalOffset} and download ${currentRemoteOffset} items in ${
        new Date().getTime() - now.getTime()
      }ms`
    );
  }

  async syncReviewProgress() {
    console.log("syncing reviewProgress");
    const meta = await this.db.meta.get("ReviewProgress");
    await this.pushPullUpdateReadwrite(
      this.db.reviewProgress as EntityTable<
        DBTypes.ReviewProgress,
        keyof DBTypes.ReviewProgress
      >,
      "ReviewProgress",
      meta?.version || 0
    );
    console.log("synced reviewProgress");
  }
}

export const localDataSource = new LocalDataSource();
