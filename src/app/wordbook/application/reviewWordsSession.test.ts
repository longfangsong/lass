import { describe, test, expect, vi } from "vitest";
import { ReviewWordsSession } from "./reviewWordsSession";
import type { Repository } from "../domain/repository";
import type { Word, WordBookEntry, WordBookEntryWithDetails, UserSettings } from "@/types";
import { AutoNewReviewPolicy } from "@/types";
import { createEntry } from "../domain/model";

// Mock the repository module to avoid IndexedDB initialization
vi.mock("../infrastructure/repository", () => ({
  wordTable: {
    bulkGet: vi.fn(),
  },
}));

// Helper function to create a Word
function createWord(id: string, frequency: number | null = null): Word {
  return {
    id,
    lemma: `word_${id}`,
    part_of_speech: "noun",
    phonetic: null,
    phonetic_url: null,
    phonetic_voice: null,
    update_time: Date.now(),
    frequency,
    indexes: [],
    lexemes: [
      {
        id: `lex_${id}`,
        word_id: id,
        definition: `Definition for ${id}`,
        example: null,
        example_meaning: null,
        source: "test",
        update_time: Date.now(),
      },
    ],
  };
}

// Helper function to create WordBookEntryWithDetails
function createEntryWithDetails(
  wordId: string,
  passiveCount: number = 0,
  nextPassiveTime: number = Date.now(),
  activeCount: number = 0,
  nextActiveTime: number = -1,
): WordBookEntryWithDetails {
  const word = createWord(wordId);
  const entry = createEntry(wordId);
  return {
    ...entry,
    ...word,
    passive_review_count: passiveCount,
    next_passive_review_time: nextPassiveTime,
    active_review_count: activeCount,
    next_active_review_time: nextActiveTime,
  };
}

// Mock repository factory
function createMockRepository(overrides: Partial<Repository> = {}): Repository {
  const defaults: Repository = {
    version: Promise.resolve(1),
    all: Promise.resolve([]),
    setVersion: async () => {},
    getByWordId: async () => undefined,
    insert: async () => {},
    update: async () => {},
    bulkUpdate: async () => {},
    upsert: async () => {},
    filter: async () => [],
    reviewNotStarted: async () => [],
    needPassiveReviewNow: async () => [],
    needActiveReviewNow: async () => [],
    allInReview: async () => [],
    updatedBetween: async () => [],
  };
  
  return { ...defaults, ...overrides };
}

// Default settings
const defaultSettings: UserSettings = {
  auto_new_review: AutoNewReviewPolicy.No,
  daily_new_review_count: 20,
  update_time: Date.now(),
  theme: "system",
  notifications_enabled: false,
  notification_permission_status: "default" as any,
};

