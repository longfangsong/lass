import { expect, test, describe, beforeEach, vi, afterEach } from "vitest";
import { env } from "cloudflare:test";
import {
  createReviewProgess,
  getReviewProgressesAtSnapshot,
  updateReviewProgress,
  getReviewProgressesOfUserCount,
  getReviewProgressesUpdatedAfter,
} from "./review_progress";

const wordIds = [
  "c50b3c3f-039f-4eab-ae0d-822e8b9729ea",
  "8fe8315a-d718-4af7-bb17-2c0df9c44386",
  "0630931c-9b51-4ef6-b477-ad4ffb590016",
  "8802ad51-b2e6-47f7-8aaf-11cface826ea"
];
describe("Test dealing with ReviewProgress", () => {
  test("should be able to deal with a single review progess", async () => {
    // create a review progess at t=10
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 10));
    await createReviewProgess(env.DB, "a@b.com", wordIds[0]);

    // start a snapshot at 20
    const snapshotTime = new Date(2000, 1, 1, 0, 0, 20).getTime();
    vi.setSystemTime(snapshotTime);
    const firstSearch = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      snapshotTime,
      0,
      10,
    );
    expect(firstSearch.length).toBe(1);
    let result = firstSearch[0];
    // should be reviewable now
    expect(result.next_reviewable_time).lessThanOrEqual(snapshotTime);
    // review it
    const reviewTime = new Date(2000, 1, 1, 0, 0, 30).getTime();
    vi.setSystemTime(reviewTime);
    await updateReviewProgress(env.DB, result.id, {
      review_count: 1,
      last_last_review_time: result.last_review_time!,
      last_review_time: reviewTime,
    });
    expect(await getReviewProgressesOfUserCount(env.DB, "a@b.com")).toBe(1);
    const secondSearchOnSamesnapshot = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      snapshotTime,
      0,
      10,
    );
    result = secondSearchOnSamesnapshot[0];
    // should not be reviewable now
    expect(result.next_reviewable_time).greaterThanOrEqual(reviewTime);
    // but in the snapshot, it "seems" to be still reviewable
    expect(result.snapshot_next_reviewable_time).lessThanOrEqual(reviewTime);
    // 1 day passed after the review
    const secondReviewTime = new Date(2000, 1, 2, 0, 0, 40).getTime();
    vi.setSystemTime(reviewTime);
    const thirdSearch = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      secondReviewTime,
      0,
      10,
    );
    result = thirdSearch[0];
    // should be reviewable now
    expect(result.next_reviewable_time).lessThanOrEqual(secondReviewTime);
  });

  test("should order review progesses correctly", async () => {
    // create a review progess at t=10
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 10));
    await createReviewProgess(env.DB, "a@b.com", wordIds[0]);
    // create a review progess at t=20
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 20));
    await createReviewProgess(env.DB, "a@b.com", wordIds[1]);
    // create a snapshot at t=20
    let snapshotTime = new Date(2000, 1, 1, 0, 0, 30).getTime();
    vi.setSystemTime(snapshotTime);
    let searchResult = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      snapshotTime,
      0,
      10,
    );
    expect(searchResult.length).toBe(2);
    expect(searchResult[0].word_id).toBe(wordIds[0]);
    expect(searchResult[1].word_id).toBe(wordIds[1]);
    // review should not have affect order on the same snapshot
    let reviewTime = new Date(2000, 1, 1, 0, 0, 40).getTime();
    await updateReviewProgress(env.DB, searchResult[0].id, {
      review_count: 1,
      last_last_review_time: searchResult[0].last_review_time!,
      last_review_time: reviewTime,
    });
    vi.setSystemTime(reviewTime);
    searchResult = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      snapshotTime,
      0,
      10,
    );
    expect(searchResult.length).toBe(2);
    expect(searchResult[0].word_id).toBe(wordIds[0]);
    expect(searchResult[1].word_id).toBe(wordIds[1]);
    // but affects a new snapshot
    snapshotTime = new Date(2000, 1, 1, 0, 0, 50).getTime();
    searchResult = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      snapshotTime,
      0,
      10,
    );
    expect(searchResult.length).toBe(2);
    expect(searchResult[0].word_id).toBe(wordIds[1]);
    expect(searchResult[1].word_id).toBe(wordIds[0]);
    // finished review should be putted at the end
    reviewTime = new Date(2000, 1, 1, 0, 0, 60).getTime();
    await updateReviewProgress(env.DB, searchResult[1].id, {
      review_count: 6,
      last_last_review_time: searchResult[1].last_review_time!,
      last_review_time: reviewTime,
    });
    snapshotTime = new Date(2000, 1, 1, 0, 0, 70).getTime();
    searchResult = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      snapshotTime,
      0,
      10,
    );
    expect(searchResult.length).toBe(2);
    expect(searchResult[0].word_id).toBe(wordIds[1]);
    expect(searchResult[1].word_id).toBe(wordIds[0]);
  });

  test("should be able to get review progresses updated after a certain time", async () => {
    vi.useRealTimers();
    await createReviewProgess(env.DB, "a@b.com", wordIds[2]);
    await createReviewProgess(env.DB, "a@b.com", wordIds[3]);
    const searchResult = await getReviewProgressesAtSnapshot(
      env.DB,
      "a@b.com",
      new Date().getTime(),
      0,
      10,
    );
    expect(searchResult.length).toBe(2);
    const beforeUpdate = new Date().getTime();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await updateReviewProgress(env.DB, searchResult[0].id, {
      review_count: 1,
      last_last_review_time: searchResult[0].last_review_time!,
      last_review_time: beforeUpdate,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = await getReviewProgressesUpdatedAfter(
      env.DB,
      "a@b.com",
      beforeUpdate,
      0,
      10,
    );
    expect(data.length).toBe(1);
  });
});
