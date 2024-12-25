import { DataSource } from "./datasource";
import {
  ClientReviewProgressAtSnapshotWithWord,
  ClientSideDBReviewProgress,
  ClientSideReviewProgressAtSnapshot,
  DBTypes,
  Word,
  WordSearchResult,
} from "../types";
import { getDB } from "../frontend/db";
import { searchWord } from "../frontend/data/word";

const REVIEW_GAP_DAYS = [0, 1, 3, 7, 15, 30];

export class LocalDataSource implements DataSource {
  async getReviewProgressAtSnapshotWithWord(
    snapshotTime: number,
    offset: number,
    limit: number,
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>> {
    const localValue = localStorage.getItem(`review-${snapshotTime}`);
    if (localValue) {
      const localJson: Array<ClientSideReviewProgressAtSnapshot> =
        JSON.parse(localValue);
      return await Promise.all(
        localJson.slice(offset, offset + limit).map(async (progress) => {
          const word = await this.getWord(progress.word_id);
          return { ...progress, ...word! };
        }),
      );
    } else {
      const db = await getDB();
      const reviewProgresses = await db.reviewProgress.toArray();
      let reviewProgressesAtSnapshot: Array<ClientSideReviewProgressAtSnapshot> =
        reviewProgresses.map((progress) => {
          const next_reviewable_time =
            REVIEW_GAP_DAYS[progress.review_count] || null;
          const snapshot_before_last_review = progress.last_review_time
            ? snapshotTime < progress.last_review_time
            : false;
          let snapshot_next_reviewable_time;
          if (snapshot_before_last_review) {
            snapshot_next_reviewable_time = progress.last_last_review_time
              ? progress.last_last_review_time +
                24 * 60 * 60 * 1000 * REVIEW_GAP_DAYS[progress.review_count - 1]
              : null;
          } else {
            snapshot_next_reviewable_time = progress.last_review_time
              ? progress.last_review_time +
                24 * 60 * 60 * 1000 * REVIEW_GAP_DAYS[progress.review_count]
              : null;
          }
          return {
            ...progress,
            snapshot_next_reviewable_time,
            next_reviewable_time,
          };
        });
      reviewProgressesAtSnapshot.sort((a, b) => {
        return (
          (b.snapshot_next_reviewable_time || 0) -
          (a.snapshot_next_reviewable_time || 0)
        );
      });
      (async () => {
        Object.keys(localStorage)
          .filter((key) => key.startsWith("review-"))
          .forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(
          `review-${snapshotTime}`,
          JSON.stringify(reviewProgressesAtSnapshot),
        );
      })();
      return await Promise.all(
        reviewProgressesAtSnapshot
          .slice(offset, offset + limit)
          .map(async (progress) => {
            const word = await this.getWord(progress.word_id);
            return { ...progress, ...word! };
          }),
      );
    }
  }
  async getReviewProgressCount(): Promise<number> {
    const db = await getDB();
    return await db.reviewProgress.count();
  }
  async getWord(id: string): Promise<Word | null> {
    const db = await getDB();
    const word = await db.word.get(id);
    if (word === undefined) {
      return null;
    }
    const wordIndexes = await db.wordIndex
      .where("word_id")
      .equals(word.id)
      .toArray();
    const lexemes = await db.lexeme.where("word_id").equals(word.id).toArray();
    return { ...word, indexes: wordIndexes, lexemes };
  }

  async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
    const db = await getDB();
    const directMatch = await db.word.where("lemma").equals(spell).toArray();
    const formMatch = await db.wordIndex
      .where("spell")
      .equals(spell)
      .toArray()
      .then((indexes) =>
        indexes.filter((it) => it.form !== null).map((it) => it.word_id),
      )
      .then((ids) => db.word.where("id").anyOf(ids).toArray())
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
      resultWords = await db.wordIndex
        .where("spell")
        .equals(spell)
        .toArray()
        .then((indexes) => indexes.map((it) => it.word_id))
        .then((ids) => db.word.where("id").anyOf(ids).toArray())
        .then((result) =>
          result.sort(
            (a, b) =>
              Math.abs(a.lemma.length - spell.length) -
              Math.abs(b.lemma.length - spell.length),
          ),
        );
    }
    if (resultWords.length === 0 && spell[0].toLocaleUpperCase() === spell[0]) {
      return await this.getWordsByIndexSpell(spell.toLowerCase());
    }
    const result = await Promise.all(
      resultWords.map(async (word) => {
        const [indexes, lexemes] = await Promise.all([
          db.wordIndex.where("word_id").equals(word.id).toArray(),
          db.lexeme.where("word_id").equals(word.id).toArray(),
        ]);
        return { ...word, indexes, lexemes };
      }),
    );
    return result;
  }

  async searchWord(spell: string): Promise<Array<WordSearchResult>> {
    return await searchWord(spell);
  }

  async updateReviewProgress(
    reviewProgress: ClientSideDBReviewProgress,
  ): Promise<void> {
    const db = await getDB();
    await db.reviewProgress.put(reviewProgress);
  }
}

export const localDataSource = new LocalDataSource();