describe("ReviewWordsManager", () => {
  describe("next() - basic functionality", () => {
    test("returns null when no reviews are available", async () => {
      const repository = createMockRepository();
      const manager = new ReviewWordsSession(repository, defaultSettings);

      const result = await manager.next();

      expect(result).toBeNull();
    });

    test("returns passive review entries first", async () => {
      const passiveEntry = createEntry("word1");
      const passiveDetail = createEntryWithDetails("word1");

      const repository = createMockRepository({
        needPassiveReviewNow: async () => [passiveEntry],
        needActiveReviewNow: async () => [],
      });

      const getDetail = async (_entry: WordBookEntry) => passiveDetail;
      const manager = new ReviewWordsSession(
        repository,
        defaultSettings,
        getDetail,
      );

      const result = await manager.next();

      expect(result?.entry).toEqual(passiveDetail);
    });

    test("returns null after all reviews are exhausted", async () => {
      const entry = createEntry("word1");
      const detail = createEntryWithDetails("word1");

      const repository = createMockRepository({
        needPassiveReviewNow: async () => [entry],
        needActiveReviewNow: async () => [],
      });

      const getDetail = async () => detail;
      const manager = new ReviewWordsSession(
        repository,
        defaultSettings,
        getDetail,
      );

      await manager.next(); // First review
      const result = await manager.next(); // No more reviews

      expect(result).toBeNull();
    });

    test("handles multiple passive and active reviews correctly", async () => {
      const passiveEntries = [createEntry("word1"), createEntry("word2")];
      const activeEntries = [createEntry("word3"), createEntry("word4")];

      const details: Record<string, WordBookEntryWithDetails> = {
        word1: createEntryWithDetails("word1"),
        word2: createEntryWithDetails("word2"),
        word3: createEntryWithDetails("word3", 0, Date.now(), 1),
        word4: createEntryWithDetails("word4", 0, Date.now(), 1),
      };

      const repository = createMockRepository({
        needPassiveReviewNow: async () => passiveEntries,
        needActiveReviewNow: async () => activeEntries,
      });

      const getDetail = async (entry: WordBookEntry) => details[entry.word_id];

      const manager = new ReviewWordsSession(
        repository,
        defaultSettings,
        getDetail,
      );

      const results = [];
      for (let i = 0; i < 4; i++) {
        results.push(await manager.next());
      }

      expect(results[0]?.entry).toEqual(details.word1);
      expect(results[1]?.entry).toEqual(details.word2);
      expect(results[2]?.entry).toEqual(details.word3);
      expect(results[3]?.entry).toEqual(details.word4);
    });
  });

  describe("next() - auto replenish passive reviews", () => {
    test("does not replenish when auto_new_review is No", async () => {
      const repository = createMockRepository({
        needPassiveReviewNow: async () => [],
        needActiveReviewNow: async () => [],
        reviewNotStarted: async () => [createEntry("word1")],
        all: Promise.resolve([]),
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.No,
        daily_new_review_count: 20,
      };

      const manager = new ReviewWordsSession(repository, settings);

      const result = await manager.next();

      expect(result).toBeNull();
    });

    test("replenishes when under daily limit with Random policy", async () => {
      const notStartedEntry = createEntry("word_new");
      const newDetail = createEntryWithDetails("word_new");

      // Mock that insert was called, then return the new entry
      let callCount = 0;
      const repository = createMockRepository({
        needPassiveReviewNow: async () => {
          callCount++;
          // First call: no reviews, second call: return new review after insert
          return callCount === 1 ? [] : [notStartedEntry];
        },
        needActiveReviewNow: async () => [],
        reviewNotStarted: async () => [notStartedEntry],
        all: Promise.resolve([]),
        insert: vi.fn(async () => {}),
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.Random,
        daily_new_review_count: 20,
      };

      const bulkGetWord = async () => [createWord("word_new")];
      const getDetail = async () => newDetail;

      const manager = new ReviewWordsSession(
        repository,
        settings,
        getDetail,
        bulkGetWord,
      );

      const result = await manager.next();

      expect(result?.entry).toEqual(newDetail);
      expect(repository.insert).toHaveBeenCalled();
    });

    test("replenishes correct number when some reviews already started", async () => {
      // Create an entry started today but not needing review now (reviewed yesterday, next review tomorrow)
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      const alreadyStarted = createEntryWithDetails("word1", 1, tomorrow);
      
      const notStartedEntries = [
        createEntry("word2"),
        createEntry("word3"),
        createEntry("word4"),
      ];

      const newDetails: Record<string, WordBookEntryWithDetails> = {
        word2: createEntryWithDetails("word2"),
        word3: createEntryWithDetails("word3"),
      };

      let callCount = 0;
      const repository = createMockRepository({
        needPassiveReviewNow: async () => {
          callCount++;
          // Second call returns newly inserted entries
          return callCount === 1 ? [] : notStartedEntries.slice(0, 2);
        },
        needActiveReviewNow: async () => [],
        reviewNotStarted: async () => notStartedEntries,
        all: Promise.resolve([alreadyStarted]),
        insert: vi.fn(async () => {}),
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.FirstCome,
        daily_new_review_count: 3, // Want 3 total, already have 1 started today
      };

      const getDetail = async (entry: WordBookEntry) => newDetails[entry.word_id];

      const manager = new ReviewWordsSession(repository, settings, getDetail);

      const first = await manager.next();
      const second = await manager.next();

      expect(first?.entry).toBeDefined();
      expect(second?.entry).toBeDefined();
      expect(repository.insert).toHaveBeenCalledTimes(2); // Should start 2 new reviews
    });

    test("does not replenish when daily limit is met", async () => {
      const existingEntries = [
        createEntryWithDetails("word1", 0, Date.now()),
        createEntryWithDetails("word2", 0, Date.now()),
      ];

      const repository = createMockRepository({
        needPassiveReviewNow: async () => [],
        needActiveReviewNow: async () => [],
        reviewNotStarted: async () => [createEntry("word_new")],
        all: Promise.resolve(existingEntries),
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.Random,
        daily_new_review_count: 2, // Already have 2
      };

      const manager = new ReviewWordsSession(repository, settings);

      const result = await manager.next();

      expect(result).toBeNull();
    });

    test("replenishes with MostFrequent policy", async () => {
      const notStartedEntries = [
        createEntry("word1"),
        createEntry("word2"),
        createEntry("word3"),
      ];

      const words: Record<string, Word> = {
        word1: createWord("word1", 100),
        word2: createWord("word2", 200), // Most frequent
        word3: createWord("word3", 50),
      };

      const newDetail = createEntryWithDetails("word2");

      let callCount = 0;
      const repository = createMockRepository({
        needPassiveReviewNow: async () => {
          callCount++;
          return callCount === 1 ? [] : [notStartedEntries[1]];
        },
        needActiveReviewNow: async () => [],
        reviewNotStarted: async () => notStartedEntries,
        all: Promise.resolve([]),
        insert: async () => {},
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.MostFrequent,
        daily_new_review_count: 1,
      };

      const bulkGetWord = async (ids: string[]) => ids.map(id => words[id]);
      const getDetail = async () => newDetail;

      const manager = new ReviewWordsSession(
        repository,
        settings,
        getDetail,
        bulkGetWord,
      );

      const result = await manager.next();

      expect(result).toBeDefined();
    });

    test("handles case when no not-started entries exist", async () => {
      const repository = createMockRepository({
        needPassiveReviewNow: async () => [],
        needActiveReviewNow: async () => [],
        reviewNotStarted: async () => [], // No entries to start
        all: Promise.resolve([]),
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.Random,
        daily_new_review_count: 20,
      };

      const manager = new ReviewWordsSession(repository, settings);

      const result = await manager.next();

      expect(result).toBeNull();
    });
  });

  describe("next() - integration scenarios", () => {
    test("handles mixed scenario: passive, active, then auto-replenish", async () => {
      const passiveEntry = createEntry("passive1");
      const activeEntry = createEntry("active1");
      const notStartedEntry = createEntry("new1");

      const passiveDetail = createEntryWithDetails("passive1");
      const activeDetail = createEntryWithDetails("active1", 0, Date.now(), 1);
      const newDetail = createEntryWithDetails("new1");

      const details: Record<string, WordBookEntryWithDetails> = {
        passive1: passiveDetail,
        active1: activeDetail,
        new1: newDetail,
      };

      let callCount = 0;
      const repository = createMockRepository({
        needPassiveReviewNow: async () => {
          callCount++;
          return callCount === 1 ? [passiveEntry] : [notStartedEntry];
        },
        needActiveReviewNow: async () => [activeEntry],
        reviewNotStarted: async () => [notStartedEntry],
        all: Promise.resolve([passiveDetail]),
        insert: vi.fn(async () => {}),
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.Random,
        daily_new_review_count: 5,
      };

      const getDetail = async (entry: WordBookEntry) => details[entry.word_id];

      const manager = new ReviewWordsSession(repository, settings, getDetail);

      const first = await manager.next(); // passive
      const second = await manager.next(); // active
      const third = await manager.next(); // auto-replenished

      expect(first?.entry).toEqual(passiveDetail);
      expect(second?.entry).toEqual(activeDetail);
      expect(third?.entry).toEqual(newDetail);
      expect(repository.insert).toHaveBeenCalledTimes(1);
    });

    test("consecutive next() calls reuse loaded reviews", async () => {
      const entries = [createEntry("word1"), createEntry("word2")];
      const details: Record<string, WordBookEntryWithDetails> = {
        word1: createEntryWithDetails("word1"),
        word2: createEntryWithDetails("word2"),
      };

      const needPassiveReviewNow = vi.fn(async () => entries);
      const needActiveReviewNow = vi.fn(async () => []);
      
      const repository = createMockRepository({
        needPassiveReviewNow,
        needActiveReviewNow,
      });

      const getDetail = async (entry: WordBookEntry) => details[entry.word_id];

      const manager = new ReviewWordsSession(
        repository,
        defaultSettings,
        getDetail,
      );

      await manager.next();
      await manager.next();

      // Should only call repository methods once
      expect(needPassiveReviewNow).toHaveBeenCalledTimes(1);
      expect(needActiveReviewNow).toHaveBeenCalledTimes(1);
    });

    test("handles FirstCome policy correctly", async () => {
      const notStartedEntries = [
        createEntry("word1"),
        createEntry("word2"),
        createEntry("word3"),
      ];

      const newDetail = createEntryWithDetails("word1"); // First should be picked

      let callCount = 0;
      const repository = createMockRepository({
        needPassiveReviewNow: async () => {
          callCount++;
          return callCount === 1 ? [] : [notStartedEntries[0]];
        },
        needActiveReviewNow: async () => [],
        reviewNotStarted: async () => notStartedEntries,
        all: Promise.resolve([]),
        insert: async () => {},
      });

      const settings: UserSettings = {
        ...defaultSettings,
        auto_new_review: AutoNewReviewPolicy.FirstCome,
        daily_new_review_count: 1,
      };

      const getDetail = async () => newDetail;

      const manager = new ReviewWordsSession(repository, settings, getDetail);

      const result = await manager.next();

      expect(result?.entry).toEqual(newDetail);
    });
  });

  describe("edge cases", () => {
    test("handles empty settings gracefully", async () => {
      const repository = createMockRepository({
        needPassiveReviewNow: async () => [],
        needActiveReviewNow: async () => [],
        all: Promise.resolve([]),
      });

      // @ts-expect-error Testing undefined settings
      const manager = new ReviewWordsSession(repository, undefined);

      const result = await manager.next();

      expect(result).toBeNull();
    });
  });
});
