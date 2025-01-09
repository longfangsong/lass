import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LocalDataSource } from "./local";
import { ClientSideDBReviewProgress, DBTypes, Lexeme, Word } from "../../types";
import { type Dexie as TDexie, type EntityTable, Dexie } from "dexie";
class MockSyncAPI {
  private mockInitWords: Array<DBTypes.Word>;
  private mockInitWordIndexes: Array<DBTypes.WordIndex>;
  private mockInitLexemes: Array<DBTypes.Lexeme>;

  public mockSyncWordResponse: Array<DBTypes.Word> = [];
  public mockSyncWordIndexResponse: Array<DBTypes.WordIndex> = [];
  public mockSyncLexemeResponse: Array<DBTypes.Lexeme> = [];
  public mockSyncReviewProgressResponse: Array<ClientSideDBReviewProgress> = [];
  public expectedUploadingReviewProgress:
    | Array<ClientSideDBReviewProgress>
    | undefined = undefined;

  constructor(
    mockInitWords: Array<DBTypes.Word>,
    mockInitWordIndexes: Array<DBTypes.WordIndex>,
    mockInitLexemes: Array<DBTypes.Lexeme>
  ) {
    this.mockInitWords = mockInitWords;
    this.mockInitWordIndexes = mockInitWordIndexes;
    this.mockInitLexemes = mockInitLexemes;
  }

  async on() {
    // @ts-expect-error temporary fix
    global.fetch = vi.fn(async (url, options) => {
      let jsonResponse:
        | Array<DBTypes.Word>
        | Array<DBTypes.WordIndex>
        | Array<DBTypes.Lexeme>
        | Array<ClientSideDBReviewProgress> = [];
      if (url.includes("/dictionary-init/Word/0.json")) {
        jsonResponse = this.mockInitWords;
      } else if (url.includes("/dictionary-init/WordIndex/0.json")) {
        jsonResponse = this.mockInitWordIndexes;
      } else if (url.includes("/dictionary-init/Lexeme/0.json")) {
        jsonResponse = this.mockInitLexemes;
      } else if (url.includes("/api/sync")) {
        const params = new URLSearchParams(url.replace("/api/sync?", ""));
        const table = params.get("table");
        switch (table) {
          case "Word":
            jsonResponse = this.mockSyncWordResponse;
            break;
          case "WordIndex":
            jsonResponse = this.mockSyncWordIndexResponse;
            break;
          case "Lexeme":
            jsonResponse = this.mockSyncLexemeResponse;
            break;
          case "ReviewProgress": {
            const body = JSON.parse(options?.body as string);
            if (
              options?.method === "POST" &&
              this.expectedUploadingReviewProgress
            ) {
              expect(this.expectedUploadingReviewProgress).toEqual(body);
            }
            jsonResponse = this.mockSyncReviewProgressResponse;
            break;
          }
          default:
            jsonResponse = [];
        }
      }
      return {
        json: async () => jsonResponse,
        ok: true,
      };
    });
  }
}

