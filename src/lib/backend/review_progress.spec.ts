import { expect, test, describe, beforeEach, vi, afterEach } from "vitest";
import { env } from "cloudflare:test";
import {
  createReviewProgess,
  updateReviewProgress,
  getReviewProgressesOfUserCount,
  getReviewProgressAtSnapshotWithWord,
  getReviewProgress,
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
    const firstSearch = await getReviewProgressAtSnapshotWithWord(
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
    const secondSearchOnSamesnapshot = await getReviewProgressAtSnapshotWithWord(
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
    const thirdSearch = await getReviewProgressAtSnapshotWithWord(
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
    let searchResult = await getReviewProgressAtSnapshotWithWord(
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
    searchResult = await getReviewProgressAtSnapshotWithWord(
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
    searchResult = await getReviewProgressAtSnapshotWithWord(
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
    searchResult = await getReviewProgressAtSnapshotWithWord(
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

  test("review progress should be ordered correctly when last_review_time and last_last_review_time are null", async () => {
    // create review progesses at t=10
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 10));
    const reviewProgress0 = await createReviewProgess(env.DB, "a@b.com", wordIds[0]);
    const reviewProgress1 = await createReviewProgess(env.DB, "a@b.com", wordIds[1]);
    const reviewProgress2 = await createReviewProgess(env.DB, "a@b.com", wordIds[2]);
    const reviewProgress3 = await createReviewProgess(env.DB, "a@b.com", wordIds[3]);
    // review [0] at t=20
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 20));
    let reviewTime = new Date(2000, 1, 1, 0, 0, 20).getTime();
    let reviewProgress = await getReviewProgress(env.DB, reviewProgress0);
    await updateReviewProgress(env.DB, reviewProgress0, {
      review_count: 1,
      last_last_review_time: reviewProgress!.last_review_time,
      last_review_time: reviewTime,
    });
    reviewProgress = await getReviewProgress(env.DB, reviewProgress0);
    expect(reviewProgress!.last_last_review_time).not.toBe(null);
    expect(reviewProgress!.last_review_time).not.toBe(null);
    // update [1] directly to be "Done" at 30
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 30));
    reviewTime = new Date(2000, 1, 1, 0, 0, 30).getTime();
    reviewProgress = await getReviewProgress(env.DB, reviewProgress1);
    await updateReviewProgress(env.DB, reviewProgress1, {
      review_count: 6
    });
    reviewProgress = await getReviewProgress(env.DB, reviewProgress1);
    // [1]'s last_last_review_time should be null
    expect(reviewProgress!.last_last_review_time).toBe(null);
    // [1]'s last_review_time should also be null
    expect(reviewProgress!.last_review_time).not.toBe(null);
    // search should return [2, 3, 0, 1]
    const searchResult = await getReviewProgressAtSnapshotWithWord(
      env.DB,
      "a@b.com",
      reviewTime,
      0,
      10,
    );
    expect(searchResult.length).toBe(4);
    expect(searchResult[0].word_id).toBe(wordIds[2]);
    expect(searchResult[1].word_id).toBe(wordIds[3]);
    expect(searchResult[2].word_id).toBe(wordIds[0]);
    expect(searchResult[3].word_id).toBe(wordIds[1]);
  });
});
