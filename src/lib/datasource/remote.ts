import { fetchWithSemaphore } from "../fetch";
import {
  ClientReviewProgressAtSnapshotWithWord,
  ClientSideDBReviewProgress,
  ReviewProgressAtSnapshot,
  ReviewProgressPatchPayload,
  Word,
  WordSearchResult,
} from "../types";
import { DataSource } from "./datasource";

export class RemoteDataSource implements DataSource {
  async getReviewProgressAtSnapshotWithWord(
    snapshotTime: number,
    offset: number,
    limit: number,
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>> {
    const response = await fetchWithSemaphore(
      `/api/review_progresses?snapshot_time=${snapshotTime}&offset=${offset}&limit=${limit}`,
    );
    return await response.json();
  }
  async getReviewProgressCount(): Promise<number> {
    const response = await fetchWithSemaphore("/api/review_progresses", {
      method: "HEAD",
    });
    return parseInt(response.headers.get("X-Total-Count") ?? "0");
  }

  async searchWord(spell: string): Promise<Array<WordSearchResult>> {
    const response = await fetchWithSemaphore(`/api/words?search=${spell}`);
    return await response.json();
  }

  async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
    const response = await fetchWithSemaphore(
      `/api/words?index_spell=${spell}`,
    );
    return await response.json();
  }

  async getWord(id: string): Promise<Word | null> {
    const response = await fetchWithSemaphore(`/api/words/${id}`);
    return await response.json();
  }

  async updateReviewProgress(reviewProgress: ClientSideDBReviewProgress) {
    const payload: ReviewProgressPatchPayload = {
      review_count: reviewProgress.review_count,
      last_last_review_time: reviewProgress.last_last_review_time,
      last_review_time: reviewProgress.last_review_time || undefined,
    };
    await fetchWithSemaphore(`/api/review_progresses/${reviewProgress.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
}

export const remoteDataSource = new RemoteDataSource();