describe("LocalDataSource", () => {
  let localDataSource: LocalDataSource;

  beforeEach(async () => {
    indexedDB = new IDBFactory();
    localDataSource = new LocalDataSource();
    await localDataSource.db.open();
    await localDataSource.db.word?.clear();
    await localDataSource.db.wordIndex?.clear();
    await localDataSource.db.lexeme?.clear();
    await localDataSource.db.reviewProgress?.clear();
    await localDataSource.db.meta?.clear();
    localStorage.clear();
  });

  afterEach(async () => {
    await localDataSource.db.close();
  });

  describe("getWord", () => {
    it("should return null for non-existent word", async () => {
      const result = await localDataSource.getWord("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return word with its indexes and lexemes", async () => {
      const wordId = crypto.randomUUID();
      const testWord: DBTypes.Word = {
        id: wordId,
        lemma: "test",
        update_time: Date.now(),
        part_of_speech: "noun",
        phonetic: "test",
        phonetic_voice: null,
        phonetic_url: null,
      };
      const testIndex: DBTypes.WordIndex = {
        id: crypto.randomUUID(),
        word_id: wordId,
        spell: "test",
        form: null,
        update_time: Date.now(),
      };
      const testLexeme: DBTypes.Lexeme = {
        id: crypto.randomUUID(),
        word_id: wordId,
        definition: "test definition",
        example: "test example",
        example_meaning: "test example meaning",
        source: "test",
        update_time: Date.now(),
      };
      const anotherLexeme: DBTypes.Lexeme = {
        id: crypto.randomUUID(),
        word_id: wordId,
        definition: "another definition",
        example: "another example",
        example_meaning: "another example meaning",
        source: "another",
        update_time: Date.now(),
      };

      await localDataSource.db.word.add(testWord);
      await localDataSource.db.wordIndex.add(testIndex);
      await localDataSource.db.lexeme.add(testLexeme);
      await localDataSource.db.lexeme.add(anotherLexeme);

      const result = await localDataSource.getWord(wordId);
      expect(result).toEqual({
        ...testWord,
        indexes: [testIndex],
        lexemes: expect.arrayContaining([testLexeme, anotherLexeme]),
      });
    });
  });

  describe("searchWord", () => {
    it("should find exact matches by lemma", async () => {
      const wordId = crypto.randomUUID();
      const testWord: DBTypes.Word = {
        id: wordId,
        lemma: "test",
        update_time: Date.now(),
        part_of_speech: "noun",
        phonetic: "test",
        phonetic_voice: null,
        phonetic_url: null,
      };
      const textIndex: DBTypes.WordIndex = {
        id: crypto.randomUUID(),
        word_id: wordId,
        spell: "index spell",
        form: null,
        update_time: Date.now(),
      };
      const testLexeme: DBTypes.Lexeme = {
        id: crypto.randomUUID(),
        word_id: wordId,
        definition: "test definition",
        example: "test example",
        example_meaning: "test example meaning",
        source: "test",
        update_time: Date.now(),
      };

      await localDataSource.db.word.add(testWord);
      await localDataSource.db.wordIndex.add(textIndex);
      await localDataSource.db.lexeme.add(testLexeme);

      const results = await localDataSource.searchWord("test");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: wordId,
        lemma: "test",
        definitions: ["test definition"],
      });
    });

    it("should find words by form", async () => {
      const wordId = crypto.randomUUID();
      const testWord: DBTypes.Word = {
        id: wordId,
        lemma: "run",
        update_time: Date.now(),
        part_of_speech: "verb",
        phonetic: "rʌn",
        phonetic_voice: null,
        phonetic_url: null,
      };
      const testIndex: DBTypes.WordIndex = {
        id: crypto.randomUUID(),
        word_id: wordId,
        spell: "ran",
        form: "past",
        update_time: Date.now(),
      };
      const testLexeme: DBTypes.Lexeme = {
        id: crypto.randomUUID(),
        word_id: wordId,
        definition: "test definition",
        example: "test example",
        example_meaning: "test example meaning",
        source: "test",
        update_time: Date.now(),
      };

      await localDataSource.db.word.add(testWord);
      await localDataSource.db.wordIndex.add(testIndex);
      await localDataSource.db.lexeme.add(testLexeme);

      const results = await localDataSource.searchWord("ran");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: wordId,
        lemma: "run",
        definitions: ["test definition"],
      });
    });

    it("should sort the results correctly", async () => {
      const testWords: Array<DBTypes.Word> = [
        {
          id: crypto.randomUUID(),
          lemma: "qwerty",
          update_time: Date.now(),
          part_of_speech: "noun",
          phonetic: "test",
          phonetic_voice: null,
          phonetic_url: null,
        },
        {
          id: crypto.randomUUID(),
          lemma: "asdfgh",
          update_time: Date.now(),
          part_of_speech: "noun",
          phonetic: "test2",
          phonetic_voice: null,
          phonetic_url: null,
        },
        {
          id: crypto.randomUUID(),
          lemma: "zxcvbn",
          update_time: Date.now(),
          part_of_speech: "noun",
          phonetic: "test3",
          phonetic_voice: null,
          phonetic_url: null,
        },
        {
          id: crypto.randomUUID(),
          lemma: "asdfghuiop",
          update_time: Date.now(),
          part_of_speech: "noun",
          phonetic: "test4",
          phonetic_voice: null,
          phonetic_url: null,
        },
      ];
      const testIndexes: Array<DBTypes.WordIndex> = [
        {
          id: crypto.randomUUID(),
          word_id: testWords[0].id,
          spell: "asdfgh",
          form: "testForm",
          update_time: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          word_id: testWords[1].id,
          spell: "secondIndex",
          form: null,
          update_time: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          word_id: testWords[2].id,
          spell: "asdfghjkl",
          form: null,
          update_time: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          word_id: testWords[3].id,
          spell: "fourthIndex",
          form: null,
          update_time: Date.now(),
        },
      ];
      const testLexemes: Array<DBTypes.Lexeme> = [
        {
          id: crypto.randomUUID(),
          word_id: testWords[0].id,
          definition: "test definition",
          example: "test example",
          example_meaning: "test example meaning",
          source: "test",
          update_time: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          word_id: testWords[1].id,
          definition: "test definition",
          example: "test example",
          example_meaning: "test example meaning",
          source: "test",
          update_time: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          word_id: testWords[2].id,
          definition: "test definition",
          example: "test example",
          example_meaning: "test example meaning",
          source: "test",
          update_time: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          word_id: testWords[3].id,
          definition: "test definition",
          example: "test example",
          example_meaning: "test example meaning",
          source: "test",
          update_time: Date.now(),
        },
      ];

      await localDataSource.db.word.bulkAdd(testWords);
      await localDataSource.db.wordIndex.bulkAdd(testIndexes);
      await localDataSource.db.lexeme.bulkAdd(testLexemes);

      const results = await localDataSource.searchWord("asdfgh");
      expect(results).toHaveLength(4);
      // direct match should be first
      expect(results[0].id).toBe(testWords[1].id);
      // then form match
      expect(results[1].id).toBe(testWords[0].id);
      // then like lemma match
      expect(results[2].id).toBe(testWords[3].id);
      // then like index match
      expect(results[3].id).toBe(testWords[2].id);
    });
  });

  describe("createOrUpdateWordReview", () => {
    it("should create new review progress for new word", async () => {
      const wordId = crypto.randomUUID();
      await localDataSource.createOrUpdateWordReview(wordId);

      const progress = await localDataSource.db.reviewProgress
        .where("word_id")
        .equals(wordId)
        .first();
      expect(progress).toBeTruthy();
      expect(progress?.query_count).toBe(1);
      expect(progress?.review_count).toBe(0);
      expect(progress?.last_review_time).not.toBe(null);
      expect(progress?.last_last_review_time).toBeNull();
    });

    it("should update existing review progress", async () => {
      const wordId = crypto.randomUUID();
      await localDataSource.createOrUpdateWordReview(wordId);
      let progress = await localDataSource.db.reviewProgress
        .where("word_id")
        .equals(wordId)
        .first();
      expect(progress).toBeTruthy();
      expect(progress?.query_count).toBe(1);

      await localDataSource.createOrUpdateWordReview(wordId);
      progress = await localDataSource.db.reviewProgress
        .where("word_id")
        .equals(wordId)
        .first();
      expect(progress).toBeTruthy();
      expect(progress?.query_count).toBe(2);
    });
  });

  describe("getReviewProgressAtSnapshotWithWord", () => {
    it("should return review progress with word at given snapshot time", async () => {
      const wordId = crypto.randomUUID();
      const now = new Date().getTime();
      const testWord: DBTypes.Word = {
        id: wordId,
        lemma: "test",
        update_time: now,
        part_of_speech: "noun",
        phonetic: "test",
        phonetic_voice: null,
        phonetic_url: null,
      };

      await localDataSource.db.word.add(testWord);
      await localDataSource.createOrUpdateWordReview(wordId);

      const snapshotTime = new Date().getTime();
      const result = await localDataSource.getReviewProgressAtSnapshotWithWord(
        snapshotTime,
        0,
        10
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(result).toHaveLength(1);
      expect(result[0].word_id).toBe(wordId);
      expect(result[0].lemma).toBe("test");
      const newNow = new Date().getTime();
      expect(result[0].snapshot_next_reviewable_time).toBeLessThan(newNow);
    });
  });

  describe("sync", () => {
    const mockInitWords = [
      {
        id: "word-00",
        lemma: "test00",
        update_time: Date.now(),
        part_of_speech: "noun",
        phonetic: "test",
        phonetic_voice: null,
        phonetic_url: null,
      },
      {
        id: "word-01",
        lemma: "test01",
        update_time: Date.now(),
        part_of_speech: "noun",
        phonetic: "test",
        phonetic_voice: null,
        phonetic_url: null,
      },
    ];

    const mockInitWordIndexes = [
      {
        id: "word-00-index-00",
        word_id: "word-00",
        spell: "test00",
        form: null,
        update_time: Date.now(),
      },
      {
        id: "word-01-index-00",
        word_id: "word-01",
        spell: "test01",
        form: null,
        update_time: Date.now(),
      },
    ];

    const mockInitLexemes = [
      {
        id: "word-00-lexeme-00",
        word_id: "word-00",
        definition: "test-definition-00",
        example: "test-example-00",
        example_meaning: "test-example-meaning-00",
        source: "test-source-00",
        update_time: Date.now(),
      },
      {
        id: "word-01-lexeme-00",
        word_id: "word-01",
        definition: "test-definition-01",
        example: "test-example-01",
        example_meaning: "test-example-meaning-01",
        source: "test-source-01",
        update_time: Date.now(),
      },
    ];

    describe("syncWord", () => {
      it("should init word table from file only", async () => {
        const mockSyncAPI = new MockSyncAPI(
          mockInitWords,
          mockInitWordIndexes,
          mockInitLexemes
        );
        await mockSyncAPI.on();
        await localDataSource.syncWord();
        const now = new Date().getTime();
        const localVersion = (await localDataSource.db.meta.get("Word"))
          ?.version;
        expect(localVersion).approximately(now, 1000);
        const words = await localDataSource.db.word.toArray();
        expect(words).toHaveLength(mockInitWords.length);
        expect(words).toEqual(mockInitWords);
      });

      it("should init word table from both file and later addition", async () => {
        const mockSyncAPI = new MockSyncAPI(
          mockInitWords,
          mockInitWordIndexes,
          mockInitLexemes
        );
        mockSyncAPI.mockSyncWordResponse = [
          {
            id: "word-later-00",
            lemma: "later-00",
            part_of_speech: "noun",
            phonetic: "later-00",
            phonetic_voice: null,
            phonetic_url: null,
            update_time: Date.now(),
          },
        ];
        mockSyncAPI.mockSyncWordIndexResponse = [
          {
            id: "word-later-00-index-00",
            word_id: "word-later-00",
            spell: "later-00",
            form: null,
            update_time: Date.now(),
          },
        ];
        mockSyncAPI.mockSyncLexemeResponse = [
          {
            id: "word-later-00-lexeme-00",
            word_id: "word-later-00",
            definition: "later-00-definition",
            example: "later-00-example",
            example_meaning: "later-00-example-meaning",
            source: "later-00-source",
            update_time: Date.now(),
          },
        ];
        await mockSyncAPI.on();
        await localDataSource.syncWord();
        const words = await localDataSource.db.word.toArray();
        expect(words).toHaveLength(mockInitWords.length + 1);
      });

      it("should not sync word table if it is new enough", async () => {
        const mockSyncAPI = new MockSyncAPI(
          mockInitWords,
          mockInitWordIndexes,
          mockInitLexemes
        );
        await mockSyncAPI.on();
        // init word table
        await localDataSource.syncWord();
        mockSyncAPI.mockSyncWordResponse = [
          {
            id: "word-later-00",
            lemma: "later-00",
            part_of_speech: "noun",
            phonetic: "later-00",
            phonetic_voice: null,
            phonetic_url: null,
            update_time: Date.now(),
          },
        ];
        mockSyncAPI.mockSyncWordIndexResponse = [
          {
            id: "word-later-00-index-00",
            word_id: "word-later-00",
            spell: "later-00",
            form: null,
            update_time: Date.now(),
          },
        ];
        mockSyncAPI.mockSyncLexemeResponse = [
          {
            id: "word-later-00-lexeme-00",
            word_id: "word-later-00",
            definition: "later-00-definition",
            example: "later-00-example",
            example_meaning: "later-00-example-meaning",
            source: "later-00-source",
            update_time: Date.now(),
          },
        ];
        // do sync
        await localDataSource.syncWord();
        const words = await localDataSource.db.word.toArray();
        expect(words).toHaveLength(mockInitWords.length);
        expect(words).toEqual(mockInitWords);
      });

      it("should sync word table if it is not new enough", async () => {
        vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 0));
        const mockSyncAPI = new MockSyncAPI(
          mockInitWords,
          mockInitWordIndexes,
          mockInitLexemes
        );
        await mockSyncAPI.on();
        // init word table
        await localDataSource.syncWord();
        mockSyncAPI.mockSyncWordResponse = [
          {
            id: "word-later-00",
            lemma: "later-00",
            part_of_speech: "noun",
            phonetic: "later-00",
            phonetic_voice: null,
            phonetic_url: null,
            update_time: Date.now(),
          },
        ];
        vi.setSystemTime(new Date(2100, 1, 3, 0, 0, 20));
        await localDataSource.syncWord();
        const words = await localDataSource.db.word.toArray();
        expect(words).toHaveLength(mockInitWords.length + 1);
      });

      it("should be able to sync word table with force", async () => {
        vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 0));
        const mockSyncAPI = new MockSyncAPI(
          mockInitWords,
          mockInitWordIndexes,
          mockInitLexemes
        );
        await mockSyncAPI.on();
        await localDataSource.syncWord();
        vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 20));
        mockSyncAPI.mockSyncWordResponse = [
          {
            id: "word-later-00",
            lemma: "later-00",
            part_of_speech: "noun",
            phonetic: "later-00",
            phonetic_voice: null,
            phonetic_url: null,
            update_time: Date.now(),
          },
        ];
        await localDataSource.syncWord(true);
        const words = await localDataSource.db.word.toArray();
        expect(words).toHaveLength(mockInitWords.length + 1);
      });
    });

    describe("syncReviewProgress", () => {
      it("should be able to download review progress table", async () => {
        const mockSyncAPI = new MockSyncAPI(
          mockInitWords,
          mockInitWordIndexes,
          mockInitLexemes
        );
        await mockSyncAPI.on();
        mockSyncAPI.mockSyncReviewProgressResponse = [
          {
            id: "review-progress-00",
            word_id: "word-00",
            query_count: 1,
            review_count: 0,
            last_review_time: null,
            last_last_review_time: null,
            update_time: Date.now(),
          },
        ];
        await localDataSource.syncReviewProgress();
        const reviewProgress =
          await localDataSource.db.reviewProgress.toArray();
        expect(reviewProgress).toHaveLength(1);
      });

      it("should be able to upload review progress table", async () => {
        vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 0));
        const mockSyncAPI = new MockSyncAPI(
          mockInitWords,
          mockInitWordIndexes,
          mockInitLexemes
        );
        await mockSyncAPI.on();
        const localReviewProgress = {
          id: "review-progress-00",
          word_id: "word-00",
          query_count: 1,
          review_count: 0,
          last_review_time: null,
          last_last_review_time: null,
          update_time: Date.now(),
        };
        const remoteReviewProgress = {
          id: "review-progress-01",
          word_id: "word-01",
          query_count: 1,
          review_count: 0,
          last_review_time: null,
          last_last_review_time: null,
          update_time: Date.now(),
        };
        await localDataSource.updateReviewProgress(localReviewProgress);
        mockSyncAPI.expectedUploadingReviewProgress = [localReviewProgress];
        mockSyncAPI.mockSyncReviewProgressResponse = [remoteReviewProgress];
        vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 10));
        await localDataSource.syncReviewProgress();
        const reviewProgress =
          await localDataSource.db.reviewProgress.toArray();
        expect(reviewProgress).toHaveLength(2);
      });
    });
  });

  describe("createOrUpdateWordReview", () => {
    it("won't create duplicate review progress", async () => {
      const wordId = crypto.randomUUID();
      await localDataSource.createOrUpdateWordReview(wordId);
      await localDataSource.createOrUpdateWordReview(wordId);
      const reviewProgress = await localDataSource.db.reviewProgress.toArray();
      expect(reviewProgress).toHaveLength(1);
    });

    it("won't create duplicate review progress when remote and local create at the same time", async () => {
      // create local review progress
      const localEarler: DBTypes.Word = {
        id: "word-local-earlier",
        lemma: "test",
        update_time: Date.now(),
        part_of_speech: "noun",
        phonetic: "test",
        phonetic_voice: null,
        phonetic_url: null,
      };
      const localEarlerIndex: DBTypes.WordIndex = {
        id: "word-local-earlier-index-00",
        word_id: "word-local-earlier",
        spell: "test00",
        form: null,
        update_time: Date.now(),
      };
      const localEarlerLexeme: Lexeme = {
        id: "word-local-earlier-lexeme-00",
        word_id: "word-local-earlier",
        definition: "test-definition-00",
        example: "test-example-00",
        example_meaning: "test-example-meaning-00",
        source: "test-source-00",
        update_time: Date.now(),
      };
      const localLater: DBTypes.Word = {
        id: "word-local-later",
        lemma: "test",
        update_time: Date.now(),
        part_of_speech: "noun",
        phonetic: "test",
        phonetic_voice: null,
        phonetic_url: null,
      };
      const localLaterIndex: DBTypes.WordIndex = {
        id: "word-local-later-index-00",
        word_id: "word-local-later",
        spell: "test01",
        form: null,
        update_time: Date.now(),
      };
      const localLaterLexeme: Lexeme = {
        id: "word-local-later-lexeme-00",
        word_id: "word-local-later",
        definition: "test-definition-01",
        example: "test-example-01",
        example_meaning: "test-example-meaning-01",
        source: "test-source-01",
        update_time: Date.now(),
      };
      vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 0));
      const mockSyncAPI = new MockSyncAPI(
        [localEarler, localLater],
        [localEarlerIndex, localLaterIndex],
        [localEarlerLexeme, localLaterLexeme]
      );
      vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 1));
      await localDataSource.createOrUpdateWordReview(localEarler.id);
      vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 2));
      mockSyncAPI.mockSyncReviewProgressResponse = [
        {
          id: "local-earlier-review-progress-at-remote",
          word_id: localEarler.id,
          query_count: 1,
          review_count: 0,
          last_review_time: Date.now(),
          last_last_review_time: null,
          update_time: Date.now(),
        },
      ];
      vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 3));
      await localDataSource.createOrUpdateWordReview(localLater.id);
      vi.setSystemTime(new Date(2100, 1, 1, 0, 0, 4));
      // create remote review progress
      await mockSyncAPI.on();
      await localDataSource.syncReviewProgress();
      const reviewProgresses =
        await localDataSource.db.reviewProgress.toArray();
      expect(reviewProgresses).toHaveLength(2);
      console.log(reviewProgresses);
      expect(reviewProgresses.map((it) => it.word_id)).toContain(
        localEarler.id
      );
      expect(reviewProgresses.map((it) => it.id)).toContain(
        "local-earlier-review-progress-at-remote"
      );
    });
  });
});
