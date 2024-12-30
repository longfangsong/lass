import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LocalFirstDataSource } from "./localFirst";
import { localDataSource, LocalDataSource } from "./local";
import { RemoteDataSource } from "./remote";
import {
  Word,
  WordSearchResult,
  ClientReviewProgressAtSnapshotWithWord,
} from "../../types";
import { resolve } from "path";
import EventEmitter from "events";
import { millisecondsInDay, millisecondsInMinute } from "date-fns/constants";

class MockRemoteDataSource extends RemoteDataSource {
  online = true;
  words: Array<Word> = [];
  wordResults: Array<WordSearchResult> = [];
  progressAtSnapshotWithWord: Array<ClientReviewProgressAtSnapshotWithWord> = [];

  override async checkOnline(): Promise<boolean> {
    return this.online;
  }

  override async getWord(_id: string): Promise<Word | null> {
    return this.words[0] || null;
  }

  override async searchWord(_spell: string): Promise<Array<WordSearchResult>> {
    return this.wordResults;
  }

  override async getReviewProgressAtSnapshotWithWord(
    _snapshot: number,
    _offset: number,
    _limit: number
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>> {
    return this.progressAtSnapshotWithWord;
  }

  override async getWordsByIndexSpell(_spell: string): Promise<Array<Word>> {
    return this.words;
  }
}

describe("LocalFirstDataSource", () => {
  beforeEach(async() => {
    const window = {
        addEventListener: () => {},
    };
    vi.stubGlobal('window', window);

    indexedDB = new IDBFactory();
    let localDataSource = new LocalDataSource();
    await localDataSource.db.open();
    await localDataSource.db.word?.clear();
    await localDataSource.db.wordIndex?.clear();
    await localDataSource.db.lexeme?.clear();
    await localDataSource.db.reviewProgress?.clear();
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchWord", () => {
    it("from local when local is new enough", async () => {
      const mockRemote = new MockRemoteDataSource();
      const local = new LocalDataSource();
      const datasource = new LocalFirstDataSource(mockRemote, local);
      const words: Array<Word> = [
        {
            id: crypto.randomUUID(),
            lemma: "test",
            update_time: Date.now(),
            part_of_speech: "noun",
            phonetic: "test",
            phonetic_voice: null,
            phonetic_url: null,
            indexes: [],
            lexemes: [],
        },
        {
          id: crypto.randomUUID(),
          lemma: "other",
          update_time: Date.now(),
          part_of_speech: "noun",
          phonetic: "test",
          phonetic_voice: null,
          phonetic_url: null,
          indexes: [],
          lexemes: [],
        },
      ];
      for (const word of words) {
        await local.db.word?.add(word);
        for (const index of word.indexes) {
          await local.db.wordIndex?.add(index);
        }
        for (const lexeme of word.lexemes) {
          await local.db.lexeme?.add(lexeme);
        }
      }
      const now = new Date();
      local.db.meta.add({
        table_name: "Word",
        version: now.getTime(),
      });
      local.db.meta.add({
        table_name: "WordIndex",
        version: now.getTime(),
      });
      local.db.meta.add({
        table_name: "Lexeme",
        version: now.getTime(),
      });
      mockRemote.wordResults = [
        {
          id: crypto.randomUUID(),
          lemma: "not this",
          definitions: [],
        },
      ];
      mockRemote.online = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = await datasource.searchWord("test");
      expect(result.length).toEqual(1);
      expect(result[0].id).toEqual(words[0].id);
    });
    it("from local when offline", async () => {
        vi.useFakeTimers();
        const mockRemote = new MockRemoteDataSource();
        const local = new LocalDataSource();
        const datasource = new LocalFirstDataSource(mockRemote, local);
        const words: Array<Word> = [
          {
              id: crypto.randomUUID(),
              lemma: "test",
              update_time: Date.now(),
              part_of_speech: "noun",
              phonetic: "test",
              phonetic_voice: null,
              phonetic_url: null,
              indexes: [],
              lexemes: [],
          },
          {
            id: crypto.randomUUID(),
            lemma: "other",
            update_time: Date.now(),
            part_of_speech: "noun",
            phonetic: "test",
            phonetic_voice: null,
            phonetic_url: null,
            indexes: [],
            lexemes: [],
          },
        ];
        for (const word of words) {
          await local.db.word?.add(word);
          for (const index of word.indexes) {
            await local.db.wordIndex?.add(index);
          }
          for (const lexeme of word.lexemes) {
            await local.db.lexeme?.add(lexeme);
          }
        }
        const now = new Date();
        local.db.meta.add({
          table_name: "Word",
          version: now.getTime(),
        });
        local.db.meta.add({
          table_name: "WordIndex",
          version: now.getTime(),
        });
        local.db.meta.add({
          table_name: "Lexeme",
          version: now.getTime(),
        });
        const remoteId = crypto.randomUUID();
        mockRemote.wordResults = [
          {
            id: remoteId,
            lemma: "test",
            definitions: [],
          },
        ];
        mockRemote.online = false;
        console.log("===================");
        await vi.advanceTimersByTimeAsync(millisecondsInDay * 3);
        console.log("===================");
        const localDictionaryNewEnough = await datasource.localDictionaryNewEnough;
        expect(localDictionaryNewEnough).toEqual(false);
        const online = await datasource.online;
        expect(online).toEqual(false);
        const result = await datasource.searchWord("test");
        expect(result.length).toEqual(1);
        expect(result[0].id).toEqual(words[0].id);
        vi.useRealTimers();
    });
    it("from remote when local is not new enough", async () => {
        vi.useFakeTimers();
        const mockRemote = new MockRemoteDataSource();
        const local = new LocalDataSource();
        const datasource = new LocalFirstDataSource(mockRemote, local);
        const words: Array<Word> = [
          {
              id: crypto.randomUUID(),
              lemma: "test",
              update_time: Date.now(),
              part_of_speech: "noun",
              phonetic: "test",
              phonetic_voice: null,
              phonetic_url: null,
              indexes: [],
              lexemes: [],
          },
          {
            id: crypto.randomUUID(),
            lemma: "other",
            update_time: Date.now(),
            part_of_speech: "noun",
            phonetic: "test",
            phonetic_voice: null,
            phonetic_url: null,
            indexes: [],
            lexemes: [],
          },
        ];
        for (const word of words) {
          await local.db.word?.add(word);
          for (const index of word.indexes) {
            await local.db.wordIndex?.add(index);
          }
          for (const lexeme of word.lexemes) {
            await local.db.lexeme?.add(lexeme);
          }
        }
        const now = new Date();
        local.db.meta.add({
          table_name: "Word",
          version: now.getTime(),
        });
        local.db.meta.add({
          table_name: "WordIndex",
          version: now.getTime(),
        });
        local.db.meta.add({
          table_name: "Lexeme",
          version: now.getTime(),
        });
        const remoteId = crypto.randomUUID();
        mockRemote.wordResults = [
          {
            id: remoteId,
            lemma: "test",
            definitions: [],
          },
        ];
        mockRemote.online = true;
        vi.advanceTimersByTime(millisecondsInMinute * 2);
        const localDictionaryNewEnough = await datasource.localDictionaryNewEnough;
        expect(localDictionaryNewEnough).toEqual(false);
        const result = await datasource.searchWord("test");
        expect(result.length).toEqual(1);
        expect(result[0].id).toEqual(remoteId);
        vi.useRealTimers();
    });
  });
});
