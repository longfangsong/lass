import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalDataSource } from "./local";
import { DBTypes } from "../../types";

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

      const snapshotTime = now;
      const result = await localDataSource.getReviewProgressAtSnapshotWithWord(
        snapshotTime,
        0,
        10
      );

      expect(result).toHaveLength(1);
      expect(result[0].word_id).toBe(wordId);
      expect(result[0].lemma).toBe("test");
      const newNow = new Date().getTime();
      expect(result[0].snapshot_next_reviewable_time).toBeLessThan(newNow);
    });
  });
});
